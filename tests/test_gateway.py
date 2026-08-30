import pytest

from deployguard.cloud.stubs import MockFirestore
from deployguard.registry.models import AgentRegistryEntry
from deployguard.registry.store import AgentRegistry
from deployguard.security.gateway import AgentGateway, PolicyEngine


def test_policy_engine_evaluation():
    config = {
        "environments": {
            "production": {
                "allowed_auto_rollback_severities": ["CRITICAL"],
                "min_confidence_threshold": 0.85,
            },
            "staging": {
                "allowed_auto_rollback_severities": ["HIGH", "CRITICAL"],
                "min_confidence_threshold": 0.70,
            },
        }
    }
    engine = PolicyEngine(config)

    # 1. Healthy production check (CRITICAL severity, high confidence,
    # has stable version)
    state = {
        "environment": "production",
        "anomaly_severity": "CRITICAL",
        "confidence": 0.90,
        "rollback_target_version": "1.0.0",
    }
    result = engine.evaluate(state)
    assert result["policy_passed"] is True
    assert result["checks"]["severity_allowed"] is True
    assert result["checks"]["confidence_allowed"] is True
    assert result["checks"]["has_stable_version"] is True

    # 2. Failing production check due to low severity (HIGH severity is blocked in prod)
    state = {
        "environment": "production",
        "anomaly_severity": "HIGH",
        "confidence": 0.90,
        "rollback_target_version": "1.0.0",
    }
    result = engine.evaluate(state)
    assert result["policy_passed"] is False
    assert result["checks"]["severity_allowed"] is False

    # 3. Healthy staging check (HIGH severity is allowed in staging)
    state = {
        "environment": "staging",
        "anomaly_severity": "HIGH",
        "confidence": 0.75,
        "rollback_target_version": "1.0.0",
    }
    result = engine.evaluate(state)
    assert result["policy_passed"] is True


@pytest.mark.asyncio
async def test_agent_gateway_authorization():
    registry = AgentRegistry()
    db = MockFirestore()
    gateway = AgentGateway(registry, db)

    # 1. Register an active agent
    active_agent = AgentRegistryEntry(
        agent_id="test-agent-active",
        name="Test Active Agent",
        version="1.0.0",
        owner="SRE",
        domain="Deployment",
        risk_level="HIGH",
        permissions=["rollback.execute", "logs.read"],
        status="ACTIVE",
    )
    registry.register(active_agent)

    # 2. Register an inactive agent
    inactive_agent = AgentRegistryEntry(
        agent_id="test-agent-inactive",
        name="Test Inactive Agent",
        version="1.0.0",
        owner="SRE",
        domain="Deployment",
        risk_level="HIGH",
        permissions=["rollback.execute"],
        status="INACTIVE",
    )
    registry.register(inactive_agent)

    # 3. Test authorization checks
    assert (
        await gateway.authorize_action("test-agent-active", "rollback.execute") is True
    )
    assert (
        await gateway.authorize_action("test-agent-active", "invalid.permission")
        is False
    )
    assert (
        await gateway.authorize_action("test-agent-inactive", "rollback.execute")
        is False
    )
    assert (
        await gateway.authorize_action("nonexistent-agent", "rollback.execute") is False
    )
