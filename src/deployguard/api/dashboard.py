"""Dashboard overview and telemetry metrics API endpoints."""

from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/overview")
async def get_dashboard_overview(request: Request) -> dict[str, Any]:
    """Retrieve high-level mission control overview statistics."""
    # Check if active session or state exists in app state
    active_state = getattr(request.app.state, "active_workflow_state", None)

    is_incident = False
    active_dep = {
        "service_name": "checkout-service",
        "target_version": "v2.4.0",
        "stable_version": "v2.3.9",
        "pipeline_status": "monitoring",
        "environment": "production",
        "deployed_at": datetime.now(UTC).isoformat(),
    }

    if active_state:
        is_incident = active_state.pipeline_status in ["anomaly_detected", "investigating", "decision_made", "rolling_back"]
        active_dep = {
            "service_name": active_state.service_name,
            "target_version": active_state.version,
            "stable_version": active_state.rollback_target_version or "v2.3.9",
            "pipeline_status": active_state.pipeline_status,
            "environment": active_state.environment,
            "deployed_at": active_state.deployed_at.isoformat(),
        }

    return {
        "system_status": "INCIDENT_ACTIVE" if is_incident else "PROTECTED",
        "cluster_health": "DEGRADED" if is_incident else "HEALTHY",
        "active_deployment": active_dep,
        "fleet_summary": {
            "total_agents": 5,
            "active_agents": 5,
            "agents": [
                {"name": "Deploy Monitor Agent", "role": "monitor", "status": "online"},
                {"name": "Decision Agent", "role": "decision", "status": "online"},
                {"name": "Incident Memory Agent", "role": "memory", "status": "online"},
                {"name": "Rollback Agent", "role": "rollback", "status": "online"},
                {"name": "Postmortem Agent", "role": "postmortem", "status": "online"},
            ],
        },
        "metrics_monitored": 7,
        "incident_statistics": {
            "total_deployments": 142,
            "anomalies_detected": 14,
            "auto_recovered": 14,
            "avg_recovery_seconds": 38.4,
            "protection_success_rate": 100.0,
        },
        "last_updated": datetime.now(UTC).isoformat(),
    }


@router.get("/metrics")
async def get_telemetry_metrics(request: Request) -> dict[str, Any]:
    """Retrieve 7-dimension telemetry metrics and baseline deltas for active/latest deployment."""
    active_state = getattr(request.app.state, "active_workflow_state", None)

    # Standard default telemetry readings
    error_rate = 0.012
    error_baseline = 0.010
    latency = 135.0
    latency_baseline = 120.0
    cpu = 48.0
    cpu_baseline = 45.0
    memory = 62.0
    memory_baseline = 60.0
    crashes = 0
    restarts = 0
    requests = 1250.0
    requests_baseline = 1200.0

    if active_state and active_state.anomaly_signal:
        for ev in active_state.anomaly_signal.evidence:
            m = ev.get("metric")
            curr = ev.get("current", 0)
            base = ev.get("baseline", 0)
            if m == "error_rate":
                error_rate, error_baseline = curr, base
            elif m == "latency_p95":
                latency, latency_baseline = curr, base
            elif m == "cpu_utilization":
                cpu, cpu_baseline = curr, base
            elif m == "memory_utilization":
                memory, memory_baseline = curr, base
            elif m == "crash_count":
                crashes = int(curr)
            elif m == "restart_count":
                restarts = int(curr)
            elif m == "request_rate":
                requests, requests_baseline = curr, base

    def compute_delta(curr: float, base: float) -> float:
        if base == 0:
            return 0.0
        return round(((curr - base) / base) * 100.0, 1)

    return {
        "service_name": active_state.service_name if active_state else "checkout-service",
        "timestamp": datetime.now(UTC).isoformat(),
        "metrics": {
            "error_rate": {
                "name": "Error Rate",
                "unit": "%",
                "current": error_rate,
                "baseline": error_baseline,
                "delta_pct": compute_delta(error_rate, error_baseline),
                "is_anomaly": error_rate > error_baseline * 1.25,
                "history": [0.010, 0.011, 0.010, 0.012, error_rate],
            },
            "latency_p95": {
                "name": "P95 Latency",
                "unit": "ms",
                "current": latency,
                "baseline": latency_baseline,
                "delta_pct": compute_delta(latency, latency_baseline),
                "is_anomaly": latency > latency_baseline * 1.25,
                "history": [118.0, 122.0, 120.0, 125.0, latency],
            },
            "cpu_utilization": {
                "name": "CPU Utilization",
                "unit": "%",
                "current": cpu,
                "baseline": cpu_baseline,
                "delta_pct": compute_delta(cpu, cpu_baseline),
                "is_anomaly": cpu > cpu_baseline * 1.25,
                "history": [44.0, 46.0, 45.0, 47.0, cpu],
            },
            "memory_utilization": {
                "name": "Memory Usage",
                "unit": "%",
                "current": memory,
                "baseline": memory_baseline,
                "delta_pct": compute_delta(memory, memory_baseline),
                "is_anomaly": memory > memory_baseline * 1.25,
                "history": [59.0, 60.0, 61.0, 60.0, memory],
            },
            "crash_count": {
                "name": "Crash Count",
                "unit": "crashes",
                "current": crashes,
                "baseline": 0,
                "delta_pct": 0.0 if crashes == 0 else 100.0,
                "is_anomaly": crashes > 0,
                "history": [0, 0, 0, 0, crashes],
            },
            "restart_count": {
                "name": "Restart Count",
                "unit": "restarts",
                "current": restarts,
                "baseline": 0,
                "delta_pct": 0.0 if restarts == 0 else 100.0,
                "is_anomaly": restarts > 0,
                "history": [0, 0, 0, 0, restarts],
            },
            "request_rate": {
                "name": "Request Throughput",
                "unit": "req/s",
                "current": requests,
                "baseline": requests_baseline,
                "delta_pct": compute_delta(requests, requests_baseline),
                "is_anomaly": requests < requests_baseline * 0.70,
                "history": [1190.0, 1210.0, 1200.0, 1220.0, requests],
            },
        },
    }
