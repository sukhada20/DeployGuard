"""Rollback Agent — executes approved rollbacks via Cloud Deploy."""

import logging
from collections.abc import AsyncGenerator

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.cloud.factory import get_deploy_client
from deployguard.cloud.interfaces import DeploymentManager

logger = logging.getLogger(__name__)


def format_release_id(service_name: str, stable_version: str) -> str:
    """Format standard Cloud Deploy release identifier.

    Args:
        service_name: Name of the service.
        stable_version: Semantic or tagged version string.

    Returns:
        Formatted release ID (e.g. release-payment-service-1-0-0).
    """
    clean_version = stable_version.replace(".", "-")
    return f"release-{service_name}-{clean_version}"


class RollbackAgent(BaseDeployGuardAgent):
    """Executes authorized rollbacks via Cloud Deploy.

    Requires valid DecisionTrace with policy_passed=True and authorized=True
    in workflow state before executing Cloud Deploy rollbacks.
    """

    def __init__(self, deploy_client: DeploymentManager | None = None) -> None:
        super().__init__(
            name="rollback_agent",
            agent_id="rollback-v1",
        )
        self._deploy_client = deploy_client

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("RollbackAgent — checking authorization and executing rollback")
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

        # 1. Two-tier policy and authorization verification (D-07, ROLL-03)
        trace = state.decision_trace
        if (
            not trace
            or trace.decision != "rollback"
            or not trace.policy_passed
            or not trace.authorized
        ):
            state.rollback_authorized = False
            state.rollback_executed = False
            state.pipeline_status = "failed"
            self.set_workflow_state(ctx, state)

            reason = (
                "No decision trace found"
                if not trace
                else f"Decision was '{trace.decision}', policy_passed={trace.policy_passed}, authorized={trace.authorized}"
            )
            logger.warning("Rollback refused: %s", reason)
            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[
                        Part(
                            text=f"ROLLBACK REFUSED: Policy checks not passed or unauthorized. {reason}"
                        )
                    ],
                ),
            )
            return

        # 2. Authorization passed: resolve stable release version (D-01, ROLL-01)
        state.rollback_authorized = True
        stable_version = state.rollback_target_version or "1.0.0"
        release_id = format_release_id(state.service_name, stable_version)
        target_id = "prod" if state.environment == "production" else state.environment
        pipeline_id = f"{state.service_name}-pipeline"

        # 3. Call Cloud Deploy rollback client (D-02)
        client = self._deploy_client or get_deploy_client()
        logger.info(
            "Executing rollback via Cloud Deploy: release_id=%s, target=%s, pipeline=%s",
            release_id,
            target_id,
            pipeline_id,
        )

        try:
            op_id = await client.execute_rollback(
                release_id=release_id,
                target_id=target_id,
                delivery_pipeline_id=pipeline_id,
            )
            state.rollback_executed = True
            state.rollback_target_version = stable_version
            state.rollback_operation_id = op_id
            state.pipeline_status = "verifying_recovery"
            self.set_workflow_state(ctx, state)

            msg = (
                f"Rollback successfully initiated via Cloud Deploy: "
                f"release={release_id}, target={target_id}, operation_id={op_id}"
            )
            logger.info(msg)
            yield Event(
                author=self.name,
                content=Content(role="model", parts=[Part(text=msg)]),
            )

        except Exception as e:
            logger.error("Cloud Deploy rollback execution failed: %s", e)
            state.rollback_executed = False
            state.pipeline_status = "failed"
            self.set_workflow_state(ctx, state)
            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[Part(text=f"ROLLBACK EXECUTION ERROR: {str(e)}")],
                ),
            )
