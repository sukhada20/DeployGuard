"""End-to-end integration test suite for DeployGuard autonomous lifecycle."""

from datetime import UTC, datetime

import pytest

from deployguard.agents.deploy_monitor import DeployMonitorAgent
from deployguard.agents.postmortem import PostmortemAgent
from deployguard.cloud.stubs import MockMonitoring
from deployguard.demo.runner import DemoRunner
from deployguard.demo.scenarios import MockContext
from deployguard.state.workflow import DeploymentWorkflowState


@pytest.mark.asyncio
async def test_full_autonomous_deployment_lifecycle() -> None:
    """Verify complete 8-stage lifecycle from deployment to postmortem."""
    runner = DemoRunner(interactive=False, session_id="test-e2e-001")
    final_state = await runner.run_full_lifecycle()

    # Verify pipeline state transitions and outputs
    assert final_state.deployment_id == "test-e2e-001"
    assert final_state.service_name == "checkout-service"
    assert final_state.anomaly_signal is not None
    assert final_state.anomaly_signal.severity == "CRITICAL"
    assert final_state.decision_trace is not None
    assert final_state.decision_trace.decision == "rollback"
    assert final_state.decision_trace.policy_passed is True
    assert final_state.rollback_executed is True
    assert final_state.recovery_verdict == "recovered"
    assert final_state.pipeline_status == "complete"
    assert final_state.postmortem_report is not None
    assert final_state.postmortem_report.outcome == "recovered"
    assert "Root Cause Analysis" in final_state.postmortem_report.to_markdown()


@pytest.mark.asyncio
async def test_e2e_recovery_failure_handling() -> None:
    """Verify pipeline behavior when post-rollback metrics remain degraded."""
    monitoring = MockMonitoring()
    # High baseline
    monitoring.set_baseline("error_rate", 0.01)
    # High current metric
    monitoring.set_metric("error_rate", 0.15)

    state = DeploymentWorkflowState(
        deployment_id="test-degraded-001",
        service_name="checkout-service",
        version="v2.4.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="verifying_recovery",
        baseline_metrics={"error_rate": 0.01},
        rollback_target_version="v2.3.9",
        rollback_executed=True,
    )
    ctx = MockContext(state)

    monitor_agent = DeployMonitorAgent(
        metrics_source=monitoring,
        stabilization_delay=0.0,
        sampling_iterations=2,
        sampling_interval=0.0,
    )
    monitor_agent.set_workflow_state(ctx, state)

    events = []
    async for event in monitor_agent.verify_recovery(ctx):
        events.append(event)

    updated_state = monitor_agent.get_workflow_state(ctx)
    assert updated_state is not None
    assert updated_state.recovery_verdict == "degraded"
    assert updated_state.pipeline_status == "failed"

    # Postmortem generation for failed recovery
    postmortem_agent = PostmortemAgent()
    postmortem_agent.set_workflow_state(ctx, updated_state)
    async for _ in postmortem_agent._execute(ctx):
        pass

    final_state = postmortem_agent.get_workflow_state(ctx)
    assert final_state is not None
    assert final_state.postmortem_report is not None
    assert final_state.postmortem_report.outcome == "failed_rollback"
