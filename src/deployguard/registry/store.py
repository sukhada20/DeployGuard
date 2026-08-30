"""In-memory Agent Registry store.

Phase 1: Simple dict-backed store seeded from SEED_AGENTS.
Phase 2+: Swap to Firestore-backed implementation via the same AgentRegistry interface.
"""

from datetime import UTC, datetime

from deployguard.registry.models import AgentRegistryEntry


class AgentRegistry:
    """In-memory agent registry with CRUD operations."""

    def __init__(self) -> None:
        self._agents: dict[str, AgentRegistryEntry] = {}

    def seed(self, entries: list[AgentRegistryEntry]) -> None:
        """Populate the registry from a seed list."""
        for entry in entries:
            self._agents[entry.agent_id] = entry

    def get(self, agent_id: str) -> AgentRegistryEntry | None:
        """Return agent by ID, or None if not found."""
        return self._agents.get(agent_id)

    def list_all(self) -> list[AgentRegistryEntry]:
        """Return all registered agents."""
        return list(self._agents.values())

    def register(self, entry: AgentRegistryEntry) -> AgentRegistryEntry:
        """Register a new agent. Raises ValueError if agent_id already exists."""
        if entry.agent_id in self._agents:
            raise ValueError(f"Agent '{entry.agent_id}' already registered")
        self._agents[entry.agent_id] = entry
        return entry

    def update_last_active(self, agent_id: str) -> None:
        """Update the last_active timestamp for an agent."""
        if agent_id in self._agents:
            self._agents[agent_id] = self._agents[agent_id].model_copy(
                update={"last_active": datetime.now(tz=UTC)}
            )


# Module-level singleton (initialized during app lifespan)
_registry: AgentRegistry | None = None


def get_registry() -> AgentRegistry:
    """FastAPI dependency: return the singleton registry.

    Raises RuntimeError if registry not yet initialized (startup not complete).
    """
    if _registry is None:
        raise RuntimeError("AgentRegistry not initialized. App startup incomplete.")
    return _registry


def seed_registry(entries: list[AgentRegistryEntry]) -> AgentRegistry:
    """Initialize and seed the singleton registry. Called during app lifespan."""
    global _registry
    _registry = AgentRegistry()
    _registry.seed(entries)
    return _registry
