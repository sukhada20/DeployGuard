"""Agent Registry data models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AgentRegistryEntry(BaseModel):
    """Schema for a registered DeployGuard agent."""

    agent_id: str  # Unique identifier: "rollback-v1"
    name: str  # Human name: "Rollback Agent"
    version: str  # Semantic version: "1.5.0"
    owner: str  # Owning team: "SRE"
    domain: str  # Operational domain: "Deployment"
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    permissions: list[str]  # ["deployment.read", "deployment.rollback"]
    status: Literal["ACTIVE", "INACTIVE", "DEPRECATED"]
    approved_at: datetime | None = None
    last_active: datetime | None = None
    description: str = ""
