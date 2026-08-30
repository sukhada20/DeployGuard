"""Tests for agent fleet and workflow state."""

from datetime import datetime

from deployguard.agents import (
    DecisionAgent,
    DeployMonitorAgent,
    IncidentMemoryAgent,
    PostmortemAgent,
    RollbackAgent,
)
from deployguard.state.workflow import DeploymentWorkflowState


def make_state() -> DeploymentWorkflowState:
    """Create a minimal valid workflow state for testing."""
    return DeploymentWorkflowState(
        deployment_id="dep-test-001",
        service_name="api-service",
        version="2.0.0",
        environment="staging",
        deployed_at=datetime(2026, 8, 23, 10, 0, 0),
    )


class TestDeploymentWorkflowState:
    def test_creates_with_defaults(self) -> None:
        state = make_state()
        assert state.pipeline_status == "monitoring"
        assert state.decision_trace is None

    def test_serializes_to_dict(self) -> None:
        state = make_state()
        d = state.to_session_dict()
        assert d["deployment_id"] == "dep-test-001"
        assert d["pipeline_status"] == "monitoring"

    def test_round_trips_through_dict(self) -> None:
        state = make_state()
        restored = DeploymentWorkflowState.from_session_dict(state.to_session_dict())
        assert restored.deployment_id == state.deployment_id
        assert restored.pipeline_status == state.pipeline_status
        assert restored.deployed_at == state.deployed_at

    def test_status_transitions(self) -> None:
        state = make_state()
        state.pipeline_status = "anomaly_detected"
        assert state.pipeline_status == "anomaly_detected"


class TestAgentInstantiation:
    def test_all_agents_instantiate(self) -> None:
        agents = [
            DeployMonitorAgent(),
            DecisionAgent(),
            IncidentMemoryAgent(),
            RollbackAgent(),
            PostmortemAgent(),
        ]
        assert len(agents) == 5

    def test_agent_ids_are_set(self) -> None:
        assert DeployMonitorAgent().agent_id == "deploy-monitor-v1"
        assert DecisionAgent().agent_id == "decision-v2"
        assert IncidentMemoryAgent().agent_id == "incident-memory-v1"
        assert RollbackAgent().agent_id == "rollback-v1"
        assert PostmortemAgent().agent_id == "postmortem-v1"

    def test_agent_names_are_set(self) -> None:
        assert DeployMonitorAgent().name == "deploy_monitor"
        assert RollbackAgent().name == "rollback_agent"
