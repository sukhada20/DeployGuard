"""Server-Sent Events (SSE) broadcaster, event buffer, and streaming endpoint."""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/events", tags=["events"])

SEEDED_EVENTS: list[dict[str, Any]] = [
    {
        "event": "postmortem_generated",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "report_id": "pm-checkout-service-dep-9942",
            "outcome": "recovered",
            "role": "postmortem_agent",
            "action": "POSTMORTEM_SYNTHESIZED",
            "message": "SRE Incident Postmortem report 'pm-checkout-service-dep-9942' synthesized and saved to Firestore.",
            "thinking": "5-Whys root cause analysis synthesized and saved publication-ready SRE Markdown document.",
        },
        "timestamp": "2026-08-31T13:45:08Z",
    },
    {
        "event": "recovery_verified",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "verdict": "recovered",
            "role": "deploy_monitor_agent",
            "action": "RECOVERY_VERIFIED",
            "message": "Multi-iteration recovery verification complete. Verdict: recovered. All metrics normalized below baseline thresholds.",
            "thinking": "Sampled 3/3 iterations: error rate dropped to 1.0%, latency restored to 120ms.",
        },
        "timestamp": "2026-08-31T13:45:06Z",
    },
    {
        "event": "rollback_initiated",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "target_version": "v2.3.9",
            "operation_id": "op-9942",
            "role": "rollback_agent",
            "action": "ROLLBACK_INITIATED",
            "message": "Cloud Deploy rollback executed to stable version v2.3.9. Operation ID: op-9942.",
            "thinking": "Validated gateway authorization and executed deployment rollback.",
        },
        "timestamp": "2026-08-31T13:44:48Z",
    },
    {
        "event": "decision_evaluated",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "action": "rollback",
            "confidence": 0.94,
            "policy_passed": True,
            "authorized": True,
            "role": "decision_agent",
            "action_type": "POLICY_AUTHORIZED",
            "message": "Decision verdict: rollback (Confidence 0.94). Policy checks: 5/5 PASSED.",
            "thinking": "Evaluated evidence against deterministic PolicyEngine: confidence, severity, age, stable target checks passed.",
        },
        "timestamp": "2026-08-31T13:44:34Z",
    },
    {
        "event": "memory_retrieved",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "matched_incidents": 1,
            "top_match": "INC-2026-0819",
            "role": "incident_memory_agent",
            "action": "MEMORY_RETRIEVED",
            "message": "Incident memory matched past incident: INC-2026-0819. Historical resolution context retrieved.",
            "thinking": "Vertex AI RAG embedding search matched 1 past incident with 0.91 similarity.",
        },
        "timestamp": "2026-08-31T13:44:33Z",
    },
    {
        "event": "anomaly_detected",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "severity": "CRITICAL",
            "confidence": 0.96,
            "anomalies": ["error_rate", "latency_p95"],
            "role": "deploy_monitor_agent",
            "action": "ANOMALY_DETECTED",
            "message": "CRITICAL anomaly detected: severity=CRITICAL, confidence=0.96, affected metrics: [error_rate, latency_p95].",
            "thinking": "Statistical metric delta breached critical threshold (1.25x baseline). Dispatching anomaly signal to state.",
        },
        "timestamp": "2026-08-31T13:44:32Z",
    },
    {
        "event": "deployment_initiated",
        "data": {
            "deployment_id": "dep-994211a-prod",
            "service_name": "checkout-service",
            "version": "v2.4.0",
            "environment": "production",
            "status": "monitoring",
            "role": "deploy_monitor_agent",
            "action": "DEPLOYMENT_INITIATED",
            "message": "Deployment candidate v2.4.0 initiated for service checkout-service (production).",
            "thinking": "Target candidate version v2.4.0 registered. Monitoring 7 telemetry metrics against baseline.",
        },
        "timestamp": "2026-08-31T13:44:20Z",
    },
]


class AsyncEventBroadcaster:
    """Manages real-time event broadcasting and historical event buffering."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._lock = asyncio.Lock()
        self._history: list[dict[str, Any]] = list(SEEDED_EVENTS)

    async def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        """Register a new client subscriber queue."""
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(queue)
            logger.info(
                "SSE client connected. Total subscribers: %d", len(self._subscribers)
            )
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        """Unregister a client subscriber queue."""
        async with self._lock:
            self._subscribers.discard(queue)
            logger.info(
                "SSE client disconnected. Remaining subscribers: %d",
                len(self._subscribers),
            )

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        """Broadcast an event payload to all connected subscribers and history buffer."""
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(UTC).isoformat(),
        }

        async with self._lock:
            # Prepend to history buffer (cap at 100 events)
            self._history.insert(0, payload)
            if len(self._history) > 100:
                self._history.pop()

            subscribers = list(self._subscribers)

        for queue in subscribers:
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                logger.warning("Subscriber queue full; dropping event %s", event_type)

    def get_history(self) -> list[dict[str, Any]]:
        """Retrieve recent buffered events."""
        return list(self._history)


# Global singleton broadcaster instance
broadcaster = AsyncEventBroadcaster()


async def event_generator(
    queue: asyncio.Queue[dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """Yield formatted SSE event chunks and periodic heartbeats."""
    # Send initial connection confirmation
    yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'timestamp': datetime.now(UTC).isoformat()})}\n\n"

    try:
        while True:
            try:
                # Wait for next event or timeout to send heartbeat
                event_payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                event_type = event_payload.get("event", "message")
                data_str = json.dumps(event_payload.get("data", {}))
                yield f"event: {event_type}\ndata: {data_str}\n\n"
            except TimeoutError:
                # Heartbeat keep-alive
                yield f": heartbeat {datetime.now(UTC).isoformat()}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        await broadcaster.unsubscribe(queue)


@router.get("/stream")
async def stream_events() -> StreamingResponse:
    """Server-Sent Events endpoint streaming real-time agent activities and telemetry."""
    queue = await broadcaster.subscribe()
    return StreamingResponse(
        event_generator(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history")
async def get_event_history() -> list[dict[str, Any]]:
    """Retrieve full buffered history of agent events."""
    return broadcaster.get_history()
