from typing import Any, Protocol


class MetricsSource(Protocol):
    async def get_metric(self, metric_name: str) -> float: ...
    async def get_baseline(self, metric_name: str) -> float: ...


class DocumentStore(Protocol):
    async def set_document(
        self, collection: str, document_id: str, data: dict[str, Any]
    ) -> None: ...
    async def get_document(
        self, collection: str, document_id: str
    ) -> dict[str, Any] | None: ...
    async def query(
        self, collection: str, filters: list[tuple]
    ) -> list[dict[str, Any]]: ...


class DeploymentManager(Protocol):
    async def execute_rollback(
        self, release_id: str, target_id: str, delivery_pipeline_id: str
    ) -> str: ...

