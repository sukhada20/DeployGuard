"""Incident Memory Agent — stores and retrieves historical incident context.

Phase 4 upgrade: vector embedding generation on store and pre-filtered
hybrid retrieval (metadata filter + cosine similarity via MockFirestore
in-memory fallback or live Firestore VectorQuery).
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncGenerator
from typing import Any, ClassVar

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.cloud.embeddings import COSINE_THRESHOLD as _COSINE_THRESHOLD
from deployguard.cloud.embeddings import DEFAULT_TOP_K as _DEFAULT_TOP_K
from deployguard.cloud.embeddings import cosine_similarity, generate_embedding
from deployguard.cloud.interfaces import DocumentStore
from deployguard.cloud.stubs import MockFirestore
from deployguard.security.sanitizer import LogSanitizer

logger = logging.getLogger(__name__)


class IncidentMemoryAgent(BaseDeployGuardAgent):
    """Persists incident events and retrieves similar historical incidents.

    Phase 4: Uses text-embedding-004 (or mock) for dense semantic similarity
    search. Implements pre-filtered Firestore VectorQuery with cosine threshold.

    Class constants:
        COSINE_THRESHOLD: Minimum cosine similarity score for retrieval.
        DEFAULT_TOP_K: Default number of incidents to retrieve.
    """

    COSINE_THRESHOLD: ClassVar[float] = _COSINE_THRESHOLD
    DEFAULT_TOP_K: ClassVar[int] = _DEFAULT_TOP_K

    def __init__(
        self,
        document_store: DocumentStore | None = None,
        sanitizer: LogSanitizer | None = None,
    ) -> None:
        super().__init__(
            name="incident_memory",
            agent_id="incident-memory-v1",
        )
        self._document_store = document_store or MockFirestore()
        self._sanitizer = sanitizer or LogSanitizer()

    def _sanitize_val(self, val: Any) -> Any:
        if isinstance(val, dict):
            return {k: self._sanitize_val(v) for k, v in val.items()}
        elif isinstance(val, list):
            return [self._sanitize_val(v) for v in val]
        elif isinstance(val, str):
            return self._sanitizer.sanitize(val)
        return val

    async def store_incident(
        self, incident_id: str, data: dict[str, Any]
    ) -> None:
        """Store an incident with its embedding vector.

        Sanitizes all string fields, generates a text-embedding-004 vector
        synchronously from the incident summary, and persists both data
        and embedding to Firestore.

        Args:
            incident_id: Unique deployment/incident identifier.
            data: Incident data dict (should contain 'service_name').
        """
        sanitized = self._sanitize_val(data)

        # Build text representation for embedding
        embed_text = " ".join(
            filter(
                None,
                [
                    sanitized.get("service_name", ""),
                    sanitized.get("anomaly_type", ""),
                    sanitized.get("summary", ""),
                    sanitized.get("resolution", ""),
                ],
            )
        ).strip() or str(incident_id)

        embedding = generate_embedding(embed_text)
        sanitized["embedding"] = embedding

        await self._document_store.set_document("incidents", incident_id, sanitized)
        logger.info(
            "Stored incident '%s' for service '%s' with %d-dim embedding",
            incident_id,
            sanitized.get("service_name", "unknown"),
            len(embedding),
        )

    async def find_similar_incidents(
        self,
        service_name: str,
        query_text: str,
        k: int = _DEFAULT_TOP_K,
    ) -> list[dict[str, Any]]:
        """Retrieve similar historical incidents using hybrid vector search.

        Implements pre-filtered retrieval:
        1. Filter by service_name metadata
        2. Compute cosine similarity between query embedding and stored embeddings
        3. Return top-k results above COSINE_THRESHOLD, sorted by relevance

        Args:
            service_name: Service name filter (applied before vector search).
            query_text: Text describing the current anomaly for similarity matching.
            k: Maximum number of results to return (default DEFAULT_TOP_K).

        Returns:
            List of incident dicts sorted by cosine similarity (descending),
            limited to k results above COSINE_THRESHOLD.
        """
        query_embedding = generate_embedding(query_text)

        # Use MockFirestore's find_nearest_in_collection if available
        if hasattr(self._document_store, "find_nearest_in_collection"):
            return await self._document_store.find_nearest_in_collection(
                collection="incidents",
                filter_field="service_name",
                filter_value=service_name,
                vector_field="embedding",
                query_vector=query_embedding,
                limit=k,
                threshold=self.COSINE_THRESHOLD,
            )

        # Fallback: in-memory cosine similarity
        all_docs = await self._document_store.query("incidents", [])
        service_docs = [
            doc for doc in all_docs if doc.get("service_name") == service_name
        ]

        scored: list[tuple[float, dict[str, Any]]] = []
        for doc in service_docs:
            emb = doc.get("embedding")
            if not emb:
                continue
            score = cosine_similarity(query_embedding, emb)
            if score >= self.COSINE_THRESHOLD:
                scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:k]]

    async def get_incidents(self, service_name: str) -> list[dict[str, Any]]:
        """Retrieve all incidents for a service (backward compatibility).

        Args:
            service_name: The service name to filter by.

        Returns:
            All incidents for the given service, unordered.
        """
        all_docs = await self._document_store.query("incidents", [])
        return [
            doc for doc in all_docs if doc.get("service_name") == service_name
        ]

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("IncidentMemoryAgent — querying and updating memory bank")
        state = self.get_workflow_state(ctx)
        if not state:
            logger.warning("No workflow state found in context")
            yield Event(
                author=self.name,
                content=Content(
                    role="model", parts=[Part(text="Error: No workflow state found")]
                ),
            )
            return

        state.pipeline_status = "investigating"
        self.set_workflow_state(ctx, state)

        # 1. If anomaly present, persist current incident with embedding
        if state.anomaly_signal:
            raw_dict = state.to_session_dict()
            await self.store_incident(state.deployment_id, raw_dict)
            logger.info(
                "Persisted sanitized incident state for deployment: %s",
                state.deployment_id,
            )

        # 2. Query for similar past incidents using vector search
        anomaly_type = (
            state.anomaly_signal.anomaly_type if state.anomaly_signal else ""
        )
        query_text = f"{state.service_name} {anomaly_type}".strip()
        past_incidents = await self.find_similar_incidents(
            service_name=state.service_name,
            query_text=query_text or state.service_name,
        )
        # Exclude current deployment from results
        past_incidents = [
            inc
            for inc in past_incidents
            if inc.get("deployment_id") != state.deployment_id
        ]

        logger.info("Found %d similar past incidents", len(past_incidents))

        if past_incidents:
            ids = [inc.get("deployment_id", "unknown") for inc in past_incidents]
            msg = f"Found {len(past_incidents)} similar past incidents: {ids}"
        else:
            msg = "No similar incidents found in memory"

        yield Event(
            author=self.name,
            content=Content(role="model", parts=[Part(text=msg)]),
        )
