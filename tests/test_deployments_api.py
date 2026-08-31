"""Integration tests for CI/CD Deployment Trigger API."""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from deployguard.main import create_app


@pytest.mark.asyncio
async def test_trigger_deployment_protect_success():
    """Test POST /api/v1/deployments/protect launches monitoring worker."""
    app = create_app()
    transport = ASGITransport(app=app)

    payload = {
        "service_name": "checkout-service",
        "target_version": "v2.4.0",
        "stable_version": "v2.3.9",
        "environment": "production",
        "simulate_anomaly": False,
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/deployments/protect", json=payload)
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "monitoring_initiated"
        assert data["service_name"] == "checkout-service"
        assert data["target_version"] == "v2.4.0"
        assert data["stable_version"] == "v2.3.9"
        assert "deployment_id" in data


@pytest.mark.asyncio
async def test_get_deployment_status():
    """Test GET /api/v1/deployments/status returns active workflow status."""
    app = create_app()
    transport = ASGITransport(app=app)

    payload = {
        "service_name": "payment-service",
        "target_version": "v1.8.0",
        "stable_version": "v1.7.9",
        "environment": "staging",
        "simulate_anomaly": False,
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        protect_res = await client.post("/api/v1/deployments/protect", json=payload)
        assert protect_res.status_code == 202

        status_res = await client.get("/api/v1/deployments/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["service_name"] == "payment-service"
        assert status_data["target_version"] == "1.8.0" or status_data["target_version"] == "v1.8.0"
        assert status_data["pipeline_status"] in [
            "monitoring",
            "complete",
            "anomaly_detected",
        ]


@pytest.mark.asyncio
async def test_get_deployment_status_not_found():
    """Test GET /api/v1/deployments/status returns 404 when no workflow is active."""
    app = create_app()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/deployments/status")
        assert response.status_code == 404
        assert "No active deployment protection workflow found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_protection_worker_simulated_anomaly():
    """Test background protection worker processes simulated anomaly and updates state."""
    app = create_app()
    transport = ASGITransport(app=app)

    payload = {
        "service_name": "checkout-service",
        "target_version": "v2.4.0",
        "stable_version": "v2.3.9",
        "environment": "production",
        "simulate_anomaly": True,
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/deployments/protect", json=payload)
        assert response.status_code == 202

        # Allow background worker tasks to process
        await asyncio.sleep(0.5)

        status_res = await client.get("/api/v1/deployments/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["anomaly_detected"] is True
        assert status_data["rollback_executed"] is True
        assert status_data["recovery_verdict"] == "recovered"
        assert status_data["postmortem_id"] is not None

