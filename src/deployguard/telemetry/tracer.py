"""OpenTelemetry distributed tracing for DeployGuard.

Supports dual exporter architecture:
- InMemorySpanExporter when in mock GCP mode or tests
- CloudTraceSpanExporter when live GCP mode is enabled (DEPLOYGUARD_MOCK_GCP=false)
"""

from __future__ import annotations

import contextlib
import logging
import os
from collections.abc import Generator
from typing import Any

from opentelemetry import trace
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import Span, Tracer
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

logger = logging.getLogger(__name__)

_tracer_provider: TracerProvider | None = None
_in_memory_exporter: InMemorySpanExporter | None = None
_propagator = TraceContextTextMapPropagator()


def is_mock_mode() -> bool:
    """Check if mock GCP mode is enabled."""
    return os.environ.get("DEPLOYGUARD_MOCK_GCP", "true").lower() in ("true", "1", "yes")


def init_tracer(service_name: str = "deployguard-fleet") -> Tracer:
    """Initialize OpenTelemetry TracerProvider with appropriate exporter.

    Args:
        service_name: Service name attribute for the TracerProvider resource.

    Returns:
        Configured OpenTelemetry Tracer instance.
    """
    global _tracer_provider, _in_memory_exporter

    if _tracer_provider is not None:
        return _tracer_provider.get_tracer(service_name)

    resource = Resource.create({SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)

    if is_mock_mode():
        logger.info("Initializing OpenTelemetry with InMemorySpanExporter (mock mode)")
        _in_memory_exporter = InMemorySpanExporter()
        processor = SimpleSpanProcessor(_in_memory_exporter)
        provider.add_span_processor(processor)
    else:
        try:
            from opentelemetry.exporter.gcp_trace import CloudTraceSpanExporter
            from opentelemetry.sdk.trace.export import BatchSpanProcessor

            logger.info("Initializing OpenTelemetry with CloudTraceSpanExporter (live GCP mode)")
            gcp_exporter = CloudTraceSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(gcp_exporter))
            _in_memory_exporter = None
        except Exception as e:
            logger.warning("Failed to initialize CloudTraceSpanExporter, falling back to InMemory: %s", e)
            _in_memory_exporter = InMemorySpanExporter()
            provider.add_span_processor(SimpleSpanProcessor(_in_memory_exporter))

    _tracer_provider = provider
    try:
        trace.set_tracer_provider(provider)
    except Exception:
        pass
    return provider.get_tracer(service_name)


def reset_tracer() -> None:
    """Reset the tracer provider and clear in-memory spans (primarily for tests)."""
    global _in_memory_exporter
    if _in_memory_exporter is not None:
        _in_memory_exporter.clear()


def get_tracer(name: str = "deployguard-fleet") -> Tracer:
    """Get the active OpenTelemetry tracer, initializing if necessary."""
    global _tracer_provider
    if _tracer_provider is None:
        init_tracer(name)
    assert _tracer_provider is not None
    return _tracer_provider.get_tracer(name)


def get_in_memory_exporter() -> InMemorySpanExporter | None:
    """Get the active InMemorySpanExporter instance if in mock mode."""
    return _in_memory_exporter


@contextlib.contextmanager
def trace_deployment(
    deployment_id: str,
    service_name: str,
    environment: str = "production",
    version: str = "1.0.0",
) -> Generator[Span, None, None]:
    """Context manager for the root deployment lifecycle span.

    Args:
        deployment_id: Deployment ID.
        service_name: Service name being deployed.
        environment: Deployment environment (staging, production).
        version: Target version string.

    Yields:
        The active root Span.
    """
    tracer = get_tracer()
    with tracer.start_as_current_span(
        "deployguard.deployment",
        attributes={
            "deployment.id": deployment_id,
            "service.name": service_name,
            "deployment.environment": environment,
            "deployment.version": version,
        },
    ) as span:
        yield span


@contextlib.contextmanager
def trace_agent_step(
    step_name: str, **attributes: Any
) -> Generator[Span, None, None]:
    """Context manager for a child agent lifecycle step span.

    Args:
        step_name: Step name (e.g. 'monitor.detect', 'decision.evaluate', 'rollback.execute', 'monitor.verify_recovery').
        attributes: Additional span attributes to record.

    Yields:
        The active child Span.
    """
    tracer = get_tracer()
    span_name = f"deployguard.{step_name}"
    # Convert attributes to string/primitive values
    clean_attributes = {}
    for k, v in attributes.items():
        if isinstance(v, (str, bool, int, float)):
            clean_attributes[k] = v
        else:
            clean_attributes[k] = str(v)

    with tracer.start_as_current_span(span_name, attributes=clean_attributes) as span:
        yield span


def inject_trace_context(carrier: dict[str, str]) -> dict[str, str]:
    """Inject the current W3C TraceContext into a dictionary carrier.

    Args:
        carrier: Dictionary to inject trace context headers into.

    Returns:
        The modified carrier dictionary.
    """
    _propagator.inject(carrier)
    return carrier


def extract_trace_context(carrier: dict[str, str]) -> Any:
    """Extract W3C TraceContext from a dictionary carrier.

    Args:
        carrier: Dictionary containing trace context headers (e.g. 'traceparent').

    Returns:
        Extracted OpenTelemetry Context.
    """
    return _propagator.extract(carrier)
