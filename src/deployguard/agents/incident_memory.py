"""Incident Memory Agent — stores and retrieves historical incident context."""

import logging
from collections.abc import AsyncGenerator
from typing import Any

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.cloud.interfaces import DocumentStore
from deployguard.cloud.stubs import MockFirestore
from deployguard.security.sanitizer import LogSanitizer

logger = logging.getLogger(__name__)


class IncidentMemoryAgent(BaseDeployGuardAgent):
    """Persists incident events and retrieves similar historical incidents.

    Phase 1: Stub returns empty incident history.
    Phase 2: Real Firestore integration with access controls and sanitization.
    """

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

        # 1. If an anomaly is present, persist the current incident info (sanitized)
        if state.anomaly_signal:
            raw_dict = state.to_session_dict()
            sanitized_dict = self._sanitize_val(raw_dict)
            await self._document_store.set_document(
                "incidents", state.deployment_id, sanitized_dict
            )
            logger.info(
                "Persisted sanitized incident state for deployment: %s",
                state.deployment_id,
            )

        # 2. Query for similar past incidents on the same service
        all_incidents = await self._document_store.query("incidents", [])
        past_incidents = [
            inc
            for inc in all_incidents
            if inc.get("service_name") == state.service_name
            and inc.get("deployment_id") != state.deployment_id
        ]

        logger.info("Found %d similar past incidents", len(past_incidents))

        if past_incidents:
            ids = [inc["deployment_id"] for inc in past_incidents]
            msg = f"Found {len(past_incidents)} similar past incidents: {ids}"
        else:
            msg = "No similar incidents found in memory"

        yield Event(
            author=self.name,
            content=Content(role="model", parts=[Part(text=msg)]),
        )
