"""Agent Registry API endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from deployguard.registry.models import AgentRegistryEntry
from deployguard.registry.store import AgentRegistry, get_registry

router = APIRouter(prefix="/api/v1/registry", tags=["registry"])


@router.get(
    "/agents",
    response_model=list[AgentRegistryEntry],
    summary="List all registered agents",
)
async def list_agents(
    registry: AgentRegistry = Depends(get_registry),
) -> list[AgentRegistryEntry]:
    """Return all agents in the registry."""
    return registry.list_all()


@router.get(
    "/agents/{agent_id}",
    response_model=AgentRegistryEntry,
    summary="Get agent by ID",
)
async def get_agent(
    agent_id: str,
    registry: AgentRegistry = Depends(get_registry),
) -> AgentRegistryEntry:
    """Return a specific agent by ID."""
    agent = registry.get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return agent


@router.post(
    "/agents",
    response_model=AgentRegistryEntry,
    status_code=201,
    summary="Register a new agent",
)
async def register_agent(
    entry: AgentRegistryEntry,
    registry: AgentRegistry = Depends(get_registry),
) -> AgentRegistryEntry:
    """Register a new agent in the registry."""
    try:
        return registry.register(entry)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
