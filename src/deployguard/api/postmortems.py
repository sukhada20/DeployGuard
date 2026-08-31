"""Postmortem documents API endpoints."""

import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from deployguard.cloud.factory import get_document_store
from deployguard.state.workflow import PostmortemReport

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/postmortems", tags=["postmortems"])

# Seeded historical postmortems for UI demonstration
SEEDED_POSTMORTEMS = [
    PostmortemReport(
        report_id="pm-checkout-service-dep-9942",
        deployment_id="dep-994211a-prod",
        service_name="checkout-service",
        created_at=datetime(2026, 8, 30, 13, 45, 10, tzinfo=UTC),
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
            {
                "timestamp": "13:44:20 UTC",
                "stage": "DEPLOYMENT",
                "description": "Cloud Deploy release v2.4.0 rolled out to prod-cluster-1",
            },
            {
                "timestamp": "13:44:32 UTC",
                "stage": "ANOMALY_DETECTED",
                "description": "Deploy Monitor Agent detected CRITICAL anomaly (error_rate=14.5%, latency=480ms)",
            },
            {
                "timestamp": "13:44:34 UTC",
                "stage": "DECISION_EVALUATED",
                "description": "Decision Agent evaluated policy: rollback authorized (confidence=0.92)",
            },
            {
                "timestamp": "13:44:48 UTC",
                "stage": "ROLLBACK_EXECUTED",
                "description": "Rollback Agent executed Cloud Deploy rollback to v2.3.9 (Op: op-9942)",
            },
            {
                "timestamp": "13:45:06 UTC",
                "stage": "RECOVERY_VERIFIED",
                "description": "Recovery verification completed: verdict 'recovered' across all 7 dimensions",
            },
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
            "Tune Cloud Monitoring alert thresholds for early latency degradation signals.",
        ],
        trace_id="tr-20260830-checkout-01",
    ),
    PostmortemReport(
        report_id="pm-auth-service-dep-8821",
        deployment_id="dep-882144b-prod",
        service_name="auth-service",
        created_at=datetime(2026, 8, 29, 11, 22, 15, tzinfo=UTC),
        target_version="v1.9.2",
        stable_version="v1.9.1",
        incident_duration_seconds=42.1,
        severity="HIGH",
        outcome="recovered",
        executive_summary=(
            "During release of auth-service (v1.9.2), token validation latency spiked to 620ms with CPU utilization "
            "reaching 89%. Autonomous SRE Decisioning authorized canary rollback to v1.9.1. System normalized within 42 seconds."
        ),
        root_cause_analysis=(
            "1. Why did the incident occur? JWT validation cryptographic library upgrade caused CPU regression.\n"
            "2. Why were metrics impacted? Heavy RSA signature parsing blocked event loops.\n"
            "3. Why was blast radius contained? DeployGuard detected anomaly within 2 sampling windows.\n"
            "4. Why was recovery verified? Latency dropped back to 85ms post-rollback."
        ),
        timeline_events=[
            {
                "timestamp": "11:21:00 UTC",
                "stage": "DEPLOYMENT",
                "description": "Cloud Deploy release v1.9.2 deployed to staging/prod",
            },
            {
                "timestamp": "11:21:40 UTC",
                "stage": "ANOMALY_DETECTED",
                "description": "Deploy Monitor detected HIGH severity latency degradation (620ms)",
            },
            {
                "timestamp": "11:22:15 UTC",
                "stage": "ROLLBACK_EXECUTED",
                "description": "Rollback Agent executed Cloud Deploy rollback to v1.9.1",
            },
        ],
        metric_deltas={
            "latency_p95": {"baseline": 85.0, "current": 620.0, "ratio": 7.29},
            "cpu_utilization": {"baseline": 35.0, "current": 89.0, "ratio": 2.54},
        },
        decision_summary={
            "decision": "rollback",
            "confidence": 0.89,
            "policy_passed": True,
            "authorized": True,
            "reason": "Severe latency violation on auth critical path",
        },
        rollback_summary={
            "authorized": True,
            "executed": True,
            "target_version": "v1.9.1",
            "operation_id": "op-8821",
            "verdict": "recovered",
        },
        preventative_actions=[
            "Benchmark cryptography library upgrades before merging.",
            "Introduce async JWT key verification caches.",
        ],
        trace_id="tr-20260829-auth-01",
    ),
    PostmortemReport(
        report_id="pm-payment-service-dep-7714",
        deployment_id="dep-771420a-prod",
        service_name="payment-service",
        created_at=datetime(2026, 8, 28, 9, 15, 0, tzinfo=UTC),
        target_version="v3.1.0",
        stable_version="v3.0.9",
        incident_duration_seconds=31.5,
        severity="CRITICAL",
        outcome="recovered",
        executive_summary=(
            "Payment service rollout v3.1.0 encountered third-party gateway socket exhaustion, triggering "
            "18% error rate. Autonomous safety policies triggered immediate rollback to v3.0.9."
        ),
        root_cause_analysis=(
            "1. Why did the incident occur? Connection pool default size was set to 10 instead of 200.\n"
            "2. Why were errors returned? Outgoing HTTP sockets timed out immediately under load.\n"
            "3. Why was blast radius contained? DeployGuard triggered rollback within 30s."
        ),
        timeline_events=[
            {
                "timestamp": "09:14:10 UTC",
                "stage": "DEPLOYMENT",
                "description": "Release v3.1.0 rolled out to payment clusters",
            },
            {
                "timestamp": "09:14:35 UTC",
                "stage": "ANOMALY_DETECTED",
                "description": "Error rate spiked to 18.2%",
            },
            {
                "timestamp": "09:15:00 UTC",
                "stage": "RECOVERY_VERIFIED",
                "description": "Rollback to v3.0.9 restored 0.01% error rate",
            },
        ],
        metric_deltas={
            "error_rate": {"baseline": 0.005, "current": 0.182, "ratio": 36.4},
            "latency_p95": {"baseline": 110.0, "current": 890.0, "ratio": 8.09},
        },
        decision_summary={
            "decision": "rollback",
            "confidence": 0.96,
            "policy_passed": True,
            "authorized": True,
            "reason": "Payment critical error rate threshold exceeded",
        },
        rollback_summary={
            "authorized": True,
            "executed": True,
            "target_version": "v3.0.9",
            "operation_id": "op-7714",
            "verdict": "recovered",
        },
        preventative_actions=[
            "Enforce connection pool configuration validation in helm values schema.",
            "Add end-to-end payment gateway canary probe.",
        ],
        trace_id="tr-20260828-pay-01",
    ),
]

DEFAULT_POSTMORTEM_REPORT = SEEDED_POSTMORTEMS[0]


@router.get("")
async def list_postmortems(request: Request) -> list[dict[str, Any]]:
    """List all available postmortem reports from document store and active state."""
    reports_by_id: dict[str, dict[str, Any]] = {}

    # 1. Seed with historical postmortems
    for pm in SEEDED_POSTMORTEMS:
        reports_by_id[pm.report_id] = pm.model_dump(mode="json")

    # 2. Query document store
    doc_store = get_document_store()
    try:
        stored_docs = await doc_store.query("postmortems", [])
        for doc in stored_docs:
            rid = doc.get("report_id")
            if rid:
                reports_by_id[rid] = doc
    except Exception as e:
        logger.debug("Failed querying postmortems from doc store: %s", e)

    # 3. Add active state postmortem
    active_state = getattr(request.app.state, "active_workflow_state", None)
    if active_state and active_state.postmortem_report:
        pm_dict = active_state.postmortem_report.model_dump(mode="json")
        reports_by_id[pm_dict["report_id"]] = pm_dict

    # Sort reports by created_at descending (newest first)
    sorted_reports = sorted(
        reports_by_id.values(),
        key=lambda r: str(r.get("created_at", "")),
        reverse=True,
    )

    return [
        {
            "report_id": r["report_id"],
            "deployment_id": r.get("deployment_id", "unknown"),
            "service_name": r.get("service_name", "unknown"),
            "target_version": r.get("target_version", "unknown"),
            "stable_version": r.get("stable_version", "unknown"),
            "severity": r.get("severity", "HIGH"),
            "outcome": r.get("outcome", "recovered"),
            "incident_duration_seconds": r.get("incident_duration_seconds", 0.0),
            "created_at": r.get("created_at", datetime.now(UTC).isoformat()),
            "executive_summary": r.get("executive_summary", ""),
        }
        for r in sorted_reports
    ]


@router.get("/{report_id}")
async def get_postmortem_detail(report_id: str, request: Request) -> dict[str, Any]:
    """Retrieve full postmortem report and rendered SRE Markdown."""
    active_state = getattr(request.app.state, "active_workflow_state", None)

    if (
        active_state
        and active_state.postmortem_report
        and active_state.postmortem_report.report_id == report_id
    ):
        rep = active_state.postmortem_report
        data = rep.model_dump(mode="json")
        data["markdown"] = rep.to_markdown()
        return data

    # Check document store
    doc_store = get_document_store()
    try:
        doc = await doc_store.get_document("postmortems", report_id)
        if doc:
            if "markdown" not in doc:
                try:
                    rep = PostmortemReport.model_validate(doc)
                    doc["markdown"] = rep.to_markdown()
                except Exception:
                    pass
            return doc
    except Exception as e:
        logger.debug("Doc store lookup error: %s", e)

    # Check seeded postmortems
    for pm in SEEDED_POSTMORTEMS:
        if pm.report_id == report_id:
            data = pm.model_dump(mode="json")
            data["markdown"] = pm.to_markdown()
            return data

    raise HTTPException(
        status_code=404, detail=f"Postmortem report {report_id} not found"
    )
