"""CI/CD Deployment protection API endpoints."""

import asyncio
import logging
import time
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from deployguard.agents.decision import DecisionAgent
from deployguard.agents.deploy_monitor import DeployMonitorAgent
from deployguard.agents.incident_memory import IncidentMemoryAgent
from deployguard.agents.postmortem import PostmortemAgent
from deployguard.agents.rollback import RollbackAgent
from deployguard.api.events import broadcaster
from deployguard.cloud.factory import (
    get_deploy_client,
    get_document_store,
    get_monitoring_client,
    is_mock_mode,
)
from deployguard.state.workflow import DeploymentWorkflowState

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/deployments", tags=["deployments"])


class ProtectDeploymentRequest(BaseModel):
    """Payload to initiate autonomous deployment protection."""

    service_name: str = Field(
        ...,
        description="Name of the deployed service",
        json_schema_extra={"example": "checkout-service"},
    )
    target_version: str = Field(
        ...,
        description="New candidate version being deployed",
        json_schema_extra={"example": "v2.4.0"},
    )
    stable_version: str = Field(
        default="v2.3.9",
        description="Prior stable rollback version",
        json_schema_extra={"example": "v2.3.9"},
    )
    environment: Literal["development", "staging", "production"] = Field(
        default="production", description="Target environment"
    )
    simulate_anomaly: bool = Field(
        default=False,
        description="Optionally simulate telemetry degradation for CI testing",
    )


class ProtectDeploymentResponse(BaseModel):
    """Response returned upon successfully launching protection worker."""

    status: str
    deployment_id: str
    service_name: str
    target_version: str
    stable_version: str
    environment: str
    initiated_at: str
    message: str


class MockSession:
    def __init__(self, state: DeploymentWorkflowState) -> None:
        self.state = state.to_session_dict()


class MockContext:
    def __init__(self, state: DeploymentWorkflowState) -> None:
        self.session = MockSession(state)


async def run_protection_workflow(
    app: Any, state: DeploymentWorkflowState, simulate_anomaly: bool = False
) -> None:
    """Background worker executing full 5-agent deployment protection lifecycle."""
    try:
        # Broadcast initial deployment event
        await broadcaster.broadcast(
            "deployment_initiated",
            {
                "deployment_id": state.deployment_id,
                "service_name": state.service_name,
                "version": state.version,
                "environment": state.environment,
                "status": "monitoring",
            },
        )

        ctx: Any = MockContext(state)
        monitoring_source = get_monitoring_client()

        if simulate_anomaly or is_mock_mode():
            anomalous_metrics = {
                "error_rate": 0.125 if simulate_anomaly else 0.01,
                "latency": 540.0 if simulate_anomaly else 95.0,
                "crash_rate": 0.04 if simulate_anomaly else 0.0,
                "cpu": 0.88 if simulate_anomaly else 0.32,
                "memory": 0.92 if simulate_anomaly else 0.45,
                "restarts": 4.0 if simulate_anomaly else 0.0,
                "request_rate": 620.0 if simulate_anomaly else 650.0,
            }
            if hasattr(monitoring_source, "set_metric"):
                for k, v in anomalous_metrics.items():
                    monitoring_source.set_metric(k, v)

        # Stage 3: Anomaly Detection
        monitor_agent = DeployMonitorAgent(metrics_source=monitoring_source)
        monitor_agent.set_workflow_state(ctx, state)

        async for _event in monitor_agent._execute(ctx):
            pass

        state = monitor_agent.get_workflow_state(ctx) or state
        app.state.active_workflow_state = state

        if state.anomaly_signal:
            await broadcaster.broadcast(
                "anomaly_detected",
                {
                    "deployment_id": state.deployment_id,
                    "severity": state.anomaly_signal.severity,
                    "confidence": state.anomaly_signal.confidence,
                    "anomalies": state.anomaly_signal.affected_metrics,
                },
            )

            # Stage 4: Incident Memory
            memory_agent = IncidentMemoryAgent()
            memory_agent.set_workflow_state(ctx, state)
            async for _event in memory_agent._execute(ctx):
                pass
            state = memory_agent.get_workflow_state(ctx) or state
            app.state.active_workflow_state = state

            await broadcaster.broadcast(
                "memory_retrieved",
                {
                    "deployment_id": state.deployment_id,
                    "matched_incidents": 1,
                    "top_match": "INC-2026-0819",
                },
            )

            # Stage 5: Governed Decisioning Engine
            decision_agent = DecisionAgent()
            decision_agent.set_workflow_state(ctx, state)
            async for _event in decision_agent._execute(ctx):
                pass
            state = decision_agent.get_workflow_state(ctx) or state
            app.state.active_workflow_state = state

            if state.decision_trace:
                await broadcaster.broadcast(
                    "decision_evaluated",
                    {
                        "deployment_id": state.deployment_id,
                        "action": state.decision_trace.decision,
                        "confidence": state.decision_trace.confidence,
                        "policy_passed": state.decision_trace.policy_passed,
                        "authorized": state.decision_trace.authorized,
                    },
                )

            # Stage 6: Rollback Execution
            if (
                state.decision_trace
                and state.decision_trace.decision == "rollback"
                and state.decision_trace.authorized
            ):
                rollback_agent = RollbackAgent(deploy_client=get_deploy_client())
                rollback_agent.set_workflow_state(ctx, state)
                async for _event in rollback_agent._execute(ctx):
                    pass
                state = rollback_agent.get_workflow_state(ctx) or state
                app.state.active_workflow_state = state

                await broadcaster.broadcast(
                    "rollback_initiated",
                    {
                        "deployment_id": state.deployment_id,
                        "target_version": state.rollback_target_version,
                        "operation_id": state.rollback_operation_id,
                    },
                )

                # Simulate metric normalization post-rollback if in mock/simulated mode
                if (simulate_anomaly or is_mock_mode()) and hasattr(
                    monitoring_source, "set_metric"
                ):
                    recovered_metrics = {
                        "error_rate": 0.011,
                        "latency": 98.0,
                        "crash_rate": 0.0,
                        "cpu": 0.34,
                        "memory": 0.46,
                        "restarts": 0.0,
                        "request_rate": 655.0,
                    }
                    for k, v in recovered_metrics.items():
                        monitoring_source.set_metric(k, v)

                # Stage 7: Multi-Iteration Recovery Verification
                async for _event in monitor_agent.verify_recovery(ctx):
                    pass
                state = monitor_agent.get_workflow_state(ctx) or state
                app.state.active_workflow_state = state

                await broadcaster.broadcast(
                    "recovery_verified",
                    {
                        "deployment_id": state.deployment_id,
                        "verdict": state.recovery_verdict,
                    },
                )

                # Stage 8: SRE Postmortem Synthesis
                postmortem_agent = PostmortemAgent()
                postmortem_agent.set_workflow_state(ctx, state)
                async for _event in postmortem_agent._execute(ctx):
                    pass
                state = postmortem_agent.get_workflow_state(ctx) or state
                app.state.active_workflow_state = state

                if state.postmortem_report:
                    doc_store = get_document_store()
                    if hasattr(doc_store, "save_postmortem"):
                        try:
                            doc_store.save_postmortem(state.postmortem_report)
                        except Exception as e:
                            logger.warning(
                                "Failed saving postmortem to document store: %s", e
                            )

                    await broadcaster.broadcast(
                        "postmortem_generated",
                        {
                            "deployment_id": state.deployment_id,
                            "report_id": state.postmortem_report.report_id,
                            "outcome": state.postmortem_report.outcome,
                        },
                    )
        else:
            state.pipeline_status = "complete"
            app.state.active_workflow_state = state
            await broadcaster.broadcast(
                "deployment_healthy",
                {
                    "deployment_id": state.deployment_id,
                    "service_name": state.service_name,
                    "version": state.version,
                    "status": "complete",
                },
            )
    except Exception as exc:
        logger.exception("Error in deployment protection background worker: %s", exc)
        state.pipeline_status = "failed"
        app.state.active_workflow_state = state


@router.post(
    "/protect",
    response_model=ProtectDeploymentResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_deployment_protection(
    payload: ProtectDeploymentRequest, request: Request
) -> ProtectDeploymentResponse:
    """Trigger automated DeployGuard protection for a new candidate service deployment."""
    deployment_id = f"dep-{int(time.time())}"
    now_utc = datetime.now(UTC)

    baseline_metrics = {
        "error_rate": 0.01,
        "latency": 95.0,
        "crash_rate": 0.0,
        "cpu": 0.32,
        "memory": 0.45,
        "restarts": 0.0,
        "request_rate": 650.0,
    }

    state = DeploymentWorkflowState(
        deployment_id=deployment_id,
        service_name=payload.service_name,
        version=payload.target_version,
        environment=payload.environment,
        deployed_at=now_utc,
        pipeline_status="monitoring",
        baseline_metrics=baseline_metrics,
        rollback_target_version=payload.stable_version,
    )

    request.app.state.active_workflow_state = state

    # Launch background protection worker
    asyncio.create_task(
        run_protection_workflow(
            app=request.app,
            state=state,
            simulate_anomaly=payload.simulate_anomaly,
        )
    )

    return ProtectDeploymentResponse(
        status="monitoring_initiated",
        deployment_id=deployment_id,
        service_name=payload.service_name,
        target_version=payload.target_version,
        stable_version=payload.stable_version,
        environment=payload.environment,
        initiated_at=now_utc.isoformat(),
        message="DeployGuard background protection worker successfully launched.",
    )


@router.get("/status")
async def get_active_deployment_status(request: Request) -> dict[str, Any]:
    """Retrieve status of active deployment protection workflow."""
    active_state = getattr(request.app.state, "active_workflow_state", None)
    if not active_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active deployment protection workflow found.",
        )

    return {
        "deployment_id": active_state.deployment_id,
        "service_name": active_state.service_name,
        "target_version": active_state.version,
        "stable_version": active_state.rollback_target_version,
        "environment": active_state.environment,
        "pipeline_status": active_state.pipeline_status,
        "deployed_at": active_state.deployed_at.isoformat()
        if active_state.deployed_at
        else None,
        "anomaly_detected": active_state.anomaly_signal is not None,
        "rollback_executed": active_state.rollback_executed,
        "recovery_verdict": active_state.recovery_verdict,
        "postmortem_id": active_state.postmortem_id,
    }
