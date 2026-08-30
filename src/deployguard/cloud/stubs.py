"""Stub implementations for Google Cloud services (Phase 1).

These protocol-compatible stubs allow isolated local development
and testing without GCP credentials or an emulator.
"""

from typing import Any


class MockFirestore:
    """Stubs Google Cloud Firestore interactions."""

    def __init__(self) -> None:
        self.documents: dict[str, dict[str, Any]] = {}

    async def set_document(
        self, collection: str, document_id: str, data: dict[str, Any]
    ) -> None:
        key = f"{collection}/{document_id}"
        self.documents[key] = data

    async def get_document(
        self, collection: str, document_id: str
    ) -> dict[str, Any] | None:
        key = f"{collection}/{document_id}"
        return self.documents.get(key)

    async def query(
        self, collection: str, filters: list[tuple[str, str, Any]]
    ) -> list[dict[str, Any]]:
        # Extremely simplified stub query just returning all docs in the collection
        return [
            data
            for key, data in self.documents.items()
            if key.startswith(f"{collection}/")
        ]


class MockMonitoring:
    """Stubs Google Cloud Monitoring (Metrics) interactions."""

    def __init__(self) -> None:
        self.metric_values: dict[str, float] = {}

    def set_metric(self, metric_name: str, value: float) -> None:
        self.metric_values[metric_name] = value

    async def get_metric(self, metric_name: str) -> float:
        return self.metric_values.get(metric_name, 0.0)

    async def get_baseline(self, metric_name: str) -> float:
        # Stub: returns a lower baseline to simulate anomalies
        return self.metric_values.get(metric_name, 0.0) * 0.8


class MockCloudDeploy:
    """Stubs Google Cloud Deploy API for rollbacks."""

    def __init__(self) -> None:
        self.rollbacks: list[dict[str, Any]] = []

    async def execute_rollback(
        self, release_id: str, target_id: str, delivery_pipeline_id: str
    ) -> str:
        operation_id = f"op-rollback-{release_id}"
        self.rollbacks.append(
            {
                "operation_id": operation_id,
                "release_id": release_id,
                "target_id": target_id,
                "pipeline": delivery_pipeline_id,
            }
        )
        return operation_id


class MockLogging:
    """Stubs Google Cloud Logging for querying logs."""

    def __init__(self) -> None:
        self.logs: list[dict[str, Any]] = []

    def add_log(self, payload: dict[str, Any]) -> None:
        self.logs.append(payload)

    async def query_logs(self, filter_str: str) -> list[dict[str, Any]]:
        # In a real implementation this would parse the filter.
        # Here we just return all seeded logs for simplicity.
        return self.logs
