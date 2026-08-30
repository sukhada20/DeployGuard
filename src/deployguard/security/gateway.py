from typing import Any

from deployguard.cloud.interfaces import DocumentStore
from deployguard.registry.store import AgentRegistry


class PolicyEngine:
    """Evaluates deployment state and LLM output against deterministic rules."""

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    def evaluate(self, state: dict[str, Any]) -> dict[str, Any]:
        """Evaluates policies and returns verdict with per-check details."""
        checks = {}
        env = state.get("environment", "production")
        env_policy = self.config.get("environments", {}).get(env, {})

        # 1. Target stable version check
        has_stable = state.get("rollback_target_version") is not None
        checks["has_stable_version"] = has_stable

        # 2. Severity check
        severity = state.get("anomaly_severity", "LOW")
        allowed_severities = env_policy.get("allowed_auto_rollback_severities", [])
        checks["severity_allowed"] = severity in allowed_severities

        # 3. Confidence threshold check
        confidence = state.get("confidence", 0.0)
        min_confidence = env_policy.get("min_confidence_threshold", 0.8)
        checks["confidence_allowed"] = confidence >= min_confidence

        passed = all(checks.values())
        return {"policy_passed": passed, "checks": checks}


class AgentGateway:
    """Enforces agent identity authorization and logs traces."""

    def __init__(self, registry: AgentRegistry, db: DocumentStore) -> None:
        self.registry = registry
        self.db = db

    async def authorize_action(self, agent_id: str, action: str) -> bool:
        """Authorizes action based on registry permissions."""
        agent = self.registry.get(agent_id)
        if not agent or agent.status != "ACTIVE":
            return False
        return action in agent.permissions
