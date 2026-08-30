"""Smoke tests for health endpoint and application startup."""

from fastapi.testclient import TestClient

from deployguard.main import create_app


def test_health_returns_200() -> None:
    """Health endpoint returns HTTP 200."""
    client = TestClient(create_app())
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_schema() -> None:
    """Health response contains required fields."""
    client = TestClient(create_app())
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data


def test_health_version_matches_package() -> None:
    """Health endpoint version matches package version."""
    import deployguard

    client = TestClient(create_app())
    data = client.get("/health").json()
    assert data["version"] == deployguard.__version__
