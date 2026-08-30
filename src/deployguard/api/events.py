"""Server-Sent Events (SSE) broadcaster and streaming endpoint."""

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


class AsyncEventBroadcaster:
    """Manages real-time event broadcasting to SSE subscribers."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._lock = asyncio.Lock()

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
        """Broadcast an event payload to all connected subscribers."""
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        async with self._lock:
            subscribers = list(self._subscribers)

        for queue in subscribers:
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                logger.warning("Subscriber queue full; dropping event %s", event_type)


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
