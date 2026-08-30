## RESEARCH COMPLETE

# Phase 1 Research: Project Foundation & Simulation Layer

**Phase:** 1 — Project Foundation & Simulation Layer
**Research Date:** 2026-08-23

---

## Stack Recommendation

### Python Version & Runtime
- **Python 3.12** (latest stable, required for ADK 2.x and modern typing)
- **`uv`** as package manager: fastest resolver, lockfile support, replaces pip/venv for dev workflows. `uv pip install -e .` for editable installs.
- **`uvicorn[standard]`** as ASGI server (bundles `httptools` + `websockets`)

### Project Layout
Use the **`src/` layout** — the 2025 standard:
```
deployguard/
├── src/
│   └── deployguard/
│       ├── __init__.py
│       ├── main.py            # FastAPI app factory
│       ├── api/               # Routers
│       ├── agents/            # Agent implementations
│       ├── gateway/           # Agent Gateway
│       ├── registry/          # Agent Registry
│       ├── stubs/             # Cloud service stubs
│       ├── state/             # WorkflowState
│       └── config.py          # pydantic-settings BaseSettings
├── tests/
├── pyproject.toml
├── Makefile
└── .env.example
```

### Tooling
```toml
[tool.ruff]
line-length = 88
target-version = "py312"
[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "ANN"]

[tool.mypy]
python_version = "3.12"
strict = true
```

### Core Dependencies
```toml
[project]
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic>=2.7",
  "pydantic-settings>=2.3",
  "google-adk>=1.0",
  "google-cloud-firestore>=2.16",
  "google-cloud-monitoring>=2.22",
  "google-cloud-logging>=3.10",
  "google-cloud-deploy>=1.18",
  "opentelemetry-api>=1.25",
  "opentelemetry-sdk>=1.25",
]

[project.optional-dependencies]
dev = [
  "ruff>=0.6",
  "mypy>=1.11",
  "pytest>=8.3",
  "pytest-asyncio>=0.24",
  "httpx>=0.27",  # for FastAPI TestClient async
]
```

---

## Google ADK vs Custom Orchestration — Recommendation

### ADK 2.x Key Patterns

**Custom Agent base class:**
```python
from google.adk.agents import BaseAgent, InvocationContext
from google.adk.events.event import Event
from typing import AsyncGenerator

class DeployMonitorAgent(BaseAgent):
    def __init__(self, name: str = "deploy-monitor", sub_agents=None):
        super().__init__(name=name, sub_agents=sub_agents or [])
    
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        # Access/update persistent state via ctx.session.state
        state = ctx.session.state
        deployment_id = state.get("current_deployment_id")
        # ... agent logic ...
        yield Event(...)
```

**Session state** (`ctx.session.state`) is a dict-like container that persists across the full deployment lifecycle — exactly what DeployGuard needs for the 10:00→10:15 timeline.

**Agent Hierarchy Options:**
- `SequentialAgent` — runs sub-agents in order (deploy→monitor→decide→rollback→postmortem)
- `ParallelAgent` — runs independent agents concurrently
- `BaseAgent` subclass — full control, needed for conditional branching (monitor→anomaly check→route to decision or continue)

### Recommendation: Use ADK with Custom BaseAgent Subclasses

**Use ADK because:**
1. `ctx.session.state` solves the long-running workflow state problem (FLEET-02) without rolling a custom persistence layer
2. Native Gemini integration (Phase 3 Decision Agent) — no glue code
3. Cloud Run deployment target is natively supported (`adk deploy cloud-run`)
4. ADK 2.x supports graph-based orchestration for the complex monitor→decision→rollback→verify flow

**Caveat:** ADK 2.x is evolving rapidly. Pin to a specific minor version in `pyproject.toml` and monitor the changelog before Phase 3 upgrades.

---

## Agent Base Class Pattern

### Recommended WorkflowState Schema
For Phase 1, use ADK's `ctx.session.state` dict with a typed Pydantic model serialized to/from it:

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

class DeploymentWorkflowState(BaseModel):
    # Deployment identity
    deployment_id: str
    service_name: str
    version: str
    environment: str  # "production" | "staging"
    deployed_at: datetime
    
    # Agent pipeline status
    pipeline_status: Literal[
        "monitoring", "anomaly_detected", "investigating",
        "decision_made", "rolling_back", "verifying", "complete"
    ] = "monitoring"
    
    # Monitoring results
    baseline_metrics: Optional[dict] = None
    current_metrics: Optional[dict] = None
    anomaly_signal: Optional[dict] = None  # {severity, evidence, confidence}
    
    # Decision results
    decision: Optional[Literal["wait", "alert", "rollback"]] = None
    decision_confidence: Optional[float] = None
    decision_trace_id: Optional[str] = None
    
    # Rollback results
    rollback_authorized: Optional[bool] = None
    rollback_executed: Optional[bool] = None
    rollback_target_version: Optional[str] = None
    
    # Recovery results
    recovery_verdict: Optional[Literal["recovered", "degraded", "inconclusive"]] = None
    
    # Postmortem
    postmortem_path: Optional[str] = None
```

### Five Agent Stubs (Phase 1 pattern)
```python
class DeployMonitorAgent(BaseAgent): ...    # Monitors metrics, produces anomaly_signal
class DecisionAgent(BaseAgent): ...         # Reasons over evidence, produces decision
class IncidentMemoryAgent(BaseAgent): ...   # Stores/retrieves historical incidents
class RollbackAgent(BaseAgent): ...         # Executes approved rollbacks
class PostmortemAgent(BaseAgent): ...       # Generates postmortem documents
```

Each stub in Phase 1: `_run_async_impl` logs "STUB: {agent} called" and returns a deterministic fake result from the stub's fixture.

---

## Cloud Service Stub Strategy

### Recommended Approach: In-Memory Fakes with Protocol Interfaces

For Phase 1, use **in-memory fake implementations behind Protocol (structural typing) interfaces**. This lets real implementations be dropped in later without changing calling code.

**Why not Firestore emulator in Phase 1:**
- Emulator requires `gcloud` CLI to be installed and running, adding a dependency for every developer
- For Phase 1, the goal is "no real cloud calls, everything runs locally with zero external dependencies"
- Use the emulator in Phase 2 when Incident Memory Agent needs realistic Firestore behavior

**Interface pattern (Protocols + fakes):**
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class FirestoreClientProtocol(Protocol):
    async def collection(self, name: str) -> "CollectionRef": ...
    async def get_document(self, collection: str, doc_id: str) -> dict | None: ...
    async def set_document(self, collection: str, doc_id: str, data: dict) -> None: ...

class FirestoreStub:
    """In-memory Firestore fake. Returns deterministic fixture data."""
    def __init__(self):
        self._data: dict[str, dict[str, dict]] = {}
    
    async def get_document(self, collection: str, doc_id: str) -> dict | None:
        return self._data.get(collection, {}).get(doc_id)
    
    async def set_document(self, collection: str, doc_id: str, data: dict) -> None:
        self._data.setdefault(collection, {})[doc_id] = data

class MonitoringStub:
    """Returns pre-canned metric time series for local dev."""
    def get_metrics(self, deployment_id: str, window_minutes: int = 5) -> dict:
        # Returns fixture data for healthy / degraded / critical states
        return MONITORING_FIXTURES.get(deployment_id, MONITORING_FIXTURES["healthy"])

class CloudDeployStub:
    """Simulates Cloud Deploy rollback operations."""
    async def rollback(self, service: str, target_version: str) -> dict:
        return {"status": "SUCCEEDED", "operation_id": f"op-{service}-rollback"}

class LoggingStub:
    """Returns pre-canned log entries for local dev."""
    def get_logs(self, deployment_id: str, limit: int = 100) -> list[dict]:
        return LOGGING_FIXTURES.get(deployment_id, [])
```

### Fixture Files
Put fixture data in `src/deployguard/stubs/fixtures/`:
- `monitoring_fixtures.py` — healthy, degraded, critical metric snapshots
- `logging_fixtures.py` — normal logs + malicious injection payload (for Phase 6 demo)
- `deploy_fixtures.py` — deployment events, rollback confirmations

---

## Agent Registry Design

### Schema
```python
from pydantic import BaseModel
from typing import Literal

class AgentRegistryEntry(BaseModel):
    agent_id: str            # "deploy-monitor-v1"
    name: str                # "Deploy Monitor Agent"
    version: str             # "1.0.0"
    owner: str               # "Platform Engineering"
    domain: str              # "Monitoring"
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    permissions: list[str]   # ["monitoring.read", "deployment.read"]
    status: Literal["ACTIVE", "INACTIVE", "DEPRECATED"]
    approved_at: str | None = None
    last_active: str | None = None
```

### Storage in Phase 1: In-Memory Dict (seeded from JSON)
```python
# src/deployguard/registry/registry.py
class AgentRegistry:
    def __init__(self):
        self._agents: dict[str, AgentRegistryEntry] = {}
    
    def seed(self, entries: list[AgentRegistryEntry]) -> None: ...
    def get(self, agent_id: str) -> AgentRegistryEntry | None: ...
    def list_all(self) -> list[AgentRegistryEntry]: ...
    def update_last_active(self, agent_id: str) -> None: ...
```

Phase 2+ can swap to Firestore-backed storage without changing the API contract.

### API Endpoints Needed (Phase 1)
- `GET /api/v1/registry/agents` — list all agents
- `GET /api/v1/registry/agents/{agent_id}` — get agent details
- `POST /api/v1/registry/agents` — register a new agent

### Seed Data (5 Agents)
```python
SEED_AGENTS = [
    AgentRegistryEntry(
        agent_id="deploy-monitor-v1", name="Deploy Monitor Agent", version="1.0.0",
        owner="Platform Engineering", domain="Monitoring", risk_level="MEDIUM",
        permissions=["monitoring.read", "deployment.read", "logging.read"], status="ACTIVE"
    ),
    AgentRegistryEntry(
        agent_id="decision-v2", name="Decision Agent", version="2.0.0",
        owner="SRE", domain="Release Safety", risk_level="HIGH",
        permissions=["monitoring.read", "memory.read", "gemini.invoke"], status="ACTIVE"
    ),
    AgentRegistryEntry(
        agent_id="incident-memory-v1", name="Incident Memory Agent", version="1.0.0",
        owner="Platform Engineering", domain="Incident Memory", risk_level="MEDIUM",
        permissions=["firestore.read", "firestore.write"], status="ACTIVE"
    ),
    AgentRegistryEntry(
        agent_id="rollback-v1", name="Rollback Agent", version="1.0.0",
        owner="SRE", domain="Deployment", risk_level="CRITICAL",
        permissions=["deployment.read", "deployment.rollback", "monitoring.read"], status="ACTIVE"
    ),
    AgentRegistryEntry(
        agent_id="postmortem-v1", name="Postmortem Agent", version="1.0.0",
        owner="SRE", domain="Reporting", risk_level="LOW",
        permissions=["firestore.read", "firestore.write"], status="ACTIVE"
    ),
]
```

---

## Dependency List (Final)

### Runtime
```
fastapi>=0.115
uvicorn[standard]>=0.30
pydantic>=2.7
pydantic-settings>=2.3
google-adk>=1.0
opentelemetry-api>=1.25
opentelemetry-sdk>=1.25
```

### Deferred to Phase 2+ (not needed in Phase 1)
```
google-cloud-firestore>=2.16   # Phase 2 (real Firestore / emulator)
google-cloud-monitoring>=2.22  # Phase 2 (real monitoring)
google-cloud-logging>=3.10     # Phase 2 (real logging)
google-cloud-deploy>=1.18      # Phase 4 (real rollback)
```

Include these in `pyproject.toml` from the start but they are only instantiated in real implementations, not stubs.

### Dev
```
ruff>=0.6
mypy>=1.11
pytest>=8.3
pytest-asyncio>=0.24
httpx>=0.27
```

---

## Key Risks / Gotchas

1. **ADK 2.x is rapidly evolving.** Pin `google-adk==1.x.y` (specific patch). The `_run_async_impl` signature is stable in 1.x but ADK 2.0's graph-based model may change the BaseAgent contract.
2. **`uv` vs `pip` on Windows.** `uv` is the recommended package manager but on Windows CI ensure `uv` is in PATH. Fallback is `python -m pip` with a `requirements.txt` pinned lock.
3. **ADK session state is in-memory by default.** For Phase 1 this is fine (stubs only). Phase 2+ needs a persistent session service (Firestore-backed or Vertex AI Agent Engine session store).
4. **`google-adk` imports `google.generativeai` at import time.** Even stubs pull in the Gemini SDK. Set `GOOGLE_API_KEY=stub` in `.env.example` to avoid initialization errors in local dev without credentials.
5. **Protocol classes and mypy.** Use `@runtime_checkable` on Protocols but test stub implementations pass `isinstance()` checks. Mypy strict mode requires complete Protocol method signatures.
6. **FastAPI `lifespan` vs `startup` events.** Use the `lifespan` context manager (not deprecated `@app.on_event`) to seed the agent registry and initialize stubs on startup.

---

## Validation Architecture

### Smoke Test Strategy
```python
# tests/test_smoke.py
def test_health_endpoint():
    from fastapi.testclient import TestClient
    from deployguard.main import create_app
    client = TestClient(create_app())
    response = client.get("/health")
    assert response.status_code == 200

def test_registry_seeded():
    # 5 agents registered on startup
    from deployguard.registry import get_registry
    registry = get_registry()
    assert len(registry.list_all()) == 5

def test_stubs_importable():
    from deployguard.stubs import FirestoreStub, MonitoringStub, CloudDeployStub, LoggingStub
    assert FirestoreStub() is not None

def test_workflow_state_serializable():
    from deployguard.state import DeploymentWorkflowState
    state = DeploymentWorkflowState(
        deployment_id="test-1", service_name="api", version="1.0.0",
        environment="staging", deployed_at=datetime.utcnow()
    )
    assert state.model_dump() is not None
```

### Per-Plan Verification Gates
- **01-01** (scaffold): `uv run uvicorn deployguard.main:app` exits 0; `/health` returns `{"status": "ok"}`
- **01-02** (agent stubs): All 5 agent classes importable; `DeploymentWorkflowState` validates correctly
- **01-03** (registry): `GET /api/v1/registry/agents` returns 5 entries; Rollback Agent shows `risk_level=CRITICAL`
- **01-04** (stubs): `MonitoringStub().get_metrics("healthy")` returns metrics dict; `FirestoreStub` round-trips a document
- **01-05** (harness): `make test` passes; `make dev` starts without errors
