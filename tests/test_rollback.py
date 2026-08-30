"""Tests for Rollback Agent, Cloud Deploy execution, and gateway authorization."""

from datetime import UTC, datetime

import pytest

from deployguard.agents.adk_tools import init_gateway_tools
from deployguard.agents.rollback import RollbackAgent, format_release_id
from deployguard.cloud.stubs import MockCloudDeploy, MockFirestore
from deployguard.registry.seed import SEED_AGENTS
from deployguard.registry.store import AgentRegistry
from deployguard.security.gateway import AgentGateway
from deployguard.security.sanitizer import LogSanitizer
from deployguard.state.workflow import DecisionTrace, DeploymentWorkflowState


class MockSession:
    def __init__(self) -> None:
        self.state: dict = {}


class MockInvocationContext:
    def __init__(self) -> None:
        self.session = MockSession()


def make_test_state(
    decision: str = "rollback",
    policy_passed: bool = True,
    authorized: bool = True,
) -> DeploymentWorkflowState:
    trace = DecisionTrace(
        trace_id="trace-dep-123",
        decision=decision,  # type: ignore
        confidence=0.95,
        evidence_summary="Critical error rate and crash rate anomaly detected",
        policy_checks={"confidence": True, "severity": True, "version": True},
        policy_passed=policy_passed,
        authorized=authorized,
        authorization_reason="Authorized by policy engine",
        decided_at=datetime.now(UTC),
    )
    return DeploymentWorkflowState(
        deployment_id="dep-123",
        service_name="payment-service",
        version="2.0.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="decision_made",
        rollback_target_version="1.0.0",
        decision_trace=trace,
    )


def test_format_release_id() -> None:
    assert (
        format_release_id("payment-service", "1.0.0") == "release-payment-service-1-0-0"
    )
    assert format_release_id("auth-api", "v2.3.1") == "release-auth-api-v2-3-1"


@pytest.mark.asyncio
async def test_rollback_authorized_execution() -> None:
    mock_deploy = MockCloudDeploy()
    agent = RollbackAgent(deploy_client=mock_deploy)
    ctx = MockInvocationContext()

    state = make_test_state(decision="rollback", policy_passed=True, authorized=True)
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    assert len(events) == 1
    assert "Rollback successfully initiated" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state is not None
    assert updated_state.rollback_authorized is True
    assert updated_state.rollback_executed is True
    assert updated_state.rollback_target_version == "1.0.0"
    assert (
        updated_state.rollback_operation_id
        == "op-rollback-release-payment-service-1-0-0"
    )
    assert updated_state.pipeline_status == "verifying_recovery"

    assert len(mock_deploy.rollbacks) == 1
    assert mock_deploy.rollbacks[0]["release_id"] == "release-payment-service-1-0-0"
    assert mock_deploy.rollbacks[0]["target_id"] == "prod"


@pytest.mark.asyncio
async def test_rollback_policy_blocked() -> None:
    mock_deploy = MockCloudDeploy()
    agent = RollbackAgent(deploy_client=mock_deploy)
    ctx = MockInvocationContext()

    # Policy checks failed
    state = make_test_state(decision="rollback", policy_passed=False, authorized=False)
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    assert len(events) == 1
    assert "ROLLBACK REFUSED" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state is not None
    assert updated_state.rollback_authorized is False
    assert updated_state.rollback_executed is False
    assert updated_state.pipeline_status == "failed"
    assert len(mock_deploy.rollbacks) == 0


@pytest.mark.asyncio
async def test_rollback_missing_decision_trace() -> None:
    mock_deploy = MockCloudDeploy()
    agent = RollbackAgent(deploy_client=mock_deploy)
    ctx = MockInvocationContext()

    state = DeploymentWorkflowState(
        deployment_id="dep-123",
        service_name="payment-service",
        version="2.0.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="monitoring",
        decision_trace=None,
    )
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    assert len(events) == 1
    assert "ROLLBACK REFUSED" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state is not None
    assert updated_state.rollback_authorized is False
    assert updated_state.rollback_executed is False
    assert updated_state.pipeline_status == "failed"
    assert len(mock_deploy.rollbacks) == 0


@pytest.mark.asyncio
async def test_rollback_decision_not_rollback() -> None:
    mock_deploy = MockCloudDeploy()
    agent = RollbackAgent(deploy_client=mock_deploy)
    ctx = MockInvocationContext()

    state = make_test_state(decision="wait", policy_passed=True, authorized=True)
    agent.set_workflow_state(ctx, state)

    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    assert len(events) == 1
    assert "ROLLBACK REFUSED" in events[0].content.parts[0].text

    updated_state = agent.get_workflow_state(ctx)
    assert updated_state is not None
    assert updated_state.rollback_authorized is False
    assert updated_state.rollback_executed is False
    assert updated_state.pipeline_status == "failed"
    assert len(mock_deploy.rollbacks) == 0


def test_rollback_gateway_permission_denial() -> None:
    store = MockFirestore()
    registry = AgentRegistry()
    for agent_entry in SEED_AGENTS:
        registry.register(agent_entry)
    gateway = AgentGateway(registry, store)
    sanitizer = LogSanitizer()

    tools = init_gateway_tools(registry, gateway, sanitizer)
    rollback_tool = tools["request_deployment_rollback"]

    # 1. Calling with rollback-v1 (has permission deployment.rollback) succeeds
    result = rollback_tool(
        "rollback-v1", deployment_id="dep-123", reason="Critical anomaly"
    )
    assert result["status"] == "requested"

    # 2. Calling with decision-v2 (lacks deployment.rollback) raises PermissionError
    with pytest.raises(PermissionError, match="lacks permission 'deployment.rollback'"):
        rollback_tool(
            "decision-v2", deployment_id="dep-123", reason="Direct rollback attempt"
        )

    # 3. Calling with deploy-monitor-v1 raises PermissionError
    with pytest.raises(PermissionError, match="lacks permission 'deployment.rollback'"):
        rollback_tool(
            "deploy-monitor-v1",
            deployment_id="dep-123",
            reason="Direct rollback attempt",
        )
