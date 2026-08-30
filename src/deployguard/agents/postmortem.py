"""Postmortem Agent — generates auditable postmortem documents."""

import logging
from collections.abc import AsyncGenerator

from google.adk.agents import InvocationContext
from google.adk.events.event import Event

from deployguard.agents.base import BaseDeployGuardAgent

logger = logging.getLogger(__name__)


class PostmortemAgent(BaseDeployGuardAgent):
    """Generates postmortem reports after incident resolution.

    Phase 1: Stub acknowledges completion.
    Phase 5: Real implementation generating structured postmortem documents.
    """

    def __init__(self) -> None:
        super().__init__(
            name="postmortem_agent",
            agent_id="postmortem-v1",
        )

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("STUB: PostmortemAgent — generating postmortem")
        yield Event(
            author=self.name,
            content="STUB: Postmortem placeholder — no incident to report",  # type: ignore
        )
