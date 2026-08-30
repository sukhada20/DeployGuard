"""Base class for all DeployGuard agents."""

import logging
from abc import abstractmethod
from collections.abc import AsyncGenerator

from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events.event import Event

from deployguard.state.workflow import DeploymentWorkflowState

logger = logging.getLogger(__name__)


class BaseDeployGuardAgent(BaseAgent):
    """Base class for all DeployGuard specialized agents.

    Provides:
    - Structured access to DeploymentWorkflowState via ADK session state
    - Agent identity enforcement (agent_id must match registry)
    - Lifecycle logging

    Note: ADK 2.x requires `name` to be a valid Python identifier (underscores,
    no hyphens). The `agent_id` field maps to the Agent Registry's agent_id.
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
        """Execute agent logic."""
        logger.info("Agent %s (%s) invoked", self.name, self.agent_id)
        async for event in self._execute(ctx):
            yield event

    @abstractmethod
    def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        """Agent-specific execution logic. Override in each specialized agent."""
        ...
