"""Telemetry and distributed tracing for DeployGuard."""

from deployguard.telemetry.tracer import (
    extract_trace_context,
    get_in_memory_exporter,
    get_tracer,
    init_tracer,
    inject_trace_context,
    reset_tracer,
    trace_agent_step,
    trace_deployment,
)

__all__ = [
    "init_tracer",
    "get_tracer",
    "get_in_memory_exporter",
    "reset_tracer",
    "trace_deployment",
    "trace_agent_step",
    "inject_trace_context",
    "extract_trace_context",
]
