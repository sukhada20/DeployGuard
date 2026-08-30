"""Deployment workflow state.

Persisted in ADK session state across the full agent pipeline.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class AnomalySignal(BaseModel):
    """Structured anomaly signal from Deploy Monitor Agent."""

    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    confidence: float = Field(ge=0.0, le=1.0)
    affected_metrics: list[str]
    evidence: list[dict[str, Any]]  # [{metric, baseline, current, ratio}]
    detected_at: datetime


class DecisionTrace(BaseModel):
    """Auditable decision trace from Decision Agent."""

    trace_id: str
    decision: Literal["wait", "alert", "rollback"]
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_summary: str
    policy_checks: dict[str, bool]  # {check_name: bool}
    policy_passed: bool
    authorized: bool
    authorization_reason: str
    decided_at: datetime


class DeploymentWorkflowState(BaseModel):
    """Persistent state across the DeployGuard deployment-to-recovery lifecycle.

    Serialized to/from ADK ctx.session.state as a dict.
    """

    # Deployment identity
    deployment_id: str
    service_name: str
    version: str
    environment: Literal["development", "staging", "production"] = "production"
    deployed_at: datetime

    # Pipeline status (updated by each agent)
    pipeline_status: Literal[
        "monitoring",
        "anomaly_detected",
        "investigating",
        "decision_made",
        "rolling_back",
        "verifying_recovery",
        "complete",
        "failed",
    ] = "monitoring"

    # Deploy Monitor results
    baseline_metrics: dict[str, Any] | None = None
    current_metrics: dict[str, Any] | None = None
    anomaly_signal: AnomalySignal | None = None

    # Decision Agent results
    decision_trace: DecisionTrace | None = None

    # Rollback Agent results
    rollback_authorized: bool | None = None
    rollback_executed: bool | None = None
    rollback_target_version: str | None = None
    rollback_operation_id: str | None = None

    # Recovery verification
    recovery_verdict: Literal["recovered", "degraded", "inconclusive"] | None = None
    recovery_checked_at: datetime | None = None

    # Postmortem
    postmortem_id: str | None = None

    def to_session_dict(self) -> dict[str, Any]:
        """Serialize for storage in ADK ctx.session.state."""
        return self.model_dump(mode="json")

    @classmethod
    def from_session_dict(cls, data: dict[str, Any]) -> "DeploymentWorkflowState":
        """Deserialize from ADK ctx.session.state."""
        return cls.model_validate(data)
