# Roadmap: DeployGuard

## Overview

DeployGuard is built in six focused phases: first establishing the project skeleton and simulation interfaces, then layering in anomaly detection and incident memory, then adding the governed decisioning engine with security controls, then implementing rollback execution and verification, then building the operator dashboard and postmortem generation, and finally wiring together a convincing end-to-end demo flow. Each phase delivers a usable vertical slice; later phases depend on the contracts established in earlier ones.

## Phases

- [x] **Phase 1: Project Foundation & Simulation Layer** — Python FastAPI skeleton, agent base classes, Agent Registry, Cloud Deploy/Monitoring/Logging stub interfaces, local dev harness (completed 2026-08-29)
- [x] **Phase 2: Anomaly Detection & Incident Memory** — Deploy Monitor Agent, baseline comparison, Firestore incident storage, log sanitization (completed 2026-08-29)
- [x] **Phase 3: Decisioning Engine & Governance** — Decision Agent, Gemini LLM integration, Agent Gateway, IAM identities, Model Armor, policy evaluation (completed 2026-08-29)
- [x] **Phase 4: Google Cloud Platform & ADK Fleet Modernization** — Google Agents CLI / ADK integration, Vertex AI RAG / Vector Search incident memory, Cloud Monitoring/Logging telemetry connectors, GCP IAM/Workload Identity boundaries (completed 2026-08-30)
- [x] **Phase 5: Rollback Execution & Recovery Verification** — Rollback Agent, Cloud Deploy integration, post-rollback metric verification, decision trace output, OpenTelemetry (completed 2026-08-30)
- [x] **Phase 6: Postmortem Generation & Operator Dashboard** — Postmortem Agent, Next.js / shadcn / GSAP / Anime.js / Recharts SRE operator dashboard, real-time SSE streaming, decision trace stepper, postmortem markdown viewer (completed 2026-08-30)
- [x] **Phase 7: End-to-End Demo & Polish** — Scripted failure injection, full flow integration test, demo runbook, README, deployment guide (completed 2026-08-30)

## Phase Details

### Phase 6: Postmortem Generation & Operator Dashboard

**Goal**: Postmortem Agent generates auditable postmortems. React dashboard shows fleet overview, deployment health, agent activity, decision traces, and agent registry.
**Depends on**: Phase 5
**Requirements**: POST-01, POST-02
**Success Criteria** (what must be TRUE):

  1. Postmortem Agent generates a structured postmortem document (timeline, evidence, decisions, actions, outcomes) after each recovery or failed rollback.
  2. Dashboard loads and displays live fleet status, deployment health, and agent activity without errors.
  3. Decision trace viewer renders a complete decision trace from Firestore for any deployment event.
  4. Agent registry view lists all agents with identity, role, and last-active status.

**Plans**: 4/4 plans executed

Plans:

- [x] 06-01: Postmortem Agent — document template, data assembly from workflow state and decision traces, Firestore write
- [x] 06-02: Dashboard backend API — FastAPI routes for fleet status, deployment events, agent activity, decision traces, agent registry
- [x] 06-03: Dashboard frontend — Next.js/TypeScript app, fleet overview, deployment health panel, agent activity log
- [x] 06-04: Decision trace viewer and agent registry UI — trace detail view, registry table, Tailwind CSS styling

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

**Plans**: 4/4 plans executed

Plans:

- [x] 07-01: Demo orchestrator and failure injection script — scripted flow, metric injection hooks, stage output
- [x] 07-02: Security demo scenarios — unauthorized agent gateway denial, prompt injection blocked by sanitization/Model Armor
- [x] 07-03: Integration test suite — full-pipeline test against stubs, security scenario tests, CI configuration
- [x] 07-04: Documentation — README, demo runbook, cloud deployment guide, architecture diagram

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation & Simulation Layer | 5/5 | Complete    | 2026-08-29 |
| 2. Anomaly Detection & Incident Memory | 4/4 | Complete    | 2026-08-29 |
| 3. Decisioning Engine & Governance | 4/4 | Complete    | 2026-08-29 |
| 4. Google Cloud Platform & ADK Fleet Modernization | 4/4 | Complete    | 2026-08-30 |
| 5. Rollback Execution & Recovery Verification | 3/3 | Complete    | 2026-08-30 |
| 6. Postmortem Generation & Operator Dashboard | 4/4 | Complete    | 2026-08-30 |
| 7. End-to-End Demo & Polish | 4/4 | Complete    | 2026-08-30 |

---
*Roadmap defined: 2026-08-23*
*Last updated: 2026-08-30 after completing Phase 7 End-to-End Demo & Polish (Milestone v1 Complete)*
