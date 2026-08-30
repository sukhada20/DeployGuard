"""Live Google Cloud Firestore client implementing DocumentStore protocol.

Provides asynchronous CRUD operations and vector search over Firestore collections.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from deployguard.cloud.embeddings import cosine_similarity

logger = logging.getLogger(__name__)


class LiveFirestoreStore:
    """Live Google Cloud Firestore client conforming to DocumentStore protocol."""

    def __init__(
        self,
        project_id: str | None = None,
        database: str = "(default)",
        client: Any | None = None,
    ) -> None:
        self.project_id = project_id or os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "deployguard-prod"
        )
        self.database = database
        self._client = client

    def _get_client(self) -> Any:
        if self._client is None:
            from google.cloud import firestore

            self._client = firestore.AsyncClient(
                project=self.project_id,
                database=self.database,
            )
        return self._client

    async def set_document(
        self, collection: str, document_id: str, data: dict[str, Any]
    ) -> None:
        """Create or replace a document in the given collection."""
        client = self._get_client()
        doc_ref = client.collection(collection).document(document_id)
        await doc_ref.set(data)
        logger.debug("Firestore set_document: %s/%s", collection, document_id)

    async def get_document(
        self, collection: str, document_id: str
    ) -> dict[str, Any] | None:
        """Fetch a document by ID."""
        client = self._get_client()
        doc_ref = client.collection(collection).document(document_id)
        snapshot = await doc_ref.get()
        if snapshot.exists:
            return snapshot.to_dict()
        return None

    async def delete_document(self, collection: str, document_id: str) -> None:
        """Delete a document by ID."""
        client = self._get_client()
        doc_ref = client.collection(collection).document(document_id)
        await doc_ref.delete()
        logger.debug("Firestore delete_document: %s/%s", collection, document_id)

    async def query(
        self, collection: str, filters: list[tuple[str, str, Any]]
    ) -> list[dict[str, Any]]:
        """Query a Firestore collection with FieldFilter tuples (field, op, value)."""
        from google.cloud.firestore_v1 import FieldFilter

        client = self._get_client()
        query_ref = client.collection(collection)

        for item in filters:
            if len(item) == 3:
                field, op, val = item
                query_ref = query_ref.where(filter=FieldFilter(field, op, val))

        results: list[dict[str, Any]] = []
        async for doc in query_ref.stream():
            data = doc.to_dict()
            if data is not None:
                results.append(data)

        return results

    async def find_nearest_in_collection(
        self,
        collection: str,
        filter_field: str,
        filter_value: Any,
        vector_field: str,
        query_vector: list[float],
        limit: int,
        threshold: float = 0.70,
    ) -> list[dict[str, Any]]:
        """Retrieve similar historical incidents using hybrid pre-filtering + vector search.

        Pre-filters documents by `filter_field == filter_value`, then scores by cosine similarity.
        """
        # Fetch candidate documents for the specific service/scope
        candidates = await self.query(
            collection, [(filter_field, "==", filter_value)]
        )

        scored: list[tuple[float, dict[str, Any]]] = []
        for doc in candidates:
            emb = doc.get(vector_field)
            if not emb:
                continue
            score = cosine_similarity(query_vector, emb)
            if score >= threshold:
                scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:limit]]

