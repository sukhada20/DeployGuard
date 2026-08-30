# Roadmap: DeployGuard

## Overview

DeployGuard is built in six focused phases: first establishing the project skeleton and simulation interfaces, then layering in anomaly detection and incident memory, then adding the governed decisioning engine with security controls, then implementing rollback execution and verification, then building the operator dashboard and postmortem generation, and finally wiring together a convincing end-to-end demo flow. Each phase delivers a usable vertical slice; later phases depend on the contracts established in earlier ones.

## Phases

- [x] **Phase 1: Project Foundation & Simulation Layer** — Python FastAPI skeleton, agent base classes, Agent Registry, Cloud Deploy/Monitoring/Logging stub interfaces, local dev harness (completed 2026-08-29)
- [x] **Phase 2: Anomaly Detection & Incident Memory** — Deploy Monitor Agent, baseline comparison, Firestore incident storage, log sanitization (completed 2026-08-29)
- [x] **Phase 3: Decisioning Engine & Governance** — Decision Agent, Gemini LLM integration, Agent Gateway, IAM identities, Model Armor, policy evaluation (completed 2026-08-29)
- [ ] **Phase 4: Google Cloud Platform & ADK Fleet Modernization** — Google Agents CLI / ADK integration, Vertex AI RAG / Vector Search incident memory, Cloud Monitoring/Logging telemetry connectors, GCP IAM/Workload Identity boundaries
- [ ] **Phase 5: Rollback Execution & Recovery Verification** — Rollback Agent, Cloud Deploy integration, post-rollback metric verification, decision trace output, OpenTelemetry
- [ ] **Phase 6: Postmortem Generation & Operator Dashboard** — Postmortem Agent, React/TypeScript dashboard, fleet overview, agent activity log, decision trace viewer
- [ ] **Phase 7: End-to-End Demo & Polish** — Scripted failure injection, full flow integration test, demo runbook, README, deployment guide

## Phase Details

### Phase 1: Project Foundation & Simulation Layer

**Goal**: Establish the application runtime, agent base architecture, and stub interfaces for all external cloud services. No real cloud calls; everything runs locally.
**Depends on**: Nothing (first phase)
**Requirements**: FLEET-01, FLEET-02, FLEET-04 (registry schema), DEMO-02
**Success Criteria** (what must be TRUE):

  1. FastAPI server starts with a `/health` endpoint returning 200.
  2. All five agent roles (Deploy Monitor, Decision, Incident Memory, Rollback, Postmortem) exist as importable Python classes with stub `run()` methods.
  3. Stub interfaces for Cloud Deploy, Cloud Monitoring, Cloud Logging, and Firestore return deterministic fake data locally.
  4. Workflow state object is defined and persists across a simulated deployment lifecycle in memory.
  5. `make dev` or equivalent starts the local stack with no errors.

**Plans**: 5 plans

Plans:

- [x] 01-01: FastAPI project scaffold — directory structure, pyproject.toml/requirements.txt, health endpoint, linting config
- [x] 01-02: Agent base class and fleet skeleton — BaseAgent, WorkflowState, five concrete agent stubs
- [x] 01-03: Agent Registry — registry schema (agent_id, name, version, owner, domain, risk_level, permissions, status), Firestore-backed storage, registry API endpoints, seed data for 5 agents
- [x] 01-04: Cloud service stub interfaces — CloudDeployStub, MonitoringStub, LoggingStub, FirestoreStub with fake data fixtures
- [x] 01-05: Local dev harness — Makefile/scripts, environment variable contract, smoke test for full import chain

### Phase 2: Anomaly Detection & Incident Memory

**Goal**: Deploy Monitor Agent detects real anomalies from metric baselines. Incident Memory Agent stores and retrieves incident context. Log sanitization prevents prompt injection.
**Depends on**: Phase 1
**Requirements**: ANOM-01, ANOM-02, ANOM-03, MEM-01, MEM-03, SEC-01
**Success Criteria** (what must be TRUE):

  1. Given a pre-deployment baseline and injected post-deployment metrics (via stub), Deploy Monitor Agent correctly identifies HIGH/CRITICAL anomalies across all 7 metric dimensions.
  2. Anomaly signal contains severity, per-metric evidence, and confidence score.
  3. Incident events are written to and read from Firestore (or stub) with access controls and sanitized log snippets.
  4. Log sanitization strips or redacts patterns that could constitute prompt injection payloads.

**Plans**: 4/4 plans executed

Plans:

- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md
- [x] 02-03-PLAN.md
- [x] 02-04-PLAN.md

**Wave 1**

- [x] 02-01: Baseline comparison engine — metric polling, statistical delta computation, severity/confidence scoring

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: Deploy Monitor Agent integration — lifecycle hooks, anomaly signal construction, stub monitoring source
- [x] 02-03: Incident Memory Agent — Firestore schema, write/read operations, retention policy, access control
- [x] 02-04: Log sanitization layer — pattern detection, redaction, safe passthrough to LLM/tool paths

**Cross-cutting constraints:**

- `pytest tests/test_deploy_monitor.py` passes

### Phase 3: Decisioning Engine & Governance

**Goal**: Decision Agent synthesizes anomaly signals, historical incidents, and Gemini LLM reasoning through a policy-governed gateway to produce authorized, auditable decisions.
**Depends on**: Phase 2
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, FLEET-03, FLEET-04, MEM-02, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):

  1. Decision Agent retrieves similar historical incidents from Incident Memory Agent and incorporates them into its reasoning context.
  2. Gemini API is called with sanitized, structured context; Model Armor protections are applied.
  3. Policy checks (confidence, severity, deployment age, stable version, environment) are evaluated deterministically before any action is authorized.
  4. Agent Gateway verifies agent identity and permission before authorizing sensitive tool calls.
  5. Every decision produces a complete trace: evidence, confidence, policy results, authorization, selected action.

**Plans**: 4/4 plans executed

Plans:

- [x] 03-01-PLAN.md
- [x] 03-02-PLAN.md
- [x] 03-03-PLAN.md
- [x] 03-04-PLAN.md

- [x] 03-01: Agent Gateway — identity verification, permission matrix, policy evaluation engine, authorization log
- [x] 03-02: Gemini LLM integration — prompt construction, Model Armor wrapping, response parsing, confidence extraction
- [x] 03-03: Decision Agent — evidence aggregation, historical context lookup, LLM call, policy checks, action selection
- [x] 03-04: Decision trace schema and persistence — structured trace object, Firestore write, query interface

### Phase 4: Google Cloud Platform & ADK Fleet Modernization

**Goal**: Modernize the agent fleet using the Google Agent Development Kit (ADK) / agents-cli patterns, enable Vertex AI RAG / Vector Search for incident memory, and bridge local stubs to real Google Cloud service connectors.
**Depends on**: Phase 3
**Requirements**: FLEET-01, FLEET-02, MEM-01, MEM-02, SEC-02, GOV-01
**Success Criteria** (what must be TRUE):

  1. Agents and tools are defined using standard Google ADK APIs with structured function calling and type schemas.
  2. Incident Memory uses Vertex AI RAG / Firestore Vector Search for semantic incident similarity lookup alongside structured filters.
  3. Google Cloud service connectors (Cloud Monitoring API, Cloud Logging LQL, Cloud Deploy, Cloud Run) are available with clean fallback to local stubs.
  4. Agent identity mappings integrate with GCP IAM service accounts and least-privilege role boundaries.
  5. Automated agent evaluation harness is configured (`agents-cli eval`) to benchmark decision and safety accuracy.

**Plans**: 4 plans

Plans:

- [ ] 04-01: ADK fleet migration — refactor agents and tools to Google ADK declarative architecture and lifecycle hooks
- [ ] 04-02: Vertex AI RAG & semantic incident memory — vector embeddings, similarity search, and Model Armor integration
- [ ] 04-03: Google Cloud native service connectors — live Cloud Monitoring (PromQL), Cloud Logging (LQL), and Cloud Deploy client adapters
- [ ] 04-04: Automated agent evaluation harness — golden test datasets, `agents-cli eval` configuration, and IAM least-privilege matrix

### Phase 5: Rollback Execution & Recovery Verification

**Goal**: Rollback Agent executes approved rollbacks via Cloud Deploy, verifies recovery via metric re-check, and emits OpenTelemetry traces correlated with monitoring data.
**Depends on**: Phase 4
**Requirements**: ROLL-01, ROLL-02, ROLL-03, POST-03
**Success Criteria** (what must be TRUE):

  1. Rollback Agent refuses to execute when policy checks fail; records refusal in workflow state.
  2. Rollback Agent calls Cloud Deploy (or stub) with the correct stable target version.
  3. After rollback, Deploy Monitor Agent re-polls metrics and writes a recovery verdict (recovered / degraded / inconclusive) to workflow state.
  4. OpenTelemetry spans are emitted for deploy, anomaly, decision, rollback, and recovery events.

**Plans**: 3 plans

Plans:

- [ ] 05-01: Rollback Agent — gateway authorization flow, Cloud Deploy call, policy-blocked path, workflow state update
- [ ] 05-02: Recovery verification loop — post-rollback metric polling, verdict computation, state write
- [ ] 05-03: OpenTelemetry instrumentation — span definitions, trace context propagation, Cloud Monitoring correlation

### Phase 6: Postmortem Generation & Operator Dashboard

**Goal**: Postmortem Agent generates auditable postmortems. React dashboard shows fleet overview, deployment health, agent activity, decision traces, and agent registry.
**Depends on**: Phase 5
**Requirements**: POST-01, POST-02
**Success Criteria** (what must be TRUE):

  1. Postmortem Agent generates a structured postmortem document (timeline, evidence, decisions, actions, outcomes) after each recovery or failed rollback.
  2. Dashboard loads and displays live fleet status, deployment health, and agent activity without errors.
  3. Decision trace viewer renders a complete decision trace from Firestore for any deployment event.
  4. Agent registry view lists all agents with identity, role, and last-active status.

**Plans**: 4 plans

Plans:

- [ ] 06-01: Postmortem Agent — document template, data assembly from workflow state and decision traces, Firestore write
- [ ] 06-02: Dashboard backend API — FastAPI routes for fleet status, deployment events, agent activity, decision traces, agent registry
- [ ] 06-03: Dashboard frontend — React/TypeScript app, fleet overview, deployment health panel, agent activity log
- [ ] 06-04: Decision trace viewer and agent registry UI — trace detail view, registry table, Tailwind CSS styling

### Phase 7: End-to-End Demo & Polish

**Goal**: Wire all agents into a scripted demo flow with failure injection, security attack simulations, integration tests, a demo runbook, and deployment documentation.
**Depends on**: Phase 6
**Requirements**: DEMO-01
**Success Criteria** (what must be TRUE):

  1. Running `make demo` triggers a scripted deployment → metric failure injection → full agent pipeline → rollback → recovery → postmortem, end-to-end without manual intervention.
  2. Security demo scenario 1: Decision Agent attempting to call `deployment.rollback` directly is blocked by the Agent Gateway with a DENIED authorization trace.
  3. Security demo scenario 2: A log payload containing a prompt injection attempt is flagged by the sanitization/Model Armor layer and treated as untrusted data — agent pipeline continues safely.
  4. A demo runbook explains each stage and what to observe in the dashboard.
  5. Integration test covers the full flow against stubs and passes in CI.
  6. README includes setup, local demo, and cloud deployment instructions.

**Plans**: 4 plans

Plans:

- [ ] 07-01: Demo orchestrator and failure injection script — scripted flow, metric injection hooks, stage output
- [ ] 07-02: Security demo scenarios — unauthorized agent gateway denial, prompt injection blocked by sanitization/Model Armor
- [ ] 07-03: Integration test suite — full-pipeline test against stubs, security scenario tests, CI configuration
- [ ] 07-04: Documentation — README, demo runbook, cloud deployment guide, architecture diagram

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation & Simulation Layer | 5/5 | Complete    | 2026-08-29 |
| 2. Anomaly Detection & Incident Memory | 4/4 | Complete    | 2026-08-29 |
| 3. Decisioning Engine & Governance | 4/4 | Complete    | 2026-08-29 |
| 4. Google Cloud Platform & ADK Fleet Modernization | 0/4 | Not started | - |
| 5. Rollback Execution & Recovery Verification | 0/3 | Not started | - |
| 6. Postmortem Generation & Operator Dashboard | 0/4 | Not started | - |
| 7. End-to-End Demo & Polish | 0/4 | Not started | - |

---
*Roadmap defined: 2026-08-23*
*Last updated: 2026-08-30 after adding Phase 4 GCP & ADK Modernization*
