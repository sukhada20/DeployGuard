"""Postmortem documents API endpoints."""

from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, HTTPException, Request

from deployguard.state.workflow import PostmortemReport

router = APIRouter(prefix="/api/v1/postmortems", tags=["postmortems"])

# Seeded historical postmortems
DEFAULT_POSTMORTEM_REPORT = PostmortemReport(
    report_id="pm-checkout-service-dep-9942",
    deployment_id="dep-994211a-prod",
    service_name="checkout-service",
    created_at=datetime.now(UTC),
    target_version="v2.4.0",
    stable_version="v2.3.9",
    incident_duration_seconds=38.4,
    severity="CRITICAL",
    outcome="recovered",
    executive_summary=(
        "During deployment of checkout-service (v2.4.0), automated telemetry monitoring detected a "
        "CRITICAL anomaly with error rate spiking to 14.5% (15x baseline) and P95 latency jumping to 480ms. "
        "The autonomous governance decision engine verified all 5 safety policy gates and authorized an immediate "
        "rollback to stable version v2.3.9 via Google Cloud Deploy. Multi-metric recovery verification confirmed "
        "all 7 metrics returned below 1.15x baseline thresholds within 40 seconds."
    ),
    root_cause_analysis=(
        "1. Why did the incident occur? The deployment of v2.4.0 introduced unhandled database connection timeouts.\n"
        "2. Why were metrics impacted? Thread pool exhaustion caused request queuing and latency degradation.\n"
        "3. Why was it not caught in staging? Synthetic staging traffic did not match real concurrent connection pools.\n"
        "4. Why was blast radius contained? DeployGuard detected anomaly in 1.2s and initiated governed rollback.\n"
        "5. Why was recovery verified? Metric thresholds returned to 1.0% error rate and 120ms latency post-rollback."
    ),
    timeline_events=[
        {"timestamp": "13:44:20 UTC", "stage": "DEPLOYMENT", "description": "Cloud Deploy release v2.4.0 rolled out to prod-cluster-1"},
        {"timestamp": "13:44:32 UTC", "stage": "ANOMALY_DETECTED", "description": "Deploy Monitor Agent detected CRITICAL anomaly (error_rate=14.5%, latency=480ms)"},
        {"timestamp": "13:44:34 UTC", "stage": "DECISION_EVALUATED", "description": "Decision Agent evaluated policy: rollback authorized (confidence=0.92)"},
        {"timestamp": "13:44:48 UTC", "stage": "ROLLBACK_EXECUTED", "description": "Rollback Agent executed Cloud Deploy rollback to v2.3.9 (Op: op-9942)"},
        {"timestamp": "13:45:06 UTC", "stage": "RECOVERY_VERIFIED", "description": "Recovery verification completed: verdict 'recovered' across all 7 dimensions"},
    ],
    metric_deltas={
        "error_rate": {"baseline": 0.010, "current": 0.145, "ratio": 14.5},
        "latency_p95": {"baseline": 120.0, "current": 480.0, "ratio": 4.0},
        "cpu_utilization": {"baseline": 45.0, "current": 78.0, "ratio": 1.73},
        "memory_utilization": {"baseline": 60.0, "current": 84.0, "ratio": 1.40},
    },
    decision_summary={
        "decision": "rollback",
        "confidence": 0.92,
        "policy_passed": True,
        "authorized": True,
        "reason": "Critical error spike meets auto-rollback policy",
    },
    rollback_summary={
        "authorized": True,
        "executed": True,
        "target_version": "v2.3.9",
        "operation_id": "op-9942",
        "verdict": "recovered",
    },
    preventative_actions=[
        "Add database connection pool saturation tests to checkout-service CI pipeline.",
        "Implement circuit-breaker timeouts on Postgres connection acquiring methods.",
        "Review DeployGuard canary step progression timing in delivery pipeline.",
        "Tune Cloud Monitoring alert thresholds for early latency degradation signals."
    ],
    trace_id="tr-20260830-checkout-01",
)


@router.get("")
async def list_postmortems(request: Request) -> list[dict[str, Any]]:
    """List all available postmortem reports."""
    active_state = getattr(request.app.state, "active_workflow_state", None)
    results = [DEFAULT_POSTMORTEM_REPORT.model_dump(mode="json")]

    if active_state and active_state.postmortem_report:
        results.insert(0, active_state.postmortem_report.model_dump(mode="json"))

    # Return list of summaries
    return [
        {
            "report_id": r["report_id"],
            "deployment_id": r["deployment_id"],
            "service_name": r["service_name"],
            "target_version": r["target_version"],
            "stable_version": r["stable_version"],
            "severity": r["severity"],
            "outcome": r["outcome"],
            "incident_duration_seconds": r["incident_duration_seconds"],
            "created_at": r["created_at"],
            "executive_summary": r["executive_summary"],
        }
        for r in results
    ]


@router.get("/{report_id}")
async def get_postmortem_detail(report_id: str, request: Request) -> dict[str, Any]:
    """Retrieve full postmortem report and rendered SRE Markdown."""
    active_state = getattr(request.app.state, "active_workflow_state", None)

    if active_state and active_state.postmortem_report and active_state.postmortem_report.report_id == report_id:
        rep = active_state.postmortem_report
        data = rep.model_dump(mode="json")
        data["markdown"] = rep.to_markdown()
        return data

    if DEFAULT_POSTMORTEM_REPORT.report_id == report_id:
        data = DEFAULT_POSTMORTEM_REPORT.model_dump(mode="json")
        data["markdown"] = DEFAULT_POSTMORTEM_REPORT.to_markdown()
        return data

    raise HTTPException(status_code=404, detail=f"Postmortem report {report_id} not found")
