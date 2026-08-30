"""Tests for OpenTelemetry distributed tracing and span context propagation."""

from datetime import UTC, datetime

import pytest

from deployguard.agents.rollback import RollbackAgent
from deployguard.cloud.stubs import MockCloudDeploy
from deployguard.state.workflow import DecisionTrace, DeploymentWorkflowState
from deployguard.telemetry.tracer import (
    extract_trace_context,
    get_in_memory_exporter,
    get_tracer,
    init_tracer,
    inject_trace_context,
    reset_tracer,
    trace_agent_step,
    trace_deployment,
)


class MockSession:
    def __init__(self) -> None:
        self.state: dict = {}


class MockInvocationContext:
    def __init__(self) -> None:
        self.session = MockSession()


@pytest.fixture(autouse=True)
def clean_tracer():
    reset_tracer()
    init_tracer()
    yield
    reset_tracer()


def test_tracer_initialization_mock() -> None:
    tracer = get_tracer()
    assert tracer is not None
    exporter = get_in_memory_exporter()
    assert exporter is not None


def test_span_hierarchy_and_attributes() -> None:
    exporter = get_in_memory_exporter()
    assert exporter is not None

    with trace_deployment(
        deployment_id="dep-123",
        service_name="payment-service",
        environment="production",
        version="2.0.0",
    ):
        with trace_agent_step("monitor.detect", severity="CRITICAL", affected_metrics="['error_rate']"):
            pass
        with trace_agent_step("decision.evaluate", decision="rollback", confidence=0.95, policy_passed=True):
            pass
        with trace_agent_step("rollback.execute", target_version="1.0.0", operation_id="op-123"):
            pass
        with trace_agent_step("monitor.verify_recovery", verdict="recovered", checks_count=3):
            pass

    spans = exporter.get_finished_spans()
    span_names = [s.name for s in spans]

    assert "deployguard.deployment" in span_names
    assert "deployguard.monitor.detect" in span_names
    assert "deployguard.decision.evaluate" in span_names
    assert "deployguard.rollback.execute" in span_names
    assert "deployguard.monitor.verify_recovery" in span_names

    # Check root span attributes
    root_span = next(s for s in spans if s.name == "deployguard.deployment")
    assert root_span.attributes["deployment.id"] == "dep-123"
    assert root_span.attributes["service.name"] == "payment-service"
    assert root_span.attributes["deployment.environment"] == "production"

    # Check child span attributes
    decision_span = next(s for s in spans if s.name == "deployguard.decision.evaluate")
    assert decision_span.attributes["decision"] == "rollback"
    assert decision_span.attributes["confidence"] == 0.95


def test_trace_context_propagation() -> None:
    exporter = get_in_memory_exporter()
    assert exporter is not None

    carrier: dict[str, str] = {}
    with trace_deployment(deployment_id="dep-456", service_name="auth-service"):
        inject_trace_context(carrier)
        assert "traceparent" in carrier
        assert carrier["traceparent"].startswith("00-")

    # Verify context extraction
    ctx = extract_trace_context(carrier)
    assert ctx is not None


@pytest.mark.asyncio
async def test_agent_lifecycle_tracing() -> None:
    exporter = get_in_memory_exporter()
    assert exporter is not None

    mock_deploy = MockCloudDeploy()
    agent = RollbackAgent(deploy_client=mock_deploy)
    ctx = MockInvocationContext()

    trace_info = DecisionTrace(
        trace_id="trace-dep-789",
        decision="rollback",  # type: ignore
        confidence=0.95,
        evidence_summary="Anomalies verified",
        policy_checks={"all": True},
        policy_passed=True,
        authorized=True,
        authorization_reason="Passed",
        decided_at=datetime.now(UTC),
    )
    state = DeploymentWorkflowState(
        deployment_id="dep-789",
        service_name="cart-service",
        version="2.1.0",
        environment="staging",
        deployed_at=datetime.now(UTC),
        pipeline_status="decision_made",
        rollback_target_version="2.0.0",
        decision_trace=trace_info,
    )
    agent.set_workflow_state(ctx, state)

    # Invoke agent through base run async impl
    events = []
    async for event in agent._run_async_impl(ctx):
        events.append(event)

    assert len(events) == 1
    assert "trace_context" in ctx.session.state
    assert "traceparent" in ctx.session.state["trace_context"]

    spans = exporter.get_finished_spans()
    agent_spans = [s for s in spans if s.name == "deployguard.rollback_agent"]
    assert len(agent_spans) == 1
    assert agent_spans[0].attributes["agent_id"] == "rollback-v1"
