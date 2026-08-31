"""Agent Registry data models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AgentRegistryEntry(BaseModel):
    """Schema for a registered DeployGuard agent."""

    agent_id: str  # Unique identifier: "rollback-v1"
    name: str  # Human name: "Rollback Agent"
    version: str  # Semantic version: "1.5.0"
    owner: str  # Owning team: "SRE"
    domain: str  # Operational domain: "Deployment"
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    service_account: str = ""  # e.g., "rollback-agent-sa@deployguard-fleet.iam.gserviceaccount.com"
    permissions: list[str] = Field(default_factory=list)  # ["deployment.read", "deployment.rollback"]
    tools: list[str] = Field(default_factory=list)  # ["execute_rollback", "get_rollout_status"]
    status: Literal["ACTIVE", "INACTIVE", "DEPRECATED", "active", "inactive", "deprecated"] = "ACTIVE"
    approved_at: datetime | None = None
    last_active: datetime | None = None
    last_heartbeat: datetime | None = None
    created_at: datetime | None = None
    description: str = ""
