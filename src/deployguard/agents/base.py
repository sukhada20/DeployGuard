"""Base classes for all DeployGuard agents.

Provides two base agent patterns:

1. ``BaseDeployGuardAgent`` — extends ``google.adk.agents.BaseAgent`` for
   custom orchestration logic with full control over the event loop.

2. ``create_llm_agent()`` — factory that wraps ``google.adk.agents.LlmAgent``
   with DeployGuard-standard model selection and gateway tool registration.

Model selection
---------------
Set ``DEPLOYGUARD_MODEL_FAST`` to override the default fast model (gemini-3.5-flash).
Set ``DEPLOYGUARD_MODEL_DECISION`` to override the decision model (gemini-2.5-pro).
"""

from __future__ import annotations

import logging
import os
from abc import abstractmethod
from collections.abc import AsyncGenerator, Callable

from google.adk.agents import BaseAgent, InvocationContext, LlmAgent
from google.adk.events.event import Event

from deployguard.state.workflow import DeploymentWorkflowState

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Model configuration                                                          #
# --------------------------------------------------------------------------- #

DEFAULT_MODEL_FAST: str = os.environ.get("DEPLOYGUARD_MODEL_FAST", "gemini-3.5-flash")
"""Default model for fast, high-throughput agents (monitoring, memory, postmortem)."""

DEFAULT_MODEL_DECISION: str = os.environ.get(
    "DEPLOYGUARD_MODEL_DECISION", "gemini-2.5-pro"
)
"""Default model for the decision agent (complex reasoning, low-latency tolerance)."""


# --------------------------------------------------------------------------- #
# BaseDeployGuardAgent — custom ADK BaseAgent subclass                         #
# --------------------------------------------------------------------------- #


class BaseDeployGuardAgent(BaseAgent):
    """Base class for all DeployGuard specialized agents.

    Provides:
    - Structured access to DeploymentWorkflowState via ADK session state
    - Agent identity enforcement (agent_id must match registry)
    - Lifecycle logging

    Note: ADK 2.x requires ``name`` to be a valid Python identifier (underscores,
    no hyphens). The ``agent_id`` field maps to the Agent Registry's agent_id.
    """

    # Declared as a Pydantic model field so ADK's __init__ can accept it
    agent_id: str = ""

    def get_workflow_state(
        self, ctx: InvocationContext
    ) -> DeploymentWorkflowState | None:
        """Retrieve current workflow state from session."""
        raw = ctx.session.state.get("workflow_state")
        if raw is None:
            return None
        return DeploymentWorkflowState.from_session_dict(raw)

    def set_workflow_state(
        self, ctx: InvocationContext, state: DeploymentWorkflowState
    ) -> None:
        """Persist workflow state to session."""
        ctx.session.state["workflow_state"] = state.to_session_dict()

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        """Execute agent logic with distributed tracing instrumentation."""
        logger.info("Agent %s (%s) invoked", self.name, self.agent_id)
        from deployguard.telemetry.tracer import inject_trace_context, trace_agent_step

        with trace_agent_step(self.name, agent_id=self.agent_id):
            if "trace_context" not in ctx.session.state:
                ctx.session.state["trace_context"] = {}
            inject_trace_context(ctx.session.state["trace_context"])
            async for event in self._execute(ctx):
                yield event

    @abstractmethod
    def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Agent-specific execution logic. Override in each specialized agent."""
        ...


# --------------------------------------------------------------------------- #
# create_llm_agent — LlmAgent factory for tool-using agents                   #
# --------------------------------------------------------------------------- #


def create_llm_agent(
    name: str,
    instruction: str,
    tools: list[Callable] | None = None,
    model: str | None = None,
    agent_id: str = "",
) -> LlmAgent:
    """Factory for creating a DeployGuard LlmAgent with standard configuration.

    Args:
        name: ADK agent name (must be a valid Python identifier).
        instruction: System instruction for the LLM.
        tools: List of callable tools to register with the agent.
        model: Gemini model name. Defaults to DEFAULT_MODEL_FAST.
        agent_id: DeployGuard registry agent ID (stored in description for tracing).

    Returns:
        A configured ``LlmAgent`` instance ready for invocation.
    """
    resolved_model = model or DEFAULT_MODEL_FAST
    description = (
        f"DeployGuard agent: {agent_id}" if agent_id else f"DeployGuard agent: {name}"
    )

    logger.info(
        "Creating LlmAgent name=%s model=%s agent_id=%s",
        name,
        resolved_model,
        agent_id,
    )

    return LlmAgent(
        name=name,
        model=resolved_model,
        instruction=instruction,
        tools=tools or [],  # type: ignore[arg-type]
        description=description,
    )
