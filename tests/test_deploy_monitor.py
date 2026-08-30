from datetime import datetime

import pytest

from deployguard.agents.deploy_monitor import DeployMonitorAgent
from deployguard.cloud.metrics import compare_metrics
from deployguard.cloud.stubs import MockMonitoring
from deployguard.state.workflow import DeploymentWorkflowState


def test_compare_metrics_healthy():
    current = {"error_rate": 0.01, "latency": 150.0}
    baselines = {"error_rate": 0.01, "latency": 150.0}
    evidence = compare_metrics(current, baselines)

    anomalous = [e for e in evidence if e["anomalous"]]
    assert len(anomalous) == 0


def test_compare_metrics_anomalous():
    current = {"error_rate": 0.05, "latency": 300.0}
    baselines = {"error_rate": 0.01, "latency": 150.0}
    evidence = compare_metrics(current, baselines)

    anomalous = [e for e in evidence if e["anomalous"]]
    assert len(anomalous) == 2


class MockSession:
    def __init__(self) -> None:
        self.state = {}


class MockInvocationContext:
    def __init__(self) -> None:
        self.session = MockSession()


@pytest.mark.asyncio
async def test_deploy_monitor_agent_healthy():
    # 1. Setup mock source (all healthy by default)
    source = MockMonitoring()
    source.set_metric("error_rate", 0.01)
    source.set_metric("latency", 100.0)

    agent = DeployMonitorAgent(metrics_source=source)
    ctx = MockInvocationContext()

    # 2. Setup workflow state in context session
    state = DeploymentWorkflowState(
        deployment_id="dep-123",
        service_name="payment-service",
        version="1.0",
        deployed_at=datetime.utcnow(),
    )
    agent.set_workflow_state(ctx, state)

    # 3. Execute agent
    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    # 4. Verify results
    assert len(events) == 1
    assert "no anomaly detected" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state.pipeline_status == "monitoring"
    assert updated_state.anomaly_signal is None


@pytest.mark.asyncio
async def test_deploy_monitor_agent_anomalous():
    # 1. Setup mock source (restarts anomaly: baseline = 1.0 * 0.8 = 0.8,
    # current = 1.0 > 1.0 * 0.8)
    source = MockMonitoring()
    source.set_metric("restarts", 1.0)

    agent = DeployMonitorAgent(metrics_source=source)
    ctx = MockInvocationContext()

    state = DeploymentWorkflowState(
        deployment_id="dep-123",
        service_name="payment-service",
        version="1.0",
        deployed_at=datetime.utcnow(),
    )
    agent.set_workflow_state(ctx, state)

    # 2. Execute agent
    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    # 3. Verify results
    assert len(events) == 1
    assert "ANOMALY DETECTED" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state.pipeline_status == "anomaly_detected"
    assert updated_state.anomaly_signal is not None
    assert updated_state.anomaly_signal.severity == "HIGH"  # Restarts anomaly is HIGH
    assert "restarts" in updated_state.anomaly_signal.affected_metrics
