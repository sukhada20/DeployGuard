# Phase 06: Postmortem Generation & Operator Dashboard - Research

**Date:** 2026-08-30
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** **Hybrid Deterministic Assembly + Gemini Narrative** — Exact metrics, timeline events, and execution facts are extracted directly from `DeploymentWorkflowState`, `DecisionTrace`, and recovery verdicts. Gemini 2.5 Flash is invoked to synthesize the executive summary, 5-whys root cause analysis, and preventative action items.
- **D-02:** **Structured Pydantic Model (`PostmortemReport`) with Markdown Exporter** — Stored in Firestore as structured JSON documents (timeline events, metric deltas, root cause analysis, action items, metadata) with helper methods (`.to_markdown()`, `.to_json()`) for on-demand export and dashboard consumption.
- **D-03:** **Graceful Deterministic Fallback on LLM Error / Mock Mode** — If Gemini is unreachable, encounters rate limits/errors, or if `DEPLOYGUARD_MOCK_GCP=true` is set, `PostmortemAgent` generates deterministic fallback narrative sections from anomaly severity, metric deltas, and recovery verdict without failing the postmortem run.
- **D-04:** **Standard SRE + Agent Audit Sections** — Standardized report sections include: Incident Overview (Service, Severity, Versions, Duration), Executive Summary, Triggering Anomaly & Metric Delta Table, Decision Trace & Policy Gate Rationale, Rollback Execution & Recovery Verification Verdict, Root Cause Analysis, Preventative Action Items, and OpenTelemetry Trace Link.
- **D-05:** **Next.js + shadcn/ui + Component Registries in `web/`** — Modern App Router frontend with TypeScript, Tailwind CSS, shadcn/ui primitives (Radix UI), and extended component registries (Magic UI / Aceternity animated effects) for high-polish SRE command center aesthetics.
- **D-06:** **Server-Sent Events (SSE) for Live Feeds + REST with TanStack Query** — FastAPI endpoint `/api/v1/events/stream` broadcasts real-time agent lifecycle events, metric ticks, and anomaly alerts over SSE; REST endpoints handle historical state queries, registry data, and postmortems with TanStack Query caching and auto-invalidation.
- **D-07:** **Explicit TypeScript Interfaces matching Pydantic Models** — Typed data contracts in `web/src/types/api.ts` directly mirror backend Pydantic models (`WorkflowState`, `DecisionTrace`, `PostmortemReport`, `AgentRegistryModel`) ensuring zero-overhead type safety.
- **D-08:** **Dual Dev Mode + FastAPI Static Mount** — Next.js dev server proxies `/api` requests to FastAPI on `localhost:8000` during development with Hot Module Replacement (HMR); FastAPI mounts `web/out` (or static build) on `/` for unified single-service deployment.
- **D-09:** **Hybrid Mission Control Header + 4 Tabbed Views** — Persistent top navigation bar displays active deployment status, cluster health indicator, and live incident alert badge, with 4 primary navigation tabs: (1) Live Operations & Telemetry, (2) Incidents & Decision Traces, (3) Postmortem Viewer, (4) Agent Fleet Registry.
- **D-10:** **Modern Dark-Theme SRE Command Center** — High-contrast dark palette (slate/zinc background) with distinct status accent colors (emerald for healthy/recovered, rose for critical anomaly/failure, amber for policy gates, cyan for agent activity) and monospaced font tags for trace IDs, versions, and commit hashes.
- **D-11:** **Real-Time Metric Cards + Sparklines & Kinetic Animations (GSAP + Anime.js + Recharts)** — Interactive metric cards with 7-dimension baseline deltas, animated chart reveals, GSAP timeline choreographies for governance pipeline transitions, and Anime.js reactive pulse effects on agent activities.
- **D-12:** **Live Agent Activity Feed with Terminal Toggle** — Real-time event cards displaying agent role badges, action icons, timestamps, and LLM thinking snippets, with a collapsible drawer for inspecting raw SSE JSON streams / log output.
- **D-13:** **Visual Stage-by-Stage Governance Pipeline** — Interactive multi-step horizontal flow visualizing each governance checkpoint (Anomaly Evidence → Historical Incident Context → Gemini Reasoning & Model Armor Check → Deterministic Policy Checks → Gateway Authorization → Rollback Action) with pass/fail badges, confidence meter, and expandable rule details.
- **D-14:** **Agent Fleet Cards + IAM Capability Matrix** — Overview cards for all 5 agents (Deploy Monitor, Decision, Incident Memory, Rollback, Postmortem) showing service account identity, status, assigned tools, and an expandable IAM permission matrix table.
- **D-15:** **Embedded Span Waterfall / Gantt Timeline + Cloud Trace Link** — Visual Gantt-style timeline rendering the root span (`deployguard.deployment`) and child execution spans (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`, `postmortem.generate`) with execution latencies and deep links to Google Cloud Trace console.
- **D-16:** **Rich SRE Document Viewer with Markdown/JSON Export** — Typography-styled postmortem view with structured timeline cards, metric diff tables, root cause highlight callout, and one-click buttons to copy Markdown or download `.md` / `.json` files.

### Agent's Discretion
- Specific chart styling and interval animation timings in Recharts.
- Toast notifications on new SSE anomaly alerts.
- Event broadcaster queue implementation in FastAPI (`asyncio.Queue` based broadcaster).
- GSAP timeline durations and ease curves (`power2.out`, `expo.out`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POST-01 | Postmortem Agent generates an auditable postmortem document after each recovery or failed rollback attempt, capturing timeline, evidence, decisions, actions, and outcomes. | Hybrid deterministic assembly + Gemini 2.5 Flash synthesis engine in `src/deployguard/agents/postmortem.py`, `PostmortemReport` pydantic model with `.to_markdown()`, Firestore storage, and deterministic fallback. |
| POST-02 | Operator dashboard provides fleet overview, deployment health status, agent activity log, decision traces, and agent registry view. | Next.js + Tailwind + shadcn/ui dashboard in `web/`, FastAPI REST/SSE backend APIs (`/api/v1/dashboard/*`, `/api/v1/events/stream`), GSAP & Anime.js animations, Recharts sparklines, and visual governance pipeline. |
</phase_requirements>

---

## 1. Architecture & Technical Breakdown

### 1.1 Postmortem Agent & Report Model (POST-01)
- **Component:** `PostmortemAgent` (`src/deployguard/agents/postmortem.py`) & `PostmortemReport` (`src/deployguard/state/workflow.py` / `src/deployguard/agents/models.py`).
- **Data Model:**
  ```python
  class PostmortemReport(BaseModel):
      report_id: str
      deployment_id: str
      service_name: str
      created_at: datetime
      target_version: str
      stable_version: str
      incident_duration_seconds: float
      severity: str
      outcome: str  # recovered, failed_rollback, policy_blocked
      executive_summary: str
      root_cause_analysis: str  # 5 Whys analysis
      timeline_events: list[dict[str, Any]]
      metric_deltas: dict[str, dict[str, Any]]
      decision_summary: dict[str, Any]
      rollback_summary: dict[str, Any]
      preventative_actions: list[str]
      trace_id: str | None = None

      def to_markdown(self) -> str: ...
      def to_dict(self) -> dict[str, Any]: ...
  ```
- **Synthesis Workflow:**
  1. Extract factual timeline and metric deltas from `DeploymentWorkflowState`.
  2. If live Gemini mode (`DEPLOYGUARD_MOCK_GCP=false` and API key present):
     - Format sanitized incident summary prompt with metric baselines vs post-deploy spikes, decision reasoning, and rollback recovery verdict.
     - Call `GeminiClient.generate_text()` or `generate_structured()` with Model Armor wrapping to synthesize `executive_summary`, `root_cause_analysis`, and `preventative_actions`.
  3. If mock mode or LLM failure:
     - Generate deterministic narrative using templated rules (e.g. "Deployment {version} triggered {severity} anomaly on {metrics} with {delta}% degradation. Governed decision engine executed rollback to {stable_version} leading to recovery verification verdict {verdict}.").
  4. Write `PostmortemReport` to Firestore collection `postmortems` and attach to `state.postmortem_report`.
  5. Yield ADK `Event` containing report ID and markdown snippet.

### 1.2 Dashboard Backend API & SSE Event Broadcaster (POST-02)
- **FastAPI Endpoints:**
  - `GET /api/v1/dashboard/overview`: Returns current deployment state, cluster health, agent count, active incident counts.
  - `GET /api/v1/dashboard/metrics`: Returns 7-dimension telemetry metrics and baseline deltas for active/latest deployment.
  - `GET /api/v1/traces`: Returns paginated list of `DecisionTrace` items with filters for service, outcome, date.
  - `GET /api/v1/traces/{trace_id}`: Returns complete structured decision trace including policy breakdown and OpenTelemetry span hierarchy.
  - `GET /api/v1/postmortems`: Returns list of postmortems.
  - `GET /api/v1/postmortems/{report_id}`: Returns `PostmortemReport` JSON and Markdown.
  - `GET /api/v1/registry/agents`: Returns seeded/live agent registry models and IAM permissions.
  - `GET /api/v1/events/stream`: Server-Sent Events (SSE) streaming live agent lifecycle events, metric ticks, and pipeline status updates.
- **Event Broadcaster Architecture:**
  - An in-memory `AsyncBroadcaster` using `asyncio.Queue` instances for connected SSE clients.
  - Agents and workflow lifecycle hooks publish events via `broadcaster.publish(event_type, payload)`:
    - `agent_event`: Agent thinking, tool call, event yield.
    - `metric_tick`: Telemetry update.
    - `anomaly_alert`: Anomaly detected.
    - `decision_event`: Policy evaluation, decision trace created.
    - `rollback_event`: Rollout initiated, verified.
    - `postmortem_ready`: Postmortem document generated.

### 1.3 Operator Dashboard Frontend (POST-02)
- **Framework & Tooling:**
  - Next.js 14/15 (App Router) in `web/` with TypeScript and Tailwind CSS.
  - UI Component Library: `shadcn/ui` (Radix UI primitives: Tabs, Card, Badge, Button, ScrollArea, Tooltip, Dialog, Accordion).
  - Extended Registries / Custom Visuals:
    - `AnimatedBeam`: Renders SVG animated bezier connections between agents, Agent Gateway, and Cloud Deploy.
    - `BorderBeam` / `GlowCard`: Animated glowing borders for critical anomalies and active agent thinking states.
    - `ShimmerBadge`: Animated status indicators for real-time states (`ANOMALY DETECTED`, `ROLLBACK IN PROGRESS`, `RECOVERED`).
  - Motion & Kinetic Libraries:
    - **GSAP (`@gsap/react`, `gsap`)**: Handles choreographed multi-step stage reveals in the Decision Trace governance stepper, span waterfall cascading entrances, and SVG path drawing for trace diagrams.
    - **Anime.js**: Micro-interactions, number counters for metric deltas (+145.2% counting animation), and pulsing alert rings.
  - Charting: **Recharts** (`AreaChart`, `LineChart`, `ResponsiveContainer`) for rendering 7-metric baseline comparisons and delta sparklines.
  - Data Sync: **TanStack React Query** for fetching REST endpoints with auto-refetch, combined with a custom `useEventStream` hook that listens to the FastAPI `/api/v1/events/stream` SSE endpoint to update local state in real time.

---

## 2. UI View Hierarchy & Interaction Design

### 2.1 Mission Control Header
- Global banner displaying:
  - System status: `PROTECTED` (Green glowing dot) / `INCIDENT ACTIVE` (Rose pulse ring).
  - Active Service & Version: `order-service` | `v2.4.0` -> `v2.3.9` (stable).
  - Live SSE connection status badge.
  - Quick statistics: Active Agents (5/5), Monitored Metrics (7/7), Recovery SLA (< 45s).

### 2.2 Tab 1: Live Operations & Telemetry
- **Top Row (Metric Cards with Sparklines):** 7 cards for Error Rate, Latency p95, CPU Utilization, Memory, Crash Count, Restart Count, Request Rate. Each shows current value, baseline, percentage delta, anomaly badge, and live Recharts sparkline with Anime.js numerical counter.
- **Bottom Row (Split Pane):**
  - **Left (Deployment Lifecycle Stepper):** Current pipeline stage (Deploy → Monitor → Decide → Rollback → Verify → Postmortem) with GSAP glowing step indicator.
  - **Right (Live Agent Activity Feed):** Streaming cards for each agent execution with avatar, role badge, timestamp, thinking summary, and expandable raw log drawer.

### 2.3 Tab 2: Incidents & Decision Traces
- **Decision Trace Governance Stepper (GSAP Choreographed):**
  - Step 1: Anomaly Evidence (Metrics exceeding threshold).
  - Step 2: Historical Memory (Vertex AI RAG / Vector search matches).
  - Step 3: Gemini Reasoning & Model Armor Sanitization.
  - Step 4: Deterministic Policy Gate (5 rules evaluated with pass/fail chips).
  - Step 5: Agent Gateway Authorization (IAM identity & permission verification).
  - Step 6: Rollback Execution Plan.
- **OpenTelemetry Distributed Trace Waterfall:**
  - Gantt span visualizer showing root span `deployguard.deployment` and nested spans (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`, `postmortem.generate`) with execution latencies and deep link to GCP Cloud Trace.

### 2.4 Tab 3: Postmortem Reports Viewer
- SRE Incident Report layout:
  - Header: Incident title, service, timestamps, total recovery duration, severity.
  - Executive Summary callout box.
  - 5 Whys Root Cause Analysis.
  - Metric Delta Snapshot table.
  - Governance & Rollback Action Summary.
  - Preventative Action Checklist.
  - Action Bar: "Download .md", "Copy Markdown", "Download JSON", "View Cloud Trace".

### 2.5 Tab 4: Agent Fleet Registry
- Grid of 5 Agent Cards:
  - Deploy Monitor Agent (`deploy-monitor-sa@gcp`)
  - Decision Agent (`decision-agent-sa@gcp`)
  - Incident Memory Agent (`incident-memory-sa@gcp`)
  - Rollback Agent (`rollback-agent-sa@gcp`)
  - Postmortem Agent (`postmortem-agent-sa@gcp`)
- Each card shows assigned ADK tools, security risk level (`LOW`, `MEDIUM`, `CRITICAL`), health status, and an interactive IAM Capability Matrix.

---

## 3. Dependencies & Don't-Hand-Roll Analysis

| Capability | Library / Module | Purpose | Status |
|------------|------------------|---------|--------|
| Next.js App Router | `next>=14.2.0`, `react>=18.3.0`, `react-dom>=18.3.0` | Frontend core architecture in `web/` | To install in `web/` |
| UI Primitives | `@radix-ui/react-*`, `shadcn/ui` components | Accessible dark-mode primitives (Tabs, Card, Dialog, Badge, Tooltip) | To configure in `web/` |
| Tailwind CSS | `tailwindcss>=3.4.0`, `postcss`, `autoprefixer`, `tailwind-merge`, `clsx` | Utility styling and dark theme tokens | To configure in `web/` |
| GSAP Animations | `gsap>=3.12.0`, `@gsap/react>=2.1.0` | Choreographed timeline transitions, governance stepper reveals | To install in `web/` |
| Anime.js | `animejs>=3.2.2` | Stat number counters, pulse rings, ripple animations | To install in `web/` |
| Recharts | `recharts>=2.12.0` | 7-dimension telemetry area charts and sparklines | To install in `web/` |
| Icons | `lucide-react>=0.370.0` | SRE and DevOps icon set | To install in `web/` |
| Data Fetching & Sync | `@tanstack/react-query>=5.0.0` | API query caching and synchronization | To install in `web/` |
| SSE Streaming | `sse-starlette>=2.0.0` / FastAPI native SSE | Server-Sent Events broadcasting from FastAPI | Backend Python |

---

## 4. Validation Architecture

### 4.1 Automated Backend Tests (Pytest)
- `tests/test_postmortem_agent.py`:
  - Verify hybrid postmortem generation with deterministic metrics and state extraction.
  - Verify fallback behavior when LLM is unavailable / mock mode.
  - Verify `PostmortemReport.to_markdown()` format matches SRE standard.
  - Verify Firestore storage of postmortem records.
- `tests/test_dashboard_api.py`:
  - Test `/api/v1/dashboard/overview`, `/api/v1/dashboard/metrics`.
  - Test `/api/v1/traces`, `/api/v1/traces/{trace_id}`.
  - Test `/api/v1/postmortems`, `/api/v1/postmortems/{id}`.
  - Test `/api/v1/events/stream` SSE connection and event broadcast.

### 4.2 Frontend Build & Lint Verification
- `npm --prefix web run build`: Verify Next.js TypeScript compilation and Tailwind static export / build without type or bundle errors.
- `npm --prefix web run lint`: ESLint verification for React best practices.

### 4.3 Browser UI Smoke Test (Obscura CLI)
- Start FastAPI backend and Next.js dev/static server.
- Run `obscura` or browser verification to ensure:
  - Dashboard loads cleanly on `/` without console errors.
  - All 4 tabs navigate smoothly.
  - Sparklines render with data.
  - Decision Trace viewer displays the governance steps.
  - Postmortem viewer renders markdown document and copy/download buttons work.
