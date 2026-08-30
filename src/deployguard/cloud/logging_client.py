"""Google Cloud Logging live client and Logging Query Language (LQL) builders.

Constructs structured Cloud Logging filters for Cloud Run revisions and runs
all retrieved log payloads through `LogSanitizer` to prevent PII leaks and prompt injection.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from deployguard.security.sanitizer import LogSanitizer

logger = logging.getLogger(__name__)


def build_lql_filter(
    service_name: str,
    min_severity: str = "WARNING",
    timestamp_iso: str | None = None,
    text_payload_contains: str | None = None,
) -> str:
    """Build a Google Cloud Logging Query Language (LQL) filter string.

    Args:
        service_name: Cloud Run service name.
        min_severity: Minimum log severity (DEFAULT, DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL).
        timestamp_iso: Optional ISO 8601 timestamp string for start time.
        text_payload_contains: Optional substring search inside textPayload or jsonPayload.

    Returns:
        A structured LQL filter string.
    """
    filters = [
        'resource.type="cloud_run_revision"',
        f'resource.labels.service_name="{service_name}"',
        f"severity>={min_severity}",
    ]

    if timestamp_iso:
        filters.append(f'timestamp>="{timestamp_iso}"')

    if text_payload_contains:
        # Sanitize substring quotes
        safe_term = text_payload_contains.replace('"', '\\"')
        filters.append(f'textPayload:"{safe_term}"')

    return " AND ".join(filters)


class LiveCloudLoggingClient:
    """Live client for querying Google Cloud Logging.

    Enforces LogSanitizer pass-through on every queried log.
    """

    def __init__(
        self,
        project_id: str | None = None,
        sanitizer: LogSanitizer | None = None,
        client: Any | None = None,
    ) -> None:
        self.project_id = project_id or os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "deployguard-prod"
        )
        self.sanitizer = sanitizer or LogSanitizer()
        self._client = client

    def _get_client(self) -> Any:
        if self._client is None:
            from google.cloud import logging as cloud_logging

            self._client = cloud_logging.Client(project=self.project_id)
        return self._client

    async def query_logs(
        self, filter_str: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Query Cloud Logging and return sanitized log entries.

        Args:
            filter_str: LQL filter expression.
            limit: Maximum entries to return.

        Returns:
            List of sanitized log dicts.
        """
        logger.info(
            "Executing Cloud Logging query: filter=%s, limit=%d", filter_str, limit
        )
        results: list[dict[str, Any]] = []
        try:
            client = self._get_client()
            entries = client.list_entries(filter_=filter_str, max_results=limit)
            for entry in entries:
                payload = entry.payload
                sanitized_payload = self._sanitize_payload(payload)
                results.append(
                    {
                        "insert_id": getattr(entry, "insert_id", None),
                        "timestamp": getattr(entry, "timestamp", None),
                        "severity": getattr(entry, "severity", "DEFAULT"),
                        "payload": sanitized_payload,
                    }
                )
        except Exception as e:
            logger.warning(
                "Failed querying Cloud Logging (filter=%s): %s", filter_str, e
            )

        return results

    def _sanitize_payload(self, payload: Any) -> Any:
        if isinstance(payload, str):
            return self.sanitizer.sanitize(payload)
        elif isinstance(payload, dict):
            return {k: self._sanitize_payload(v) for k, v in payload.items()}
        elif isinstance(payload, list):
            return [self._sanitize_payload(x) for x in payload]
        return payload
