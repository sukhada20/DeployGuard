"""Tests for post-rollback recovery verification loop."""

from datetime import UTC, datetime
from typing import Any

import pytest

from deployguard.agents.deploy_monitor import DeployMonitorAgent
from deployguard.cloud.metrics import METRIC_THRESHOLDS
from deployguard.cloud.stubs import MockMonitoring
from deployguard.state.workflow import DeploymentWorkflowState


class MockSession:
    def __init__(self) -> None:
        self.state: dict = {}


class MockInvocationContext:
    def __init__(self) -> None:
        self.session = MockSession()


class FailingMetricsSource:
    """Mock metrics source that simulates failures."""

    async def get_metric(self, metric_name: str) -> float:
        raise ConnectionError("Monitoring endpoint unreachable")

    async def get_baseline(self, metric_name: str) -> float:
        return 10.0


def make_verifying_state() -> DeploymentWorkflowState:
    baselines = {
        "error_rate": 0.01,
        "latency": 100.0,
        "crash_rate": 0.0,
        "cpu": 0.35,
        "memory": 0.40,
        "restarts": 0.0,
        "request_rate": 500.0,
    }
    return DeploymentWorkflowState(
        deployment_id="dep-123",
        service_name="payment-service",
        version="2.0.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="verifying_recovery",
        baseline_metrics=baselines,
        rollback_authorized=True,
        rollback_executed=True,
        rollback_target_version="1.0.0",
        rollback_operation_id="op-rollback-release-payment-service-1-0-0",
    )


@pytest.mark.asyncio
async def test_recovery_verification_recovered() -> None:
    source = MockMonitoring()
    # Configure healthy post-rollback metrics (matching baseline values)
    source.set_metric("error_rate", 0.01)
    source.set_metric("latency", 100.0)
    source.set_metric("crash_rate", 0.0)
    source.set_metric("cpu", 0.35)
    source.set_metric("memory", 0.40)
    source.set_metric("restarts", 0.0)
    source.set_metric("request_rate", 500.0)

    agent = DeployMonitorAgent(
        metrics_source=source,
        stabilization_delay=0.0,
        sampling_iterations=3,
        sampling_interval=0.0,
    )
    ctx = MockInvocationContext()
    state = make_verifying_state()
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent.verify_recovery(ctx):
        events.append(event)

    assert len(events) == 1
    assert "RECOVERY VERIFIED" in events[0].content.parts[0].text

    updated = agent.get_workflow_state(ctx)
    assert updated is not None
    assert updated.recovery_verdict == "recovered"
    assert updated.recovery_checked_at is not None
    assert updated.pipeline_status == "complete"


@pytest.mark.asyncio
async def test_recovery_verification_degraded() -> None:
    source = MockMonitoring()
    # Configure degraded metrics (error_rate and restarts still high)
    source.set_metric("error_rate", 0.05)  # 5x baseline (exceeds 1.15x)
    source.set_metric("latency", 100.0)
    source.set_metric("crash_rate", 0.0)
    source.set_metric("cpu", 0.35)
    source.set_metric("memory", 0.40)
    source.set_metric("restarts", 2.0)  # > 0 restarts
    source.set_metric("request_rate", 500.0)

    agent = DeployMonitorAgent(
        metrics_source=source,
        stabilization_delay=0.0,
        sampling_iterations=2,
        sampling_interval=0.0,
    )
    ctx = MockInvocationContext()
    state = make_verifying_state()
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent.verify_recovery(ctx):
        events.append(event)

    assert len(events) == 1
    assert "RECOVERY VERIFICATION DEGRADED" in events[0].content.parts[0].text

    updated = agent.get_workflow_state(ctx)
    assert updated is not None
    assert updated.recovery_verdict == "degraded"
    assert updated.recovery_checked_at is not None
    assert updated.pipeline_status == "failed"


@pytest.mark.asyncio
async def test_recovery_verification_inconclusive() -> None:
    failing_source = FailingMetricsSource()
    agent = DeployMonitorAgent(
        metrics_source=failing_source,  # type: ignore
        stabilization_delay=0.0,
        sampling_iterations=2,
        sampling_interval=0.0,
    )
    ctx = MockInvocationContext()
    state = make_verifying_state()
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent.verify_recovery(ctx):
        events.append(event)

    assert len(events) == 1
    assert "RECOVERY VERIFICATION INCONCLUSIVE" in events[0].content.parts[0].text

    updated = agent.get_workflow_state(ctx)
    assert updated is not None
    assert updated.recovery_verdict == "inconclusive"
    assert updated.recovery_checked_at is not None
    assert updated.pipeline_status == "failed"


@pytest.mark.asyncio
async def test_recovery_verification_routed_from_execute() -> None:
    source = MockMonitoring()
    source.set_metric("error_rate", 0.01)
    source.set_metric("latency", 100.0)
    source.set_metric("crash_rate", 0.0)
    source.set_metric("cpu", 0.35)
    source.set_metric("memory", 0.40)
    source.set_metric("restarts", 0.0)
    source.set_metric("request_rate", 500.0)

    agent = DeployMonitorAgent(
        metrics_source=source,
        stabilization_delay=0.0,
        sampling_iterations=1,
    )
    ctx = MockInvocationContext()
    # State has verifying_recovery pipeline status
    state = make_verifying_state()
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    assert len(events) == 1
    assert "RECOVERY VERIFIED" in events[0].content.parts[0].text

    updated = agent.get_workflow_state(ctx)
    assert updated is not None
    assert updated.recovery_verdict == "recovered"
    assert updated.pipeline_status == "complete"
