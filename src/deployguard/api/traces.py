"""Decision traces API endpoints."""

from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/v1/traces", tags=["traces"])

# Seeded historical traces for UI demonstration
DEFAULT_TRACES = [
    {
        "trace_id": "tr-20260830-checkout-01",
        "service_name": "checkout-service",
        "decision": "rollback",
        "confidence": 0.92,
        "evidence_summary": "Error rate spiked to 14.5% (baseline 1.0%), P95 latency jumped to 480ms (4.0x baseline)",
        "policy_checks": {
            "confidence_threshold": True,
            "severity_critical": True,
            "deployment_age_valid": True,
            "stable_version_available": True,
            "auto_rollback_allowed": True,
        },
        "policy_passed": True,
        "authorized": True,
        "authorization_reason": "Policy Gate: All 5 production safety checks PASSED. Authorized for rollback.",
        "decided_at": "2026-08-30T13:45:10Z",
        "spans": [
            {"name": "deployguard.deployment", "duration_ms": 38400, "status": "OK", "start_offset_ms": 0},
            {"name": "monitor.detect", "duration_ms": 1200, "status": "OK", "start_offset_ms": 200},
            {"name": "decision.evaluate", "duration_ms": 1850, "status": "OK", "start_offset_ms": 1500},
            {"name": "rollback.execute", "duration_ms": 14200, "status": "OK", "start_offset_ms": 3400},
            {"name": "monitor.verify_recovery", "duration_ms": 18000, "status": "OK", "start_offset_ms": 17800},
            {"name": "postmortem.generate", "duration_ms": 2100, "status": "OK", "start_offset_ms": 36000},
        ],
    },
    {
        "trace_id": "tr-20260830-auth-02",
        "service_name": "auth-service",
        "decision": "wait",
        "confidence": 0.88,
        "evidence_summary": "Slight latency jitter (1.15x baseline) during traffic surge; error rate remained nominal.",
        "policy_checks": {
            "confidence_threshold": True,
            "severity_critical": False,
            "deployment_age_valid": True,
            "stable_version_available": True,
            "auto_rollback_allowed": True,
        },
        "policy_passed": False,
        "authorized": False,
        "authorization_reason": "Policy Gate: Severity LOW did not meet automated rollback threshold.",
        "decided_at": "2026-08-30T11:20:00Z",
        "spans": [
            {"name": "deployguard.deployment", "duration_ms": 3500, "status": "OK", "start_offset_ms": 0},
            {"name": "monitor.detect", "duration_ms": 1100, "status": "OK", "start_offset_ms": 100},
            {"name": "decision.evaluate", "duration_ms": 1900, "status": "OK", "start_offset_ms": 1300},
        ],
    },
]


@router.get("")
async def list_decision_traces(request: Request, service: str | None = None) -> list[dict[str, Any]]:
    """List historical and active decision traces."""
    active_state = getattr(request.app.state, "active_workflow_state", None)
    results = list(DEFAULT_TRACES)

    if active_state and active_state.decision_trace:
        dt = active_state.decision_trace
        active_trace = {
            "trace_id": dt.trace_id,
            "service_name": active_state.service_name,
            "decision": dt.decision,
            "confidence": dt.confidence,
            "evidence_summary": dt.evidence_summary,
            "policy_checks": dt.policy_checks,
            "policy_passed": dt.policy_passed,
            "authorized": dt.authorized,
            "authorization_reason": dt.authorization_reason,
            "decided_at": dt.decided_at.isoformat(),
            "spans": [
                {"name": "deployguard.deployment", "duration_ms": 42000, "status": "OK", "start_offset_ms": 0},
                {"name": "monitor.detect", "duration_ms": 1200, "status": "OK", "start_offset_ms": 200},
                {"name": "decision.evaluate", "duration_ms": 1800, "status": "OK", "start_offset_ms": 1500},
                {"name": "rollback.execute", "duration_ms": 15000, "status": "OK", "start_offset_ms": 3400},
                {"name": "monitor.verify_recovery", "duration_ms": 18000, "status": "OK", "start_offset_ms": 18500},
            ],
        }
        # Prepend active trace
        results.insert(0, active_trace)

    if service:
        results = [t for t in results if t.get("service_name") == service]

    return results


@router.get("/{trace_id}")
async def get_decision_trace(trace_id: str, request: Request) -> dict[str, Any]:
    """Retrieve full details of a specific decision trace."""
    traces = await list_decision_traces(request)
    for t in traces:
        if t.get("trace_id") == trace_id:
            return t
    raise HTTPException(status_code=404, detail=f"Decision trace {trace_id} not found")
