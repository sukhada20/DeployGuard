# Phase 06: Postmortem Generation & Operator Dashboard - Context

**Gathered:** 2026-08-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers the Postmortem Agent and the Operator Dashboard frontend/backend system:
1. **Postmortem Agent**: Synthesizes structured SRE postmortem reports (`PostmortemReport`) combining deterministic workflow state/metric data with Gemini-powered root cause and recommendation narratives, persisting them to Firestore with on-demand Markdown export.
2. **Dashboard Backend API**: FastAPI REST endpoints for fleet status, deployment health, decision traces, agent registry, postmortem retrieval, and an SSE endpoint (`/api/v1/events/stream`) for streaming live agent activity and metric updates.
3. **Operator Dashboard Frontend**: Next.js + TypeScript + Tailwind CSS + shadcn/ui in `web/` with extra component registries (Magic UI / Aceternity style effects) and GSAP / Anime.js animation choreographies styled with Tailwind CSS, featuring a dark-mode SRE command center theme with 4 main views:
   - **Live Operations & Telemetry**: Metric cards with 7-dimension baseline delta sparklines (Recharts) and live agent event stream.
   - **Incidents & Decision Traces**: Interactive visual multi-step governance pipeline (Evidence → Context → Gemini/Model Armor → Policy Gate → Auth → Action) and embedded OpenTelemetry span waterfall.
   - **Postmortem Viewer**: Formatted SRE incident document renderer with timeline blocks, root cause highlight, and one-click Markdown/JSON export.
   - **Agent Fleet Registry**: Status cards for all 5 agents with IAM service account identities, health indicators, and capability permission matrix.
4. **Dev & Production Serving**: Vite dev server with proxy to FastAPI (`localhost:8000`) for development; FastAPI static mount of `web/dist` for single-service production serving.
</domain>

<decisions>
## Implementation Decisions

### 1. Postmortem Format & LLM Synthesis
- **D-01:** **Hybrid Deterministic Assembly + Gemini Narrative** — Exact metrics, timeline events, and execution facts are extracted directly from `DeploymentWorkflowState`, `DecisionTrace`, and recovery verdicts. Gemini 2.5 Flash is invoked to synthesize the executive summary, 5-whys root cause analysis, and preventative action items. — **Reversibility:** reversible — prompt and assembly templates are isolated in `PostmortemAgent`.
- **D-02:** **Structured Pydantic Model (`PostmortemReport`) with Markdown Exporter** — Stored in Firestore as structured JSON documents (timeline events, metric deltas, root cause analysis, action items, metadata) with helper methods (`.to_markdown()`, `.to_json()`) for on-demand export and dashboard consumption. — **Reversibility:** costly — defines postmortem schema across backend and frontend.
- **D-03:** **Graceful Deterministic Fallback on LLM Error / Mock Mode** — If Gemini is unreachable, encounters rate limits/errors, or if `DEPLOYGUARD_MOCK_GCP=true` is set, `PostmortemAgent` generates deterministic fallback narrative sections from anomaly severity, metric deltas, and recovery verdict without failing the postmortem run. — **Reversibility:** reversible — fallback logic is contained in the agent executor.
- **D-04:** **Standard SRE + Agent Audit Sections** — Standardized report sections include: Incident Overview (Service, Severity, Versions, Duration), Executive Summary, Triggering Anomaly & Metric Delta Table, Decision Trace & Policy Gate Rationale, Rollback Execution & Recovery Verification Verdict, Root Cause Analysis, Preventative Action Items, and OpenTelemetry Trace Link. — **Reversibility:** reversible — schema structure can be extended.

### 2. Dashboard Stack & Real-Time Telemetry Sync
- **D-05:** **Next.js + shadcn/ui + Component Registries in `web/`** — Modern App Router frontend with TypeScript, Tailwind CSS, shadcn/ui primitives, and extended component registries (Magic UI / Aceternity animated effects) for high-polish SRE command center aesthetics. — **Reversibility:** costly — standardizes the frontend architecture and build pipeline.
- **D-06:** **Server-Sent Events (SSE) for Live Feeds + REST with TanStack Query** — FastAPI endpoint `/api/v1/events/stream` broadcasts real-time agent lifecycle events, metric ticks, and anomaly alerts over SSE; REST endpoints handle historical state queries, registry data, and postmortems with TanStack Query caching and auto-invalidation. — **Reversibility:** costly — establishes API streaming protocol and frontend event listeners.
- **D-07:** **Explicit TypeScript Interfaces matching Pydantic Models** — Typed data contracts in `web/src/types/api.ts` directly mirror backend Pydantic models (`WorkflowState`, `DecisionTrace`, `PostmortemReport`, `AgentRegistryModel`) ensuring zero-overhead type safety. — **Reversibility:** reversible — TypeScript type declarations are easily updated.
- **D-08:** **Dual Dev Mode + FastAPI Static Mount** — `vite.config.ts` proxies `/api` requests to FastAPI on `localhost:8000` during development with Hot Module Replacement (HMR); FastAPI mounts `web/dist` on `/` when built for unified single-service deployment. — **Reversibility:** reversible — build and mount configurations are centralized.

### 3. Operator UI Layout & Navigation
- **D-09:** **Hybrid Mission Control Header + 4 Tabbed Views** — Persistent top navigation bar displays active deployment status, cluster health indicator, and live incident alert badge, with 4 primary navigation tabs: (1) Live Operations & Telemetry, (2) Incidents & Decision Traces, (3) Postmortem Viewer, (4) Agent Fleet Registry. — **Reversibility:** reversible — component layout and tab routing are modular.
- **D-10:** **Modern Dark-Theme SRE Command Center** — High-contrast dark palette (slate/zinc background) with distinct status accent colors (emerald for healthy/recovered, rose for critical anomaly/failure, amber for policy gates, cyan for agent activity) and monospaced font tags for trace IDs, versions, and commit hashes. — **Reversibility:** reversible — Tailwind design tokens and utility classes.
- **D-11:** **Real-Time Metric Cards + Sparklines & Kinetic Animations (GSAP + Anime.js + Recharts)** — Interactive metric cards with 7-dimension baseline deltas, animated chart reveals, GSAP timeline choreographies for governance pipeline transitions, and Anime.js reactive pulse effects on agent activities. — Grid of cards for all 7 telemetry dimensions (Error Rate, Latency p95, CPU, Memory, Crash Count, Restarts, Request Rate) showing current value vs baseline, percentage delta, anomaly badge, and live trend line charts. — **Reversibility:** reversible — Recharts components are isolated in telemetry widgets.
- **D-12:** **Live Agent Activity Feed with Terminal Toggle** — Real-time event cards displaying agent role badges, action icons, timestamps, and LLM thinking snippets, with a collapsible drawer for inspecting raw SSE JSON streams / log output. — **Reversibility:** reversible — feed UI is an independent component.

### 4. Decision Trace & Fleet Visualization
- **D-13:** **Visual Stage-by-Stage Governance Pipeline** — Interactive multi-step horizontal flow visualizing each governance checkpoint (Anomaly Evidence → Historical Incident Context → Gemini Reasoning & Model Armor Check → Deterministic Policy Checks → Gateway Authorization → Rollback Action) with pass/fail badges, confidence meter, and expandable rule details. — **Reversibility:** reversible — component rendering logic is modular.
- **D-14:** **Agent Fleet Cards + IAM Capability Matrix** — Overview cards for all 5 agents (Deploy Monitor, Decision, Incident Memory, Rollback, Postmortem) showing service account identity, status, assigned tools, and an expandable IAM permission matrix table. — **Reversibility:** reversible — registry view renders from API registry endpoint.
- **D-15:** **Embedded Span Waterfall / Gantt Timeline + Cloud Trace Link** — Visual Gantt-style timeline rendering the root span (`deployguard.deployment`) and child execution spans (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`, `postmortem.generate`) with execution latencies and deep links to Google Cloud Trace console. — **Reversibility:** reversible — timeline component parses OpenTelemetry span data.
- **D-16:** **Rich SRE Document Viewer with Markdown/JSON Export** — Typography-styled postmortem view with structured timeline cards, metric diff tables, root cause highlight callout, and one-click buttons to copy Markdown or download `.md` / `.json` files. — **Reversibility:** reversible — document renderer is modular.

### the agent's Discretion
- Specific chart styling and interval animation timings in Recharts.
- Toast notifications on new SSE anomaly alerts.
- FastAPI event broadcaster internal queue implementation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- `.planning/PROJECT.md` — Core value, active requirements, and key decisions
- `.planning/REQUIREMENTS.md` — Project requirement definitions (POST-01, POST-02)
- `.planning/ROADMAP.md` §Phase 6 — Phase 6 goal, success criteria, and plans (06-01 through 06-04)

### Prior Phase Contexts & Existing Implementation
- `.planning/phases/03-decisioning-engine-governance/03-CONTEXT.md` — Decision trace structure, Gemini prompts, Model Armor
- `.planning/phases/04-gcp-adk-empowerment-modernization/04-CONTEXT.md` — ADK agent architecture and live GCP clients
- `.planning/phases/05-rollback-execution-recovery-verification/05-CONTEXT.md` — Recovery verification loop, OpenTelemetry root/child span hierarchy
- `src/deployguard/agents/postmortem.py` — Postmortem Agent class to be implemented
- `src/deployguard/agents/base.py` — BaseDeployGuardAgent ADK patterns and async generators
- `src/deployguard/state/workflow.py` — DeploymentWorkflowState, AnomalySignal, DecisionTrace
- `src/deployguard/registry/store.py` & `src/deployguard/registry/seed.py` — Agent Registry store and seed data
- `src/deployguard/telemetry/tracer.py` — OpenTelemetry tracer setup and span utilities
- `src/deployguard/main.py` & `src/deployguard/api/` — FastAPI application factory and API routing
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DeploymentWorkflowState` in `src/deployguard/state/workflow.py`: Contains full timeline, anomaly signal, decision trace, rollback details, and recovery verdict needed by `PostmortemAgent`.
- `GeminiClient` in `src/deployguard/ai/gemini_client.py`: Provides wrapped LLM invocation with Model Armor sanitization for generating postmortem narratives.
- `InMemoryRegistryStore` in `src/deployguard/registry/store.py`: Serves agent fleet metadata and permission matrix for the dashboard.
- `get_tracer` in `src/deployguard/telemetry/tracer.py`: Exposes trace IDs and OpenTelemetry span context for correlation in postmortems and UI.

### Established Patterns
- Pydantic models for structured state and API serialization (`src/deployguard/state/workflow.py`, `src/deployguard/registry/models.py`).
- ADK `BaseDeployGuardAgent` async event yielding (`Event(author=..., content=...)`).
- FastAPI routers grouped under `src/deployguard/api/`.

### Integration Points
- `src/deployguard/agents/postmortem.py`: Implementing full `PostmortemAgent._execute` logic with hybrid assembly and Gemini synthesis.
- `src/deployguard/api/`: Adding new routers for `/api/v1/dashboard`, `/api/v1/traces`, `/api/v1/postmortems`, and `/api/v1/events/stream`.
- `src/deployguard/main.py`: Registering new routers, configuring SSE lifecycle broadcaster, and mounting static `web/dist` SPA directory.
- `web/`: New Vite + React + TypeScript project with dashboard components.
</code_context>

<specifics>
## Specific Ideas
- High visual polish: Dark theme with glowing neon accents, clean monospaced font chips for hashes/traces, and fluid sparklines.
- Interactive trace inspector: Visualizing the full governance pipeline step-by-step makes the autonomous safety guarantees immediately clear and compelling for operators and demo audiences.
- One-click postmortem export: Allows downloading standard Markdown reports directly from the UI.
</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.
</deferred>

---

*Phase: 06-postmortem-generation-operator-dashboard*
*Context gathered: 2026-08-30*
