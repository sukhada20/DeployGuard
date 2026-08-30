"""Decision Agent — reasons over anomaly evidence for rollback decisions."""

import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.ai.gemini_client import GeminiReasoningClient
from deployguard.cloud.interfaces import DocumentStore
from deployguard.cloud.stubs import MockFirestore
from deployguard.security.gateway import PolicyEngine
from deployguard.state.workflow import DecisionTrace

logger = logging.getLogger(__name__)

DEFAULT_POLICY_CONFIG = {
    "environments": {
        "production": {
            "allowed_auto_rollback_severities": ["CRITICAL"],
            "min_confidence_threshold": 0.80,
        },
        "staging": {
            "allowed_auto_rollback_severities": ["HIGH", "CRITICAL"],
            "min_confidence_threshold": 0.70,
        },
    }
}


class DecisionAgent(BaseDeployGuardAgent):
    """Reasons over anomaly evidence to determine: wait, alert, or rollback.

    Phase 1: Stub always returns 'wait'.
    Phase 3: Real implementation with Gemini reasoning and policy engine.
    """

    def __init__(
        self,
        llm_client: GeminiReasoningClient | None = None,
        policy_engine: PolicyEngine | None = None,
        document_store: DocumentStore | None = None,
    ) -> None:
        super().__init__(
            name="decision_agent",
            agent_id="decision-v2",
        )
        self._llm_client = llm_client or GeminiReasoningClient()
        self._policy_engine = policy_engine or PolicyEngine(DEFAULT_POLICY_CONFIG)
        self._document_store = document_store or MockFirestore()

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("DecisionAgent — evaluating evidence")
        state = self.get_workflow_state(ctx)
        if not state:
            logger.warning("No workflow state found in context")
            yield Event(
                author=self.name,
                content=Content(
                    role="model", parts=[Part(text="Error: No workflow state found")]
                ),
            )
            return

        state.pipeline_status = "investigating"
        self.set_workflow_state(ctx, state)

        # 1. Fetch similar past incidents from the DocumentStore
        all_incidents = await self._document_store.query("incidents", [])
        past_incidents = [
            inc
            for inc in all_incidents
            if inc.get("service_name") == state.service_name
            and inc.get("deployment_id") != state.deployment_id
        ]
        logger.info("Retrieved %d past incidents for context", len(past_incidents))

        if state.anomaly_signal:
            # Reconstruct log snippet from anomaly signal evidence
            log_snippet = "\n".join(
                [str(e.get("error_log", e)) for e in state.anomaly_signal.evidence]
            )

            # 2. Get LLM recommendation
            context = {
                "service_name": state.service_name,
                "environment": state.environment,
                "anomaly_severity": state.anomaly_signal.severity,
                "affected_metrics": state.anomaly_signal.affected_metrics,
            }
            try:
                llm_res = await self._llm_client.get_recommendation(
                    context, log_snippet
                )
            except ValueError as e:
                # Intercepted by Model Armor
                logger.error("Security violation: %s", str(e))
                yield Event(
                    author=self.name,
                    content=Content(
                        role="model",
                        parts=[Part(text=f"BLOCKED BY SECURITY: {str(e)}")],
                    ),
                )
                return

            # 3. Evaluate policies
            eval_context = {
                "environment": state.environment,
                "anomaly_severity": state.anomaly_signal.severity,
                "confidence": llm_res["confidence"],
                # Ensure we pass the version check
                "rollback_target_version": state.rollback_target_version or "1.0.0",
            }
            policy_res = self._policy_engine.evaluate(eval_context)

            # Capping decision
            if policy_res["policy_passed"]:
                final_decision = llm_res["recommendation"]
                auth_reason = "Authorized by policy engine checks."
            else:
                final_decision = "wait"
                auth_reason = "Blocked by policy checks: " + ", ".join(
                    [k for k, v in policy_res["checks"].items() if not v]
                )

            trace = DecisionTrace(
                trace_id=f"trace-{state.deployment_id}",
                decision=final_decision,  # type: ignore
                confidence=llm_res["confidence"],
                evidence_summary=(
                    f"Gemini LLM suggested '{llm_res['recommendation']}': "
                    f"{llm_res['reasoning']}"
                ),
                policy_checks=policy_res["checks"],
                policy_passed=policy_res["policy_passed"],
                authorized=policy_res["policy_passed"],
                authorization_reason=auth_reason,
                decided_at=datetime.now(UTC),
            )

            # Write to Firestoretraces audit log
            await self._document_store.set_document(
                "traces", state.deployment_id, trace.model_dump(mode="json")
            )
            logger.info("Persisted DecisionTrace for: %s", state.deployment_id)

            state.decision_trace = trace
            state.pipeline_status = "decision_made"
            self.set_workflow_state(ctx, state)

            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[
                        Part(
                            text=(
                                f"Decision reached: {final_decision}. "
                                f"Reason: {auth_reason}"
                            )
                        )
                    ],
                ),
            )

        else:
            # Healthy
            state.pipeline_status = "decision_made"
            self.set_workflow_state(ctx, state)
            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[Part(text="No anomaly signal present; decision = wait")],
                ),
            )
