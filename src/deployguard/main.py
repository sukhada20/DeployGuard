import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from deployguard.api.dashboard import router as dashboard_router
from deployguard.api.events import router as events_router
from deployguard.api.health import router as health_router
from deployguard.api.postmortems import router as postmortems_router
from deployguard.api.registry import router as registry_router
from deployguard.api.traces import router as traces_router
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

    # CORS configuration for frontend development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health_router)
    app.include_router(registry_router)
    app.include_router(dashboard_router)
    app.include_router(events_router)
    app.include_router(traces_router)
    app.include_router(postmortems_router)

    # Static mount for frontend build output if directory exists
    web_out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "web", "out")
    if os.path.exists(web_out_dir):
        app.mount("/", StaticFiles(directory=web_out_dir, html=True), name="static-web")

    return app


app = create_app()
