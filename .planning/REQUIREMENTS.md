# Requirements: DeployGuard

**Defined:** 2026-08-23
**Core Value:** DeployGuard reduces deployment-related recovery time while making every autonomous production action explainable, policy-governed, and auditable.

## v1 Requirements

Requirements for the initial MVP release. Each maps to roadmap phases.

### Anomaly Detection

- [ ] **ANOM-01**: System detects post-deployment anomalies by comparing error rate, latency, crash rate, CPU, memory, restart count, and request rate against pre-deployment baselines.
- [ ] **ANOM-02**: Deploy Monitor Agent continuously polls Cloud Monitoring and Cloud Logging for signals after each deployment event.
- [ ] **ANOM-03**: Anomaly detection produces a structured signal (severity, evidence list, affected metrics, confidence) that feeds the decisioning pipeline.

### Agent Fleet Coordination

- [x] **FLEET-01**: Five specialized agents operate with defined roles: Deploy Monitor, Decision, Incident Memory, Rollback, and Postmortem.
- [x] **FLEET-02**: Agents communicate via a shared workflow state object persisted across the deployment-to-recovery lifecycle.
- [ ] **FLEET-03**: Agents enforce separation of duties — the Decision Agent cannot directly execute rollback; it requests approval from the Rollback Agent via gateway.
- [x] **FLEET-04**: Each agent has a declared identity (Google Cloud service account) and operates with least-privilege IAM permissions.

### Decisioning & Governance

- [x] **GOV-01**: Decision Agent combines deterministic rules, statistical evidence, historical incidents from Incident Memory Agent, and Gemini LLM reasoning before selecting an action (wait, alert, rollback).
- [ ] **GOV-02**: Automatic rollback requires all policy checks to pass: confidence threshold ≥ 0.80, severity HIGH or CRITICAL, deployment age < 30 min, stable prior version available, environment policy allows auto-rollback.
- [ ] **GOV-03**: Every decision produces an auditable trace including evidence, confidence score, policy check results, authorization outcome, selected action, and execution result.
- [ ] **GOV-04**: An Agent Gateway enforces identity verification, permission checks, environment constraints, and policy evaluation for all sensitive tool calls.

### Incident Memory

- [x] **MEM-01**: Incident Memory Agent stores deployment events, anomaly signals, decisions, and postmortem outcomes in Firestore with access and retention controls.
- [x] **MEM-02**: Decision Agent retrieves historical incidents similar to the current anomaly to inform confidence and action selection.
- [ ] **MEM-03**: Stored incident data minimizes sensitive fields; log snippets are sanitized before persistence.

### Security & Safety

- [ ] **SEC-01**: Production logs and external data are screened or sanitized before reaching LLM reasoning or tool-use paths (prompt injection prevention).
- [x] **SEC-02**: Model Armor protections are applied to Gemini API calls for sensitive-data leakage prevention.
- [ ] **SEC-03**: Sensitive tool calls (rollback execution, Firestore writes) require gateway authorization and are logged in the decision trace.

### Rollback & Recovery

- [ ] **ROLL-01**: Rollback Agent executes approved rollback via Cloud Deploy, targeting the last known stable version.
- [ ] **ROLL-02**: After rollback, Deploy Monitor Agent re-checks metrics to verify recovery; outcome is written to workflow state and triggers Postmortem Agent.
- [ ] **ROLL-03**: Rollback is blocked when policy checks fail (low confidence, insufficient deployment age, no stable version, environment restriction).

### Postmortem & Observability

- [ ] **POST-01**: Postmortem Agent generates an auditable postmortem document after each recovery or failed rollback attempt, capturing timeline, evidence, decisions, actions, and outcomes.
- [ ] **POST-02**: Operator dashboard provides fleet overview, deployment health status, agent activity log, decision traces, and agent registry view.
- [ ] **POST-03**: All agent actions emit OpenTelemetry traces that can be correlated with Cloud Monitoring metrics and Cloud Logging entries.

### Demo & Verification

- [ ] **DEMO-01**: The system supports a convincing end-to-end demo flow: healthy deployment → injected metric failure → anomaly detection → investigation → governed rollback decision → recovery verification → postmortem.
- [x] **DEMO-02**: External operations (Cloud Deploy, Cloud Monitoring, Firestore) have explicit interfaces with safe simulation/stub paths for local and controlled-cloud execution.

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Advanced Governance

- **GOV-V2-01**: Human approval gate for rollback in production environments above a configurable blast-radius threshold.
- **GOV-V2-02**: Policy-as-code: rollback and remediation policies expressed in a declarative format (e.g., OPA/Rego or a GSD-native YAML schema).
- **GOV-V2-03**: Multi-environment promotion rollback (staging → canary → production cascade).

### Extended Integrations

- **INT-V2-01**: Multi-cloud control plane support (AWS CodeDeploy, Azure DevOps Pipelines).
- **INT-V2-02**: PagerDuty / Slack alerting integration for rollback events and postmortems.
- **INT-V2-03**: GitHub/GitLab webhook integration for deployment event triggering.

### Expanded Memory

- **MEM-V2-01**: Vector similarity search over historical incident embeddings for richer analogical reasoning.
- **MEM-V2-02**: Incident memory regional sharding and cross-region read replicas.

## Out of Scope

Explicitly excluded from v1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Broad autonomous infrastructure administration | Expands risk and weakens least-privilege boundary |
| Source-code modification by agents | Outside agent fleet domain; remediation is limited to deployment operations |
| Arbitrary production shell access | Security boundary violation |
| Payroll, IAM administration, log deletion | Explicitly outside agent fleet domain |
| Full multi-cloud control plane (v1) | First implementation targets Google Cloud primitives |
| Native mobile applications | Initial operator experience is a web dashboard only |
| Real-time agent chat UI | Not part of the operator dashboard v1 scope |

## Traceability

Phase assignments will be finalized when ROADMAP.md phases are planned. Preliminary mapping:

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANOM-01 | Phase 2 | Pending |
| ANOM-02 | Phase 2 | Pending |
| ANOM-03 | Phase 2 | Pending |
| FLEET-01 | Phase 1 | Complete |
| FLEET-02 | Phase 1 | Complete |
| FLEET-03 | Phase 3 | Pending |
| FLEET-04 | Phase 3 | Complete |
| GOV-01 | Phase 3 | Complete |
| GOV-02 | Phase 3 | Pending |
| GOV-03 | Phase 4 | Pending |
| GOV-04 | Phase 3 | Pending |
| MEM-01 | Phase 2 | Complete |
| MEM-02 | Phase 3 | Complete |
| MEM-03 | Phase 2 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 3 | Complete |
| SEC-03 | Phase 3 | Pending |
| ROLL-01 | Phase 4 | Pending |
| ROLL-02 | Phase 4 | Pending |
| ROLL-03 | Phase 4 | Pending |
| POST-01 | Phase 5 | Pending |
| POST-02 | Phase 5 | Pending |
| POST-03 | Phase 4 | Pending |
| DEMO-01 | Phase 6 | Pending |
| DEMO-02 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-23*
*Last updated: 2026-08-23 after onboarding initialization*
