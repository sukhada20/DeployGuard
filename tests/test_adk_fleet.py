"""Unit tests for Plan 04-01: ADK Fleet Architecture & Gateway Tool Interceptor."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from deployguard.agents.adk_tools import (
    fetch_historical_incidents,
    init_gateway_tools,
    query_monitoring_metrics,
    record_incident,
    request_deployment_rollback,
)
from deployguard.agents.base import (
    DEFAULT_MODEL_DECISION,
    DEFAULT_MODEL_FAST,
    BaseDeployGuardAgent,
    create_llm_agent,
)
from deployguard.registry.models import AgentRegistryEntry
from deployguard.registry.store import AgentRegistry
from deployguard.security.gateway import AgentGateway
from deployguard.security.sanitizer import LogSanitizer


@pytest.fixture()
def registry() -> AgentRegistry:
    """Registry populated with test agents."""
    reg = AgentRegistry()
    reg.register(
        AgentRegistryEntry(
            agent_id="rollback-v1",
            name="Rollback Agent",
            version="1.0.0",
            owner="SRE",
            domain="Deployment",
            risk_level="HIGH",
            permissions=["deployment.rollback", "incidents.write", "incidents.read"],
            status="ACTIVE",
            approved_at=datetime.now(tz=UTC),
        )
    )
    reg.register(
        AgentRegistryEntry(
            agent_id="monitor-v1",
            name="Monitor Agent",
            version="1.0.0",
            owner="SRE",
            domain="Monitoring",
            risk_level="LOW",
            permissions=["monitoring.read"],
            status="ACTIVE",
            approved_at=datetime.now(tz=UTC),
        )
    )
    reg.register(
        AgentRegistryEntry(
            agent_id="inactive-v1",
            name="Inactive Agent",
            version="1.0.0",
            owner="SRE",
            domain="Test",
            risk_level="LOW",
            permissions=["monitoring.read", "deployment.rollback"],
            status="INACTIVE",
            approved_at=datetime.now(tz=UTC),
        )
    )
    return reg


@pytest.fixture(autouse=True)
def init_tools(registry: AgentRegistry) -> None:
    """Initialize gateway tools before each test."""
    mock_gateway = MagicMock(spec=AgentGateway)
    init_gateway_tools(registry, mock_gateway, LogSanitizer())


# Gateway enforcement tests


def test_gateway_blocks_unknown_agent():
    with pytest.raises(PermissionError, match="not found in registry"):
        query_monitoring_metrics("unknown-agent", "svc-payments")


def test_gateway_blocks_inactive_agent():
    with pytest.raises(PermissionError, match="INACTIVE"):
        query_monitoring_metrics("inactive-v1", "svc-payments")


def test_gateway_blocks_missing_permission():
    with pytest.raises(PermissionError, match="lacks permission 'deployment.rollback'"):
        request_deployment_rollback("monitor-v1", "deploy-123", "high error rate")


def test_gateway_allows_valid_agent_with_permission():
    result = query_monitoring_metrics("monitor-v1", "svc-payments")
    assert result["service_name"] == "svc-payments"
    assert "metrics" in result


def test_gateway_sanitizes_string_args():
    result = request_deployment_rollback(
        "rollback-v1",
        "deploy-456",
        "Contact admin@example.com for details",
    )
    assert "[REDACTED_EMAIL]" in result["reason"]


# Tool signature tests


def test_query_monitoring_metrics_signature():
    assert query_monitoring_metrics.__name__ == "query_monitoring_metrics"
    assert "metric telemetry" in query_monitoring_metrics.__doc__


def test_fetch_historical_incidents_signature():
    assert fetch_historical_incidents.__name__ == "fetch_historical_incidents"
    assert "cosine similarity" in fetch_historical_incidents.__doc__


def test_request_deployment_rollback_requires_rollback_permission():
    with pytest.raises(PermissionError, match="deployment.rollback"):
        request_deployment_rollback("monitor-v1", "deploy-789", "test")


def test_record_incident_returns_incident_id():
    result = record_incident("rollback-v1", "svc-auth", "OOM restart loop", "HIGH")
    assert "incident_id" in result
    assert result["service_name"] == "svc-auth"
    assert result["status"] == "recorded"


# Model configuration tests


def test_default_model_fast_is_flash():
    assert "flash" in DEFAULT_MODEL_FAST


def test_default_model_decision_is_pro():
    assert "pro" in DEFAULT_MODEL_DECISION


def test_create_llm_agent_uses_model_fast_by_default():
    agent = create_llm_agent(
        name="test_agent",
        instruction="You are a test agent.",
    )
    assert agent.model == DEFAULT_MODEL_FAST


def test_create_llm_agent_uses_specified_model():
    agent = create_llm_agent(
        name="decision_agent",
        instruction="Make decisions.",
        model=DEFAULT_MODEL_DECISION,
    )
    assert agent.model == DEFAULT_MODEL_DECISION


def test_create_llm_agent_with_tools():
    def dummy_tool(x: int) -> int:
        """A dummy tool."""
        return x * 2

    agent = create_llm_agent(
        name="agent_with_tools",
        instruction="Use tools.",
        tools=[dummy_tool],
    )
    assert len(agent.tools) == 1


def test_base_deployguard_agent_is_abstract():
    import inspect

    assert inspect.isabstract(BaseDeployGuardAgent)
