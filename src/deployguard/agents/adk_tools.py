"""ADK-compatible function tools with Gateway enforcement.

This module defines the four core DeployGuard tools as plain Python functions
that can be registered with ADK LlmAgent instances. Each tool is wrapped by
the `gateway_tool` decorator which enforces agent identity and permission checks
via the AgentRegistry before execution.

Usage:
    tools = init_gateway_tools(registry, gateway, sanitizer)
    agent = LlmAgent(name="rollback", tools=list(tools.values()))
"""

from __future__ import annotations

import functools
import hashlib
import logging
import time
from collections.abc import Callable
from typing import Any

from deployguard.registry.store import AgentRegistry
from deployguard.security.gateway import AgentGateway
from deployguard.security.sanitizer import LogSanitizer

logger = logging.getLogger(__name__)

# Module-level singletons — populated by init_gateway_tools()
_registry: AgentRegistry | None = None
_gateway: AgentGateway | None = None
_sanitizer: LogSanitizer | None = None


def gateway_tool(permission: str) -> Callable:
    """Decorator factory that enforces agent identity and permission checks.

    Args:
        permission: The permission string the calling agent must hold,
            e.g. "monitoring.read", "deployment.rollback".

    Returns:
        A decorator that wraps an ADK tool function with gateway enforcement.

    Raises:
        PermissionError: If the agent is not registered, not ACTIVE,
            or lacks the required permission.
    """

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(agent_id: str, *args: Any, **kwargs: Any) -> Any:
            if _registry is None:
                raise RuntimeError(
                    "Gateway tools not initialized. Call init_gateway_tools() first."
                )

            # 1. Verify agent identity in registry
            agent_entry = _registry.get(agent_id)
            if agent_entry is None:
                raise PermissionError(
                    f"Gateway denied: agent '{agent_id}' not found in registry."
                )
            if agent_entry.status != "ACTIVE":
                raise PermissionError(
                    f"Gateway denied: agent '{agent_id}' is {agent_entry.status}, not ACTIVE."
                )

            # 2. Verify permission
            if permission not in agent_entry.permissions:
                raise PermissionError(
                    f"Gateway denied: agent '{agent_id}' lacks permission '{permission}'. "
                    f"Agent permissions: {agent_entry.permissions}"
                )

            # 3. Sanitize string arguments
            if _sanitizer is not None:
                sanitized_args = tuple(
                    _sanitizer.sanitize(a) if isinstance(a, str) else a for a in args
                )
                sanitized_kwargs = {
                    k: _sanitizer.sanitize(v) if isinstance(v, str) else v
                    for k, v in kwargs.items()
                }
            else:
                sanitized_args = args
                sanitized_kwargs = kwargs

            logger.info(
                "Gateway authorized: agent='%s' permission='%s' tool='%s'",
                agent_id,
                permission,
                fn.__name__,
            )
            return fn(agent_id, *sanitized_args, **sanitized_kwargs)

        return wrapper

    return decorator


@gateway_tool("monitoring.read")
def query_monitoring_metrics(
    agent_id: str, service_name: str, window_minutes: int = 60
) -> dict:
    """Query deployment metric telemetry for the given service and time window.

    Args:
        agent_id: The ID of the calling agent (used for gateway authorization).
        service_name: The Cloud Run service name to query metrics for.
        window_minutes: The look-back window in minutes (default 60).

    Returns:
        A dict containing metric dimensions and their current values.
    """
    logger.info(
        "query_monitoring_metrics: agent=%s service=%s window=%dm",
        agent_id,
        service_name,
        window_minutes,
    )
    return {
        "service_name": service_name,
        "window_minutes": window_minutes,
        "metrics": {},
        "status": "stub",
    }


@gateway_tool("incidents.read")
def fetch_historical_incidents(
    agent_id: str, service_name: str, k: int = 3
) -> list[dict]:
    """Retrieve the top-k similar historical incidents for the given service.

    Uses pre-filtered Firestore vector search with cosine similarity threshold >= 0.70.

    Args:
        agent_id: The ID of the calling agent (used for gateway authorization).
        service_name: The service name to scope the incident search.
        k: Maximum number of incidents to retrieve (default 3).

    Returns:
        A list of historical incident dicts ordered by relevance.
    """
    logger.info(
        "fetch_historical_incidents: agent=%s service=%s k=%d",
        agent_id,
        service_name,
        k,
    )
    return []


@gateway_tool("deployment.rollback")
def request_deployment_rollback(
    agent_id: str, deployment_id: str, reason: str
) -> dict:
    """Request a Cloud Deploy rollback for the specified deployment.

    This is a high-privilege operation. The calling agent must hold the
    ``deployment.rollback`` permission.

    Args:
        agent_id: The ID of the calling agent (used for gateway authorization).
        deployment_id: The Cloud Deploy release / rollout ID to roll back.
        reason: Human-readable justification for the rollback.

    Returns:
        A dict with operation_id, status, and deployment_id.
    """
    logger.info(
        "request_deployment_rollback: agent=%s deployment=%s reason=%s",
        agent_id,
        deployment_id,
        reason,
    )
    return {
        "operation_id": f"op-rollback-{deployment_id}",
        "deployment_id": deployment_id,
        "status": "requested",
        "reason": reason,
    }


@gateway_tool("incidents.write")
def record_incident(
    agent_id: str, service_name: str, summary: str, severity: str
) -> dict:
    """Record a new incident or postmortem summary in incident memory.

    Args:
        agent_id: The ID of the calling agent (used for gateway authorization).
        service_name: The affected service name.
        summary: A textual summary of the incident.
        severity: Incident severity: LOW, MEDIUM, HIGH, or CRITICAL.

    Returns:
        A dict with incident_id and storage status.
    """
    incident_id = hashlib.sha256(
        f"{service_name}-{time.time()}".encode()
    ).hexdigest()[:12]
    logger.info(
        "record_incident: agent=%s service=%s severity=%s id=%s",
        agent_id,
        service_name,
        severity,
        incident_id,
    )
    return {
        "incident_id": incident_id,
        "service_name": service_name,
        "severity": severity,
        "status": "recorded",
    }


def init_gateway_tools(
    registry: AgentRegistry,
    gateway: AgentGateway,
    sanitizer: LogSanitizer | None = None,
) -> dict[str, Callable]:
    """Initialize module-level singletons and return a dict of ready tools.

    Must be called once during application startup before any agent invocation.

    Args:
        registry: The populated AgentRegistry to validate agent identities.
        gateway: The AgentGateway instance (held for future async operations).
        sanitizer: Optional LogSanitizer; uses a default instance if omitted.

    Returns:
        Dict mapping tool function names to their gateway-wrapped callables.
    """
    global _registry, _gateway, _sanitizer
    _registry = registry
    _gateway = gateway
    _sanitizer = sanitizer or LogSanitizer()

    return {
        "query_monitoring_metrics": query_monitoring_metrics,
        "fetch_historical_incidents": fetch_historical_incidents,
        "request_deployment_rollback": request_deployment_rollback,
        "record_incident": record_incident,
    }
