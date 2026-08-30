# Phase 06: Postmortem Generation & Operator Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 06-postmortem-generation-operator-dashboard
**Areas discussed:** Postmortem Format & LLM Synthesis, Dashboard Stack & Real-Time Telemetry Sync, Operator UI Layout & Navigation, Decision Trace & Fleet Visualization

---

## Postmortem Format & LLM Synthesis

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid Deterministic Assembly + Gemini Narrative | Exact metrics/timeline generated from WorkflowState & DecisionTrace, Gemini synthesizes executive summary, root cause analysis, and preventive recommendations | ✓ |
| Full Gemini LLM Synthesis | Pass entire workflow state and traces to Gemini to generate the complete end-to-end postmortem document | |
| Deterministic Template Only | Zero LLM calls; assemble pure markdown report strictly from WorkflowState, DecisionTrace, and metric snapshots | |

**User's choice:** Hybrid Deterministic Assembly + Gemini Narrative
**Notes:** Exact telemetry data and factual timeline are preserved deterministically without hallucination risk; Gemini provides high-value synthesis for root cause analysis and preventative measures.

| Option | Description | Selected |
|--------|-------------|----------|
| Structured Pydantic Model (`PostmortemReport`) + Markdown export | Stored in Firestore as structured JSON (timeline events, metric deltas, root cause, action items) with on-demand Markdown rendering for export and dashboard viewer | ✓ |
| Dual Markdown & JSON fields in Firestore | Pre-render full Markdown string alongside key metadata fields directly in the Firestore document | |
| Filesystem Markdown + Firestore Reference | Write `.md` file to workspace / artifacts directory and store reference pointer in Firestore | |

**User's choice:** Structured Pydantic Model (`PostmortemReport`) + Markdown export
**Notes:** Provides a typed, queryable representation for APIs and dashboards while supporting clean markdown export.

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful Deterministic Fallback | If Gemini is unavailable, errors, or in mock test mode, auto-generate deterministic narrative sections from anomaly severity, metric deltas, and rollback verdict so postmortem generation never fails | ✓ |
| Mock Narrative Fixtures in Test Mode, Strict Gemini in Cloud Mode | Use mock LLM responses during local testing, but raise explicit errors in live GCP mode if Gemini inference fails | |
| Strict retry with exponential backoff before failing | Retry repeatedly on failure | |

**User's choice:** Graceful Deterministic Fallback
**Notes:** Postmortem generation is safety-critical and must complete reliably even under API outages or offline testing.

| Option | Description | Selected |
|--------|-------------|----------|
| Standard SRE + Agent Audit Sections | Incident Overview, Executive Summary, Anomaly & Metric Delta Table, Decision Trace & Policy Gate Rationale, Rollback & Verification Outcome, Root Cause Analysis, Action Items, and OpenTelemetry Trace Link | ✓ |
| Minimal Incident Summary | Overview, Metric Changes Table, Rollback Action, and Recovery Status only | |
| Comprehensive Multi-page Compliance Report | Full SRE sections plus raw log dumps, complete IAM permission matrix, and full gateway authorization records | |

**User's choice:** Standard SRE + Agent Audit Sections
**Notes:** Standardized comprehensive format matching industry SRE postmortem standards with agent governance audit trails.

---

## Dashboard Stack & Real-Time Telemetry Sync

| Option | Description | Selected |
|--------|-------------|----------|
| React + Vite + TypeScript in `web/` | Modern SPA with Tailwind CSS, Lucide icons, and TanStack Query, built to `web/dist` and mounted by FastAPI in production | ✓ |
| Standalone Next.js App in `frontend/` | Separate Node.js frontend server with API proxy to FastAPI | |
| Embedded Lightweight SPA / Vanilla TS | Single-file bundled asset served directly by FastAPI without a separate node dev server | |

**User's choice:** React + Vite + TypeScript in `web/`
**Notes:** Standard modern DX with fast Vite builds and clean separation of frontend components.

| Option | Description | Selected |
|--------|-------------|----------|
| Server-Sent Events (SSE) for Live Feeds + REST with TanStack Query | FastAPI SSE endpoint (`/api/v1/events/stream`) streams real-time agent events and metric updates, while REST endpoints handle historical queries and registry with auto-refresh | ✓ |
| WebSockets Full Bidirectional Channel | WebSocket endpoint (`/ws/fleet`) for streaming telemetry and sending manual operator triggers from UI | |
| Pure REST Polling with TanStack Query | Short-interval polling (1-2s) on REST endpoints without persistent streaming connections | |

**User's choice:** Server-Sent Events (SSE) for Live Feeds + REST with TanStack Query
**Notes:** SSE is lightweight, unidirectional, firewall-friendly over HTTP, and integrates cleanly with FastAPI and React.

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit TypeScript Interfaces matching Pydantic Models | Clean, zero-build-overhead type contracts in `web/src/types/api.ts` directly matching FastAPI schemas (WorkflowState, DecisionTrace, PostmortemReport, AgentRegistry) | ✓ |
| Automated OpenAPI TypeScript Codegen | Script that fetches `/openapi.json` from FastAPI and generates typed fetch clients | |
| Runtime Zod Schema Validation | Parse all API responses with Zod schemas in frontend hooks before rendering | |

**User's choice:** Explicit TypeScript Interfaces matching Pydantic Models
**Notes:** Direct typed interfaces without external codegen overhead or complex build steps.

| Option | Description | Selected |
|--------|-------------|----------|
| Dual Dev Mode + FastAPI Production Static Mount | `vite.config.ts` proxies `/api` to FastAPI at `localhost:8000` for live HMR dev; FastAPI mounts `web/dist` as static SPA root for single-binary/container production execution | ✓ |
| CORS-enabled Separate Ports | Frontend runs on `:5173`, FastAPI on `:8000` with explicit CORS headers in both dev and prod | |
| Docker Compose Multi-Container | Nginx reverse proxy container routing frontend and backend containers | |

**User's choice:** Dual Dev Mode + FastAPI Production Static Mount
**Notes:** Enables seamless development workflow with HMR and single-command local/container deployment.

---

## Operator UI Layout & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid Mission Control Header + Tabbed Views | Persistent top header (Active deployment status, cluster health, live alert badge) with 4 focused tabs: (1) Live Operations & Telemetry, (2) Incidents & Decision Traces, (3) Postmortem Viewer, (4) Agent Fleet Registry | ✓ |
| Dense Unified Grid (Single Screen Mission Control) | Multi-pane tiled dashboard showing fleet cards, real-time charts, live logs, and active traces all on one responsive grid screen | |
| Sidebar Collapsible Navigation | Left sidebar with route-based views for Overview, Incidents, Traces, Postmortems, and Registry with individual detail sub-pages | |

**User's choice:** Hybrid Mission Control Header + Tabbed Views
**Notes:** Balances high-level situational awareness in the persistent header with deep focus in specialized tabs.

| Option | Description | Selected |
|--------|-------------|----------|
| Modern Dark-Theme SRE Command Center | Deep slate/zinc dark theme, crisp neon status accents (emerald=healthy, rose=anomaly/critical, amber=policy check, cyan=agent thinking), font-mono tags for versions and trace IDs | ✓ |
| Dual Theme (Light & Dark with System Toggle) | Standard clean enterprise SaaS styling with light mode default and dark mode toggle | |
| GCP Console-Inspired Theme | Google Cloud style palette (Google blue, cool grey surfaces, standard Material Design badges) | |

**User's choice:** Modern Dark-Theme SRE Command Center
**Notes:** High contrast, polished dark theme optimized for operations monitoring and visually impressive demos.

| Option | Description | Selected |
|--------|-------------|----------|
| Real-Time Metric Cards + Delta Sparklines (Recharts) | Cards for all 7 metric dimensions displaying current value vs baseline, percentage delta, anomaly badge, and live trend line charts | ✓ |
| Tabular Metric Comparison Table | High-density table listing metrics, baseline value, post-deploy value, delta %, and anomaly status with sorting/filtering | |
| Aggregated Health Gauge Dial with Drill-down Drawer | Single radial health score that expands into detailed metric charts upon click | |

**User's choice:** Real-Time Metric Cards + Delta Sparklines (Recharts)
**Notes:** Clear visual comparison between pre-deployment baselines and post-deployment spikes across all 7 monitored metrics.

| Option | Description | Selected |
|--------|-------------|----------|
| Live Agent Activity Feed with Terminal Toggle | Structured event cards showing agent role badge, action icon, timestamp, thinking summary, and a collapsible 'Raw Stream Log' terminal drawer for inspection | ✓ |
| Pure Streaming Terminal Box | Monospaced streaming terminal window showing stdout/ADK log lines in real time | |
| Chronological Activity Feed Only | Standard audit event list with search and agent filter | |

**User's choice:** Live Agent Activity Feed with Terminal Toggle
**Notes:** Provides human-readable agent reasoning cards with option to view raw SSE streams.

---

## Decision Trace & Fleet Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Visual Stage-by-Stage Governance Pipeline | Interactive multi-step flow (Anomaly Evidence → Historical Context → Gemini Reasoning & Model Armor → Deterministic Policy Checks → Gateway Auth → Action) with pass/fail badges, confidence meter, and expandable rule details | ✓ |
| Collapsible Card / Accordion View | Stacked cards for each phase of the decision with status chips and expandable technical details | |
| Raw JSON / Trace Inspector Tree | Tree viewer with syntax highlighting and high-level summary cards | |

**User's choice:** Visual Stage-by-Stage Governance Pipeline
**Notes:** Clearly demonstrates how DeployGuard enforces safety gates and deterministic policy validation before authorizing actions.

| Option | Description | Selected |
|--------|-------------|----------|
| Fleet Agent Cards + IAM Permission Matrix | Individual status cards for all 5 agents (Deploy Monitor, Decision, Incident Memory, Rollback, Postmortem) with role badge, service account, status indicator, tools list, and full IAM capability matrix table | ✓ |
| Interactive Agent Fleet Topology DAG | Visual node graph showing agent communication paths, gateway boundary, and cloud service stubs/APIs | |
| Dense Registry Table | Searchable, filterable table view of agent registrations and permissions | |

**User's choice:** Fleet Agent Cards + IAM Permission Matrix
**Notes:** Transparently exposes agent identities, IAM boundaries, and tool authorizations.

| Option | Description | Selected |
|--------|-------------|----------|
| Embedded Span Waterfall / Gantt Timeline + Cloud Trace Deep Link | Visual timeline showing root span (`deployguard.deployment`) and child agent execution spans with durations, error flags, and direct GCP Cloud Trace console link | ✓ |
| Span Summary Table | Clean table of span names, start time, latency duration, and status attributes | |
| External Trace Link Only | Display Trace ID badge with copy button and direct deep link to Google Cloud Trace console | |

**User's choice:** Embedded Span Waterfall / Gantt Timeline + Cloud Trace Deep Link
**Notes:** Gives operators instant distributed tracing visibility directly inside the dashboard with Cloud Trace navigation.

| Option | Description | Selected |
|--------|-------------|----------|
| Rich SRE Document Viewer with Markdown/JSON Export | Formatted typography layout with badge headers, timeline timeline-blocks, metric diff tables, root cause highlight box, and one-click 'Download .md' / 'Copy Markdown' buttons | ✓ |
| Dual-Pane Split Viewer | Rendered Markdown document on the left, raw JSON model and metadata properties on the right | |
| Lightweight Markdown Tab with Syntax Highlighting | Clean markdown rendering using standard markdown components | |

**User's choice:** Rich SRE Document Viewer with Markdown/JSON Export
**Notes:** Clean, executive-ready presentation of the generated postmortem with frictionless export capabilities.

---

## the agent's Discretion

- Chart interval styling and animation in Recharts.
- Toast notifications on new SSE alerts.
- Event broadcaster queue implementation in FastAPI.

## Deferred Ideas

None — discussion stayed within phase scope.
