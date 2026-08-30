# Phase 4: Google Cloud Platform & ADK Fleet Modernization - Context

**Gathered:** 2026-08-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 modernizes DeployGuard into an enterprise-grade Google Agent Development Kit (ADK) fleet. It refactors agents to native Google ADK / google-genai architectures, equips Incident Memory with Firestore Vector Search powered by `text-embedding-004`, provides live Google Cloud service connectors for Cloud Monitoring, Cloud Logging, and Cloud Deploy with graceful local stub fallbacks, enforces IAM least-privilege service account bindings, and establishes an automated `agents-cli eval` and pytest benchmarking harness.

</domain>

<decisions>
## Implementation Decisions

### Google ADK Fleet & Tool Architecture
- **D-01:** **Pure Google ADK native agents** — Fully refactor `BaseAgent` and fleet agents into Google GenAI / ADK native agent objects and GenAI tool runner schemas. — **Reversibility:** costly — refactors agent base class and tool registries across all agents.
- **D-02:** **Gateway tool decorator & interceptor** — Wrap every ADK tool handler with an Agent Gateway decorator verifying agent identity against the Agent Registry, enforcing IAM role permissions, and executing Model Armor / `LogSanitizer` checks prior to invocation. — **Reversibility:** reversible — modular decorator pattern.
- **D-03:** **Gemini model family pinning** — Pin `gemini-2.5-pro` for complex reasoning / decision agent and `gemini-2.5-flash` for fast monitoring and filtering, configurable via application settings.
- **D-04:** **Agents-CLI dual compatibility** — Code-defined ADK agents in Python paired with declarative YAML agent manifests (`agent.yaml`) for full compatibility with `agents-cli` lifecycle commands (`agents-cli eval`, `agents-cli playground`).

### Vector Search & RAG Strategy
- **D-05:** **Firestore Vector Search + text-embedding-004** — Store dense vector embeddings directly on incident documents in Firestore using cosine distance indexing; local fallback uses in-memory numpy cosine similarity search. — **Reversibility:** costly — defines incident schema and vector search indexing.
- **D-06:** **Synchronous embedding generation** — Compute incident embedding vectors synchronously during incident ingestion and resolution via `text-embedding-004` (or mock vector generator in stub mode).
- **D-07:** **Pre-filtered hybrid retrieval** — Execute structured metadata filters (`service_name`, `environment`) first via Firestore query predicates, then perform top-k vector cosine similarity ranking on the filtered subset.
- **D-08:** **Retrieval limits and threshold** — Enforce configurable top-k (default k=3) with minimum cosine similarity threshold of 0.70 to avoid injecting irrelevant historical context into Decision Agent.

### GCP Live Connectors & Fallback Strategy
- **D-09:** **Automatic fallback with explicit override** — Default `DEPLOYGUARD_MOCK_GCP=true` locally; if set to `false`, attempt ADC authentication (`google.auth.default()`) and seamlessly fall back to local stubs with a warning log if GCP credentials or project are unavailable.
- **D-10:** **Live Cloud Monitoring ListTimeSeries query builder** — Implement structured GCP metric query adapter translating normalized time-window and metric dimension filters into standard Google Cloud Monitoring `projects.timeSeries.list` filters and PromQL aggregations for all 7 deployment dimensions.
- **D-11:** **Live Cloud Logging LQL connector** — Query Google Cloud Logging via standard Logging Query Language (`resource.type="cloud_run_revision" severity>=WARNING timestamp>="..."`) using `google-cloud-logging` with immediate pass-through to `LogSanitizer` before caching.
- **D-12:** **IAM Service Account least-privilege mapping** — Map each agent identity (e.g., `rollback-agent`) to a dedicated GCP Service Account (`deployguard-rollback@<project>.iam.gserviceaccount.com`) with least-privilege roles (`roles/clouddeploy.releaser` for Rollback Agent only).

### Agent Evaluation & Safety Benchmarks
- **D-13:** **agents-cli eval datasets + pytest runner** — Define standard JSONL eval datasets for Decision and Safety scenarios compatible with `agents-cli eval generate` / `grade`, wrapped in a `pytest` test suite for automated CI execution.
- **D-14:** **Golden benchmark scenario suite** — 4 core benchmark categories: (1) True Positive Rollback (multi-metric anomaly), (2) True Negative Rollback (transient spike / healthy), (3) Safety & Prompt Injection resistance, (4) Policy boundary / Unauthorized tool escalation.
- **D-15:** **Strict evaluation pass criteria** — 100% Safety / Security pass rate (zero unauthorized tool calls, zero prompt injection compromises), and >= 90% Decision Precision/Recall against golden ground truth.
- **D-16:** **Evaluation directory structure** — Standard ADK layout: `evals/` root directory containing `eval_config.yaml`, `datasets/*.jsonl`, and custom evaluators, integrated into `make eval` and CI workflow.

### the agent's Discretion
- Internal query caching and retry backoff parameters for live GCP client calls.
- Concrete mock embedding vector math representation in local stub mode.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase Architecture & Interfaces
- `src/deployguard/agents/base.py` — Base agent lifecycle and run interface
- `src/deployguard/security/gateway.py` — Agent Gateway identity and permission verification
- `src/deployguard/security/sanitizer.py` — LogSanitizer and Model Armor protection rules
- `src/deployguard/cloud/interfaces.py` — Protocols for MetricsSource, DocumentStore, and Cloud Deploy
- `src/deployguard/cloud/stubs.py` — Mock cloud stubs and local fixtures
- `src/deployguard/cloud/metrics.py` — 7 metric dimensions definitions and anomaly thresholds
- `src/deployguard/registry/models.py` — Agent identity and permission models

### Phase Roadmap & Requirements
- `.planning/ROADMAP.md` §Phase 4 — Scope, requirements (FLEET-01, FLEET-02, MEM-01, MEM-02, SEC-02, GOV-01), and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgentGateway`: Central authorization gateway to be wired into ADK tool decorators.
- `LogSanitizer`: Regex and heuristic prompt injection detector ready for live Cloud Logging ingestion and tool input filters.
- `MockFirestore` / `MockMonitoring` / `MockCloudDeploy`: Complete test fixture scaffolding to serve as local fallback when `DEPLOYGUARD_MOCK_GCP=true`.
- `MetricBaseline` & delta engine in `metrics.py`: Ready to consume live time-series data from Cloud Monitoring API.

### Established Patterns
- Pydantic models for all state objects (`DeploymentWorkflowState`, `AnomalySignal`, `DecisionTrace`).
- Deterministic policy engine in `DecisionAgent` taking precedence over LLM advisory output.
- Clean protocol interfaces (`MetricsSource`, `DocumentStore`) decoupling agent business logic from concrete GCP libraries.

### Integration Points
- `src/deployguard/agents/`: Modernize agent classes to Google ADK native agent objects.
- `src/deployguard/cloud/`: Add live GCP client connectors (`monitoring_client.py`, `logging_client.py`, `deploy_client.py`, `firestore_client.py`) with automatic stub fallback.
- `evals/`: Create evaluation dataset JSONL files and `eval_config.yaml` for `agents-cli eval`.

</code_context>

<specifics>
## Specific Ideas

- Dual compatibility: Agents runnable via standard python application entrypoint as well as inspected via `agents-cli playground` and evaluated with `agents-cli eval`.
- Strict zero-tolerance security gate: 100% pass rate required for all security / unauthorized access benchmark cases in CI.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 4 scope.

</deferred>

---

*Phase: 04-gcp-adk-empowerment-modernization*
*Context gathered: 2026-08-30*
