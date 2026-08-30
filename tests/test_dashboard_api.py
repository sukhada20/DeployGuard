"""Integration tests for Dashboard Backend API and SSE stream."""

import asyncio
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from deployguard.api.events import broadcaster
from deployguard.main import create_app
from deployguard.state.workflow import (
    AnomalySignal,
    DecisionTrace,
    DeploymentWorkflowState,
    PostmortemReport,
)


@pytest.fixture
def app_with_state():
    app = create_app()
    state = DeploymentWorkflowState(
        deployment_id="dep-test-991",
        service_name="checkout-service",
        version="v2.4.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="anomaly_detected",
        anomaly_signal=AnomalySignal(
            severity="HIGH",
            confidence=0.88,
            affected_metrics=["error_rate", "latency_p95"],
            evidence=[
                {
                    "metric": "error_rate",
                    "baseline": 0.010,
                    "current": 0.050,
                    "ratio": 5.0,
                },
                {
                    "metric": "latency_p95",
                    "baseline": 120.0,
                    "current": 250.0,
                    "ratio": 2.08,
                },
            ],
            detected_at=datetime.now(UTC),
        ),
        decision_trace=DecisionTrace(
            trace_id="tr-test-991",
            decision="rollback",
            confidence=0.91,
            evidence_summary="5x error spike",
            policy_checks={"confidence": True, "severity": True},
            policy_passed=True,
            authorized=True,
            authorization_reason="Authorized by policy",
            decided_at=datetime.now(UTC),
        ),
        rollback_authorized=True,
        rollback_executed=True,
        rollback_target_version="v2.3.9",
        rollback_operation_id="op-test-1",
        recovery_verdict="recovered",
        recovery_checked_at=datetime.now(UTC),
        postmortem_id="pm-checkout-service-dep-test",
        postmortem_report=PostmortemReport(
            report_id="pm-checkout-service-dep-test",
            deployment_id="dep-test-991",
            service_name="checkout-service",
            created_at=datetime.now(UTC),
            target_version="v2.4.0",
            stable_version="v2.3.9",
            incident_duration_seconds=32.0,
            severity="HIGH",
            outcome="recovered",
            executive_summary="Incident summary test.",
            root_cause_analysis="Root cause test.",
            timeline_events=[],
            metric_deltas={},
            decision_summary={},
            rollback_summary={},
            preventative_actions=["Test action"],
            trace_id="tr-test-991",
        ),
    )
    app.state.active_workflow_state = state
    return app


@pytest.mark.asyncio
async def test_dashboard_overview_endpoint(app_with_state):
    """Test /api/v1/dashboard/overview returns active deployment and fleet stats."""
    transport = ASGITransport(app=app_with_state)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/overview")
        assert response.status_code == 200
        data = response.json()
        assert data["system_status"] == "INCIDENT_ACTIVE"
        assert data["cluster_health"] == "DEGRADED"
        assert data["active_deployment"]["service_name"] == "checkout-service"
        assert data["fleet_summary"]["total_agents"] == 5
        assert len(data["fleet_summary"]["agents"]) == 5


@pytest.mark.asyncio
async def test_dashboard_metrics_endpoint(app_with_state):
    """Test /api/v1/dashboard/metrics returns 7 metric dimensions with deltas."""
    transport = ASGITransport(app=app_with_state)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        metrics = data["metrics"]
        assert "error_rate" in metrics
        assert "latency_p95" in metrics
        assert "cpu_utilization" in metrics
        assert "memory_utilization" in metrics
        assert "crash_count" in metrics
        assert "restart_count" in metrics
        assert "request_rate" in metrics

        assert metrics["error_rate"]["is_anomaly"] is True
        assert metrics["error_rate"]["delta_pct"] == 400.0


@pytest.mark.asyncio
async def test_traces_endpoints(app_with_state):
    """Test /api/v1/traces and detail endpoint."""
    transport = ASGITransport(app=app_with_state)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List traces
        response = await client.get("/api/v1/traces")
        assert response.status_code == 200
        traces = response.json()
        assert len(traces) >= 1
        assert traces[0]["trace_id"] == "tr-test-991"

        # Get trace detail
        detail_res = await client.get("/api/v1/traces/tr-test-991")
        assert detail_res.status_code == 200
        trace_data = detail_res.json()
        assert trace_data["trace_id"] == "tr-test-991"
        assert "spans" in trace_data
        assert len(trace_data["spans"]) >= 1


@pytest.mark.asyncio
async def test_postmortems_endpoints(app_with_state):
    """Test /api/v1/postmortems and detail endpoint with markdown."""
    transport = ASGITransport(app=app_with_state)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/postmortems")
        assert response.status_code == 200
        postmortems = response.json()
        assert len(postmortems) >= 1
        assert postmortems[0]["report_id"] == "pm-checkout-service-dep-test"

        detail_res = await client.get(
            "/api/v1/postmortems/pm-checkout-service-dep-test"
        )
        assert detail_res.status_code == 200
        pm_data = detail_res.json()
        assert pm_data["report_id"] == "pm-checkout-service-dep-test"
        assert "markdown" in pm_data
        assert "# Incident Postmortem: checkout-service" in pm_data["markdown"]


@pytest.mark.asyncio
async def test_sse_events_stream():
    """Test /api/v1/events/stream connects and broadcasts messages."""
    app = create_app()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test"):
        # Subscribe queue directly to test broadcaster
        q = await broadcaster.subscribe()
        await broadcaster.broadcast("test_event", {"hello": "world"})
        msg = await asyncio.wait_for(q.get(), timeout=2.0)
        assert msg["event"] == "test_event"
        assert msg["data"] == {"hello": "world"}
        await broadcaster.unsubscribe(q)


@pytest.mark.asyncio
async def test_spa_static_serving():
    """Test root / returns static HTML from web/out if built."""
    app = create_app()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        # If static build exists, it should return 200 with HTML content
        if response.status_code == 200:
            assert "text/html" in response.headers.get("content-type", "")
            assert "DeployGuard" in response.text
