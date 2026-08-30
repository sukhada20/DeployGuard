"""Tests for cloud service stubs and test fixtures."""

import pytest

from deployguard.cloud.stubs import (
    MockCloudDeploy,
    MockFirestore,
    MockLogging,
    MockMonitoring,
)
from tests.fixtures import (
    get_malicious_log_payload,
    get_mock_anomalous_metrics,
    get_mock_baseline_metrics,
)


async def test_mock_firestore() -> None:
    db = MockFirestore()
    doc_data = {"key": "value", "id": "123"}
    await db.set_document("incidents", "123", doc_data)

    fetched = await db.get_document("incidents", "123")
    assert fetched == doc_data

    results = await db.query("incidents", [])
    assert len(results) == 1
    assert results[0]["key"] == "value"


async def test_mock_monitoring() -> None:
    monitor = MockMonitoring()
    monitor.set_metric("error_rate", 0.05)

    assert await monitor.get_metric("error_rate") == 0.05
    assert await monitor.get_metric("unknown") == 0.0

    # Stub baseline is 80% of current metric
    assert await monitor.get_baseline("error_rate") == pytest.approx(0.04)


async def test_mock_cloud_deploy() -> None:
    deploy = MockCloudDeploy()
    op_id = await deploy.execute_rollback("rel-123", "prod", "api-pipeline")

    assert op_id == "op-rollback-rel-123"
    assert len(deploy.rollbacks) == 1
    assert deploy.rollbacks[0]["release_id"] == "rel-123"


async def test_mock_logging() -> None:
    logging_stub = MockLogging()
    logging_stub.add_log({"msg": "test"})

    logs = await logging_stub.query_logs("")
    assert len(logs) == 1
    assert logs[0]["msg"] == "test"


def test_fixtures_provide_expected_structures() -> None:
    baseline = get_mock_baseline_metrics()
    assert "error_rate" in baseline
    assert baseline["error_rate"] == 0.01

    anomaly = get_mock_anomalous_metrics()
    assert anomaly["error_rate"] == 0.15
    assert anomaly["error_rate"] > baseline["error_rate"]

    payload = get_malicious_log_payload()
    assert payload["severity"] == "ERROR"
    assert "Ignore all previous instructions" in payload["textPayload"]
