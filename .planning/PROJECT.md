# DeployGuard

## What This Is

DeployGuard is a fortified enterprise fleet for safe CI/CD operations. Specialized agents monitor deployments and production health, detect anomalies, investigate failures using historical incident memory, make governed rollback decisions, execute approved remediation, verify recovery, and generate auditable postmortems.

The product is for platform engineering, SRE, and release teams that need autonomous deployment safety without giving an unconstrained AI direct control of production. Its differentiator is the governed fleet around the agents: registry, runtime state, identity, least-privilege permissions, gateway policy enforcement, Model Armor protections, persistent memory, and decision observability.

## Core Value

DeployGuard reduces deployment-related recovery time while making every autonomous production action explainable, policy-governed, and auditable.

## Requirements

### Validated

- ✓ Coordinate five specialized agents: Deploy Monitor, Decision, Incident Memory, Rollback, and Postmortem. — Phase 1
- ✓ Maintain persistent workflow state across the deployment-to-recovery lifecycle. — Phase 1
- ✓ Detect post-deployment anomalies using baseline comparisons across error rate, latency, crashes, CPU, memory, restarts, and request rate. — Phase 2
- ✓ Store and retrieve deployment, incident, agent, and trace memory with access and retention controls. — Phase 2
- ✓ Protect untrusted production logs and model interactions from prompt injection and sensitive-data leakage. — Phase 2

### Active

- [ ] Combine deterministic rules, statistical evidence, historical incidents, LLM reasoning, and enterprise policy before selecting an action.
- [ ] Enforce agent identity, least privilege, separation of duties, and gateway authorization for sensitive tool calls.
- [ ] Record complete decision traces that explain evidence, confidence, policy checks, authorization, actions, and outcomes.
- [ ] Provide an operational dashboard for fleet overview, deployment health, agent activity, decision traces, and agent registry.
- [ ] Support a convincing demo flow from healthy deployment through injected failure, investigation, governed rollback, recovery, and postmortem.

### Out of Scope

- Broad autonomous infrastructure administration beyond deployment safety — it expands risk and weakens the least-privilege boundary.
- Source-code modification or arbitrary production shell access by agents — remediation is limited to approved deployment operations.
- Payroll, IAM administration, log deletion, or access to unrelated production systems — these are explicitly outside the agent fleet domain.
- A full multi-cloud control plane in the initial release — the first implementation targets Google Cloud primitives and one demonstrable deployment path.
- Native mobile applications — the initial operator experience is a web dashboard.

## Context

- The repository contains the initial FastAPI application skeleton, ADK agent base architecture, Agent Registry, deterministic injectable stubs for cloud services, and a local dev harness.
- The intended platform is Google Cloud: Cloud Run for services and agents, Cloud Monitoring and Cloud Logging for telemetry, Cloud Deploy for deployment and rollback, Firestore for incident memory, IAM/service accounts for agent identity, OpenTelemetry for traces, Model Armor for AI security, and Gemini for reasoning.
- The intended application layer is Python with FastAPI and Google Cloud SDKs, with React, TypeScript, and Tailwind CSS for the dashboard. Google ADK is the agent framework.
- The intended application layer is Python with FastAPI and Google Cloud SDKs for the backend, with Next.js (App Router, TypeScript, Tailwind CSS) for the operator dashboard (deployable to Firebase App Hosting or Cloud Run). Google ADK is the agent framework.
- The first useful vertical slice should be demonstrable locally or with controlled cloud adapters before production integrations are made real. External operations need explicit interfaces and safe simulation paths.
- Success is measured by reduced detection and recovery time, correct rollback decisions, low false rollback rate, automatic failure detection, and complete action-trace coverage.

## Constraints

- **Security**: Agents must use separate identities and least-privilege permissions; the Decision Agent cannot directly execute rollback.
- **Governance**: Automatic rollback requires deterministic policy checks, including confidence, severity thresholds, deployment age, stable-version availability, and environment policy.
- **Safety**: Production logs are untrusted data. They must be screened or sanitized before reaching reasoning and tool-use paths.
- **Auditability**: Every sensitive decision and tool call must produce an inspectable trace with evidence and policy outcome.
- **Platform**: Google Cloud services are the primary integration target for the hackathon implementation.
- **Data**: Incident memory must minimize sensitive data and support access restrictions, retention, and regional deployment considerations.
- **Scope**: Build the MVP first: monitor, baseline, anomaly detection, decisioning, memory, governed rollback, registry, IAM, and dashboard; add stronger governance and security demonstrations next.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a fleet of specialized agents rather than one DevOps chatbot | Separation of duties and explicit ownership make production actions safer and more explainable | ✓ Implemented (Phase 1) |
| Use deterministic + injectable stubs | Predictable tests/demos by default; failures/latency can be injected | ✓ Implemented (Phase 1) |
| Use formal Protocol interfaces for cloud stubs | Decouples agents from concrete stubs and future SDK clients | ✓ Implemented (Phase 1) |
| Use fixture-file driven data loading for stubs | Easy addition of test scenarios without altering code | ✓ Implemented (Phase 1) |
| Use async stubs with sync fallback | Avoids future agent async migrations while remaining simple for unit testing | ✓ Implemented (Phase 1) |
| Use Firestore as the initial incident memory bank | It fits the Google Cloud target and supports persistent historical context for the demo | ✓ Implemented (Phase 2) |
| Configurable ratio-threshold checks for metrics baseline | Most robust way to check metrics against baselines without complex math packages | ✓ Implemented (Phase 2) |
| Local multi-stage log sanitization | Redacts PII and prompt injection signatures before storing or feeding to LLM paths | ✓ Implemented (Phase 2) |
| Use deterministic rules and policy around LLM reasoning | Gemini should interpret structured evidence, not unilaterally control production | ✓ Implemented (Phase 3) |
| Route sensitive actions through an Agent Gateway | Identity, permissions, environment checks, and policy need one enforceable boundary | ✓ Implemented (Phase 3) |
| Target Google Cloud first | Cloud Run, Cloud Deploy, Monitoring, Logging, IAM, Firestore, Gemini, and Model Armor align with the intended enterprise story | — Pending |
| Prioritize a simulated end-to-end failure-and-recovery demo | A complete observable workflow proves more value than disconnected integrations | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-29 after Phase 3*
