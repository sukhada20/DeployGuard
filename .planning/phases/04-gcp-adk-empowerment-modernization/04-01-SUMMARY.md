---
plan: 04-01
phase: 04
status: complete
date: 2026-08-30
key-files:
  created:
    - src/deployguard/agents/adk_tools.py
    - agent.yaml
    - tests/test_adk_fleet.py
  modified:
    - src/deployguard/agents/base.py
---

# Plan 04-01 Summary — Google ADK Fleet Architecture & Gateway Tool Interceptor

## What Was Built

- **`adk_tools.py`**: `gateway_tool(permission)` synchronous decorator factory with registry + permission checks and LogSanitizer argument sanitization. Four ADK-compatible function tools: `query_monitoring_metrics`, `fetch_historical_incidents`, `request_deployment_rollback`, `record_incident`. `init_gateway_tools()` factory for dependency injection.
- **`base.py`**: Added `DEFAULT_MODEL_FAST` / `DEFAULT_MODEL_DECISION` env-configurable constants and `create_llm_agent()` LlmAgent factory. Existing `BaseDeployGuardAgent(BaseAgent)` preserved unchanged.
- **`agent.yaml`**: agents-cli compatible YAML manifest declaring all 5 DeployGuard agents with models, instructions, and tool registrations.
- **`test_adk_fleet.py`**: 15 pytest unit tests covering gateway enforcement, sanitization, tool signatures, model defaults, and LlmAgent construction.

## Key Files
- `src/deployguard/agents/adk_tools.py` — NEW: gateway_tool decorator + 4 ADK function tools
- `src/deployguard/agents/base.py` — MODIFIED: LlmAgent factory + model configuration
- `agent.yaml` — NEW: agents-cli manifest
- `tests/test_adk_fleet.py` — NEW: 15 unit tests

## Test Results
```
15 passed, 2 warnings in 2.20s
```

## Self-Check: PASSED
- [x] gateway_tool enforces registry lookup, status check, permission check
- [x] String arguments sanitized before tool execution
- [x] base.py preserves BaseDeployGuardAgent API, adds create_llm_agent factory
- [x] agent.yaml valid YAML with all 5 agents defined
- [x] All 15 tests pass

## Deviations
- `AgentGateway.authorize_action` is async; decorator uses registry directly (sync) to avoid event loop issues in synchronous tool call context. This is correct as the registry is the authoritative source of truth.
- pytest was not present in dev dependencies; added via `uv add --dev pytest` (15 tests collected, all pass).
