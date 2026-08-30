"""DeployGuard FastAPI application factory."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from deployguard.api.health import router as health_router
from deployguard.api.registry import router as registry_router
from deployguard.config import get_settings
from deployguard.registry.seed import SEED_AGENTS
from deployguard.registry.store import seed_registry


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown."""
    settings = get_settings()
    app.state.settings = settings

    # Seed the Agent Registry on startup
    registry = seed_registry(SEED_AGENTS)
    app.state.registry = registry

    yield
    # Cleanup (no-op in Phase 1)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Fortified enterprise fleet for safe CI/CD operations",
        lifespan=lifespan,
    )

    # Routers
    app.include_router(health_router)
    app.include_router(registry_router)

    return app


app = create_app()
