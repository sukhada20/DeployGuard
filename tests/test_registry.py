"""Tests for Agent Registry store and API endpoints."""

import pytest
from fastapi.testclient import TestClient

from deployguard.main import create_app
from deployguard.registry.models import AgentRegistryEntry
from deployguard.registry.seed import SEED_AGENTS
from deployguard.registry.store import AgentRegistry


class TestAgentRegistryStore:
    def test_seed_populates_registry(self) -> None:
        registry = AgentRegistry()
        registry.seed(SEED_AGENTS)
        assert len(registry.list_all()) == 5

    def test_get_existing_agent(self) -> None:
        registry = AgentRegistry()
        registry.seed(SEED_AGENTS)
        agent = registry.get("rollback-v1")
        assert agent is not None
        assert agent.risk_level == "CRITICAL"

    def test_get_nonexistent_agent_returns_none(self) -> None:
        registry = AgentRegistry()
        registry.seed(SEED_AGENTS)
        assert registry.get("nonexistent-agent") is None

    def test_register_new_agent(self) -> None:
        registry = AgentRegistry()
        new_agent = AgentRegistryEntry(
            agent_id="test-agent-v1",
            name="Test Agent",
            version="1.0.0",
            owner="Test Team",
            domain="Testing",
            risk_level="LOW",
            permissions=["test.read"],
            status="ACTIVE",
        )
        result = registry.register(new_agent)
        assert result.agent_id == "test-agent-v1"
        assert len(registry.list_all()) == 1

    def test_register_duplicate_raises_value_error(self) -> None:
        registry = AgentRegistry()
        registry.seed(SEED_AGENTS)
        with pytest.raises(ValueError, match="already registered"):
            registry.register(SEED_AGENTS[0])


class TestRegistryAPI:
    def test_list_agents_returns_five(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/api/v1/registry/agents")
            assert response.status_code == 200
            agents = response.json()
            assert len(agents) == 5

    def test_get_rollback_agent(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/api/v1/registry/agents/rollback-v1")
            assert response.status_code == 200
            agent = response.json()
            assert agent["agent_id"] == "rollback-v1"
            assert agent["risk_level"] == "CRITICAL"

    def test_get_nonexistent_agent_returns_404(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/api/v1/registry/agents/does-not-exist")
            assert response.status_code == 404

    def test_all_agents_have_required_fields(self) -> None:
        with TestClient(create_app()) as client:
            agents = client.get("/api/v1/registry/agents").json()
            for agent in agents:
                assert "agent_id" in agent
                assert "name" in agent
                assert "risk_level" in agent
                assert "permissions" in agent
                assert "status" in agent

    def test_critical_agent_is_rollback(self) -> None:
        with TestClient(create_app()) as client:
            agents = client.get("/api/v1/registry/agents").json()
            critical = [a for a in agents if a["risk_level"] == "CRITICAL"]
            assert len(critical) == 1
            assert critical[0]["agent_id"] == "rollback-v1"
