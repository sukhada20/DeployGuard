"""Rollback Agent — executes approved rollbacks via Cloud Deploy."""

import logging
from collections.abc import AsyncGenerator

from google.adk.agents import InvocationContext
from google.adk.events.event import Event

from deployguard.agents.base import BaseDeployGuardAgent

logger = logging.getLogger(__name__)


class RollbackAgent(BaseDeployGuardAgent):
    """Executes authorized rollbacks. Only operates after gateway authorization.

    Phase 1: Stub records rollback attempt but does not call Cloud Deploy.
    Phase 4: Real implementation with Cloud Deploy and recovery verification.
    """

    def __init__(self) -> None:
        super().__init__(
            name="rollback_agent",
            agent_id="rollback-v1",
        )

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("STUB: RollbackAgent — rollback not authorized (no decision)")
        yield Event(
            author=self.name,
            content="STUB: Rollback skipped — no authorized rollback decision",  # type: ignore
        )
