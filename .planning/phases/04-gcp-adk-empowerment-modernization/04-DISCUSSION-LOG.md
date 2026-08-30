# Phase 04: Google Cloud Platform & ADK Fleet Modernization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 04-gcp-adk-empowerment-modernization
**Areas discussed:** Google ADK Fleet & Tool Architecture, Vector Search & RAG Strategy, GCP Live Connectors & Fallback Strategy, Agent Evaluation & Safety Benchmarks

---

## Google ADK Fleet & Tool Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid ADK integration | Keep BaseAgent / workflow engine, define agents and tools with standard Google ADK tool schemas and google-genai function calling, routing execution through Agent Gateway. | |
| Pure Google ADK native agents | Fully refactor BaseAgent into Google GenAI / ADK native agent objects and GenAI tool runner. | ✓ |
| Separate ADK layer | Keep current Python agents untouched and create standalone ADK export definitions in a dedicated module. | |

**User's choice:** Pure Google ADK native agents: Fully refactor BaseAgent into Google GenAI / ADK native agent objects and GenAI tool runner.
**Notes:** Fleet agents will be native ADK agents with Pydantic tool schemas.

| Option | Description | Selected |
|--------|-------------|----------|
| Gateway tool decorator / wrapper | Every ADK tool handler is wrapped by an Agent Gateway decorator that verifies agent identity, checks IAM permissions, and runs Model Armor checks before tool execution. | ✓ |
| Custom ADK Tool interceptor | Implement a custom GenAI / ADK middleware/interceptor hook that inspects all tool calls prior to invocation. | |
| In-tool validation | Implement Gateway validation logic directly inside each tool's implementation function. | |

**User's choice:** Gateway tool decorator / wrapper.
**Notes:** Provides clean separation of security enforcement and tool functionality.

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable gemini-2.5-pro / gemini-2.5-flash | Defaulting to gemini-2.5-flash for speed/cost, gemini-2.5-pro for complex decisioning. | ✓ |
| gemini-1.5-pro / gemini-1.5-flash standard | Standard enterprise endpoints. | |
| Strictly single model | All agents use gemini-2.5-flash exclusively. | |

**User's choice:** gemini-2.5-pro / gemini-2.5-flash with configurable model strings.

| Option | Description | Selected |
|--------|-------------|----------|
| Dual support (Python + agent.yaml) | Code-defined ADK agents in Python alongside declarative YAML agent manifests (`agent.yaml`) for full compatibility with `agents-cli` tooling and local ADK dev. | ✓ |
| Code-only | Pure Python ADK agent definitions without standalone YAML configuration files. | |
| Declarative YAML only | Define agents primarily in YAML files loaded dynamically at runtime. | |

**User's choice:** Dual support (Python + agent.yaml).

---

## Vector Search & RAG Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Firestore Vector Search + text-embedding-004 | Store dense vector embeddings directly on incident documents in Firestore using standard cosine similarity indexing. Local stub uses in-memory numpy/cosine vector search. | ✓ |
| Vertex AI Vector Search Index (Managed Endpoint) | Provision and query a dedicated Vertex AI Vector Search endpoint index. | |
| Vertex AI RAG Engine (Corpus API) | Use Vertex AI managed RAG Corpora with files/chunks. | |

**User's choice:** Firestore Vector Search + text-embedding-004.
**Notes:** Keeps database architecture unified across document metadata and vector search.

| Option | Description | Selected |
|--------|-------------|----------|
| Synchronous on incident ingestion/resolution | Synchronously generate the embedding vector via text-embedding-004 (or mock vector in stub mode) and save it to the document. | ✓ |
| Asynchronous background task | Queue an embedding generation job in the background. | |
| On-demand / lazy generation | Generate embeddings on the fly during search if missing. | |

**User's choice:** Synchronous on incident ingestion/resolution.

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-filtered Vector Search | Apply structured filters (service_name, environment) first via Firestore query predicates, then perform top-k cosine similarity ranking on the candidate subset. | ✓ |
| Post-filtered Vector Search | Retrieve top-k nearest neighbors globally across all incidents, then discard results that do not match filters. | |
| Pure Semantic Search | Rank purely by embedding distance without enforcing strict filters. | |

**User's choice:** Pre-filtered Vector Search.

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable top-k (default k=3) with threshold | Minimum cosine similarity threshold (e.g. 0.70) to prevent injecting irrelevant historical noise. | ✓ |
| Fixed top-k (k=5) | Regardless of similarity score. | |
| Adaptive top-k | Return all incidents above a strict similarity threshold (e.g. >= 0.80) up to max 5. | |

**User's choice:** Configurable top-k (default k=3) with minimum cosine similarity threshold 0.70.

---

## GCP Live Connectors & Fallback Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic fallback with explicit override | Default to DEPLOYGUARD_MOCK_GCP=true locally; if set to false, attempt ADC authentication and seamlessly fall back to stubs with a warning log if credentials/project are missing. | ✓ |
| Strict explicit flag | Rely entirely on DEPLOYGUARD_MOCK_GCP=true/false; fail fast if credentials missing. | |
| Per-service toggles | Allow granular per-service flags. | |

**User's choice:** Automatic fallback with explicit override.

| Option | Description | Selected |
|--------|-------------|----------|
| PromQL / ListTimeSeries query builder | Implement structured GCP metric query adapter translating normalized time-window and metric dimension filters into standard Google Cloud Monitoring `projects.timeSeries.list` filters and PromQL aggregations. | ✓ |
| Raw MQL queries | Monitoring Query Language sent directly to GCP. | |
| OpenTelemetry Google Cloud Exporter only | Ingest metrics purely through OpenTelemetry collector pipelines. | |

**User's choice:** PromQL / Cloud Monitoring ListTimeSeries query builder.

| Option | Description | Selected |
|--------|-------------|----------|
| LQL query with automatic Sanitizer pass | Build standard Logging Query Language filter using `google-cloud-logging` and run fetched entries immediately through `LogSanitizer` before caching. | ✓ |
| Raw log export | Fetch un-sanitized log lines and sanitize only right before passing to LLM. | |
| Cloud Logging Sink to Pub/Sub | Stream logs asynchronously via Pub/Sub subscription. | |

**User's choice:** LQL query with automatic Sanitizer pass.

| Option | Description | Selected |
|--------|-------------|----------|
| Declarative IAM Service Account mapping | Map each DeployGuard agent identity to a dedicated GCP Service Account with least-privilege roles (e.g., `roles/clouddeploy.releaser` for Rollback Agent only). | ✓ |
| Single Shared Service Account | Run entire application under a single GCP service account. | |
| Impersonation tokens | Generate short-lived GCP STS impersonation tokens on demand. | |

**User's choice:** Declarative IAM Service Account mapping.

---

## Agent Evaluation & Safety Benchmarks

| Option | Description | Selected |
|--------|-------------|----------|
| agents-cli eval datasets + pytest integration | Define standard JSONL eval datasets for Decision and Safety scenarios compatible with `agents-cli eval generate` / `grade`, wrapped in a `pytest` test suite for automated CI/CD execution. | ✓ |
| Pure agents-cli eval CLI | Run evaluations exclusively via `agents-cli eval` CLI commands. | |
| Custom Python eval scripts | Implement homegrown evaluation harness in python. | |

**User's choice:** `agents-cli eval` datasets + pytest integration.

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive 4-category benchmark suite | (1) True Positive Rollback, (2) True Negative Rollback, (3) Safety & Prompt Injection resistance, (4) Policy boundary / Unauthorized tool escalation. | ✓ |
| Decision-only scenarios | Focus solely on anomaly severity vs rollback action accuracy. | |
| Security-only scenarios | Focus solely on Model Armor and Agent Gateway denial accuracy. | |

**User's choice:** Comprehensive 4-category benchmark suite.

| Option | Description | Selected |
|--------|-------------|----------|
| Strict multi-metric pass criteria | 100% Safety / Security pass rate (zero unauthorized tool calls, zero prompt injection compromises), and >= 90% Decision Precision/Recall against golden ground truth. | ✓ |
| Lenient criteria | >= 80% overall task completion accuracy. | |
| Exact-match only | Require 100% exact match across all decision fields. | |

**User's choice:** Strict multi-metric pass criteria (100% security, >=90% decision precision/recall).

| Option | Description | Selected |
|--------|-------------|----------|
| Standard ADK layout (evals/) | `evals/` root directory containing `eval_config.yaml`, `datasets/*.jsonl`, and custom evaluators, integrated into `make eval` and CI workflow. | ✓ |
| Under tests directory | `tests/evals/` alongside standard unit tests. | |
| Embedded inside agent package | `src/deployguard/evals/`. | |

**User's choice:** Standard ADK layout (`evals/`).

---

## the agent's Discretion

- Live client retry backoff parameters and timeout limits.
- Local stub embedding math implementation.

## Deferred Ideas

- None — discussion remained strictly within Phase 4 boundaries.
