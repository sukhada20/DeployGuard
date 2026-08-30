# Phase 1: Project Foundation & Simulation Layer - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the application runtime skeleton: FastAPI server, agent base architecture using Google ADK, Agent Registry, stub interfaces for all external cloud services (Cloud Deploy, Cloud Monitoring, Cloud Logging, Firestore), and a local dev harness. No real cloud calls; everything runs locally. The code already exists and this context captures retroactive decisions for downstream alignment.

</domain>

<decisions>
## Implementation Decisions

### Stub Fidelity
- **D-01:** Stubs are **deterministic + injectable** — `MockFirestore`, `MockMonitoring`, `MockCloudDeploy`, `MockLogging` return instant, predictable data by default but accept injected failure/latency scenarios via constructor params (e.g., `MockFirestore(fail_after=3)`, `MockMonitoring(latency_ms=200)`). Phase 2+ tests exercise error paths without making Phase 1 stubs heavy.
- **D-02:** Stubs share **formal Protocol interfaces** — Define `typing.Protocol` classes (`MetricsSource`, `DeploymentService`, `LogStore`, `DocumentStore`). Both stubs and future real GCP clients conform to the protocol. Agents depend on the protocol, not the concrete class. — **Reversibility:** costly — Protocol interfaces become the dependency boundary for all agent code; changing signatures later requires updating every agent and test.
- **D-03:** Fake data is **fixture-file driven** — Stubs load data from JSON/YAML fixture files (e.g., `fixtures/metrics_healthy.json`, `fixtures/metrics_anomaly.json`). Tests and demo scenarios reuse the same fixtures. New scenarios require only a new file, no code changes. — **Reversibility:** reversible — fixture format can evolve independently of stub code.
- **D-04:** Stubs are **async with sync fallback** — Stub methods are `async def` matching what real GCP clients will need, but internally synchronous (instant return). Agents use `await` from the start, avoiding a future migration. A sync wrapper is available for simple test scripts. — **Reversibility:** costly — switching between async and sync interfaces later requires touching every call site in agents, tests, and the harness.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, constraints, key decisions (fleet architecture, Google Cloud target, governed agents)
- `.planning/REQUIREMENTS.md` — v1 requirements; Phase 1 maps to FLEET-01, FLEET-02, FLEET-04, DEMO-02
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, plan breakdown (5 plans)

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Current system overview (sparse scaffold → application runtime)
- `.planning/codebase/STRUCTURE.md` — Directory layout, naming conventions, where to add new code
- `.planning/codebase/STACK.md` — Technology stack status (Python, FastAPI, Google ADK, Pydantic)

### Existing Implementation
- `src/deployguard/agents/base.py` — `BaseDeployGuardAgent` extending Google ADK `BaseAgent`; establishes `_execute` pattern
- `src/deployguard/state/workflow.py` — `DeploymentWorkflowState` Pydantic model with pipeline stages
- `src/deployguard/cloud/stubs.py` — Current stub implementations (to be updated per D-01 through D-04)
- `src/deployguard/registry/models.py` — Agent Registry schema
- `src/deployguard/main.py` — FastAPI app factory with lifespan, router includes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseDeployGuardAgent` (Google ADK BaseAgent subclass): All 5 agents extend this; provides workflow state get/set via ADK session
- `DeploymentWorkflowState` (Pydantic BaseModel): Full lifecycle model with `AnomalySignal`, `DecisionTrace` sub-models
- `MockFirestore`, `MockMonitoring`, `MockCloudDeploy`, `MockLogging`: Current sync stubs — target for Protocol + async + injectable refactor
- `registry/store.py` + `registry/seed.py`: In-memory registry with 5 seeded agents
- `api/health.py` + `api/registry.py`: FastAPI routers for health check and registry CRUD

### Established Patterns
- ADK agent pattern: `_run_async_impl()` → `_execute()` abstract method per agent
- Pydantic model serialization: `to_session_dict()` / `from_session_dict()` for ADK session state
- FastAPI app factory: `create_app()` with lifespan context manager for startup/shutdown
- Router-based API organization: separate router modules included in main app

### Integration Points
- `main.py` lifespan: where stub instances are created and injected (currently seeds registry only)
- `config.py`: application settings via `get_settings()`
- `tests/`: existing test files for agents, cloud, health, registry — need async test support

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Decisions focus on establishing clean interfaces and testability for downstream phases.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-foundation-simulation-layer*
*Context gathered: 2026-08-29*
