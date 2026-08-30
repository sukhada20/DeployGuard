"""Live Google Cloud Platform integration tests for project deployguard-507111.

Tests live connectivity against Cloud Firestore, Cloud Logging, Cloud Monitoring,
Cloud Deploy, and Vertex AI embeddings.
"""

from __future__ import annotations

import os
import uuid
import pytest

from deployguard.cloud.deploy_client import LiveCloudDeployClient
from deployguard.cloud.embeddings import generate_embedding
from deployguard.cloud.factory import (
    get_deploy_client,
    get_document_store,
    get_logging_client,
    get_monitoring_client,
    has_valid_adc,
    is_mock_mode,
)
from deployguard.cloud.logging_client import LiveCloudLoggingClient, build_lql_filter
from deployguard.cloud.monitoring_client import LiveCloudMonitoringClient


@pytest.fixture(autouse=True)
def live_gcp_env():
    """Ensure live GCP environment variables are set for integration tests."""
    old_mock = os.environ.get("DEPLOYGUARD_MOCK_GCP")
    old_proj = os.environ.get("GOOGLE_CLOUD_PROJECT")

    os.environ["DEPLOYGUARD_MOCK_GCP"] = "false"
    os.environ["GOOGLE_CLOUD_PROJECT"] = "deployguard-507111"

    yield

    if old_mock is not None:
        os.environ["DEPLOYGUARD_MOCK_GCP"] = old_mock
    else:
        os.environ.pop("DEPLOYGUARD_MOCK_GCP", None)

    if old_proj is not None:
        os.environ["GOOGLE_CLOUD_PROJECT"] = old_proj
    else:
        os.environ.pop("GOOGLE_CLOUD_PROJECT", None)


def test_live_adc_discovery():
    """Verify Application Default Credentials (ADC) are valid and discoverable."""
    assert is_mock_mode() is False
    assert has_valid_adc() is True


def test_factory_returns_live_clients():
    """Factory should initialize live GCP clients when MOCK=false and ADC is present."""
    deploy_client = get_deploy_client()
    assert isinstance(deploy_client, LiveCloudDeployClient)
    assert deploy_client.project_id == "deployguard-507111"

    logging_client = get_logging_client()
    assert isinstance(logging_client, LiveCloudLoggingClient)
    assert logging_client.project_id == "deployguard-507111"

    monitoring_client = get_monitoring_client()
    assert isinstance(monitoring_client, LiveCloudMonitoringClient)
    assert monitoring_client.project_id == "deployguard-507111"


@pytest.mark.asyncio
async def test_live_firestore_read_write():
    """Test live document write, read, and delete against Cloud Firestore."""
    store = get_document_store()
    test_id = f"test-smoke-{uuid.uuid4().hex[:8]}"
    test_data = {
        "service_name": "checkout-service",
        "version": "v2.4.0",
        "severity": "CRITICAL",
        "summary": "Live smoke test incident record",
        "is_test": True,
    }

    try:
        # Write document
        await store.set_document("incidents", test_id, test_data)

        # Read back document
        doc = await store.get_document("incidents", test_id)
        assert doc is not None
        assert doc["service_name"] == "checkout-service"
        assert doc["summary"] == "Live smoke test incident record"

        # Query collection
        results = await store.query("incidents", [("service_name", "==", "checkout-service")])
        assert any(r.get("summary") == "Live smoke test incident record" for r in results)

    finally:
        # Clean up test document
        try:
            if hasattr(store, "delete_document"):
                await store.delete_document("incidents", test_id)
            elif hasattr(store, "collection"):
                doc_ref = store.collection("incidents").document(test_id)
                await doc_ref.delete()
        except Exception:
            pass


def test_live_vertex_ai_embedding_generation():
    """Test live embedding generation with Vertex AI / Google GenAI SDK."""
    embedding = generate_embedding("Checkout service experienced threadpool latency spike")
    assert isinstance(embedding, list)
    assert len(embedding) == 768
    # Assert vector is non-zero
    assert sum(abs(x) for x in embedding) > 0.0


@pytest.mark.asyncio
async def test_live_cloud_logging_query():
    """Test executing a live Cloud Logging query via Logging client."""
    client = get_logging_client()
    filter_expr = build_lql_filter("checkout-service", min_severity="INFO")
    logs = await client.query_logs(filter_expr, limit=5)
    assert isinstance(logs, list)


@pytest.mark.asyncio
async def test_live_cloud_monitoring_query():
    """Test executing a live Cloud Monitoring metric fetch."""
    client = get_monitoring_client()
    metric_val = await client.get_metric("latency")
    assert isinstance(metric_val, float)
    baseline_val = await client.get_baseline("latency")
    assert isinstance(baseline_val, float)

