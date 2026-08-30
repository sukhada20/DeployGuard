# Feature Landscape

**Domain:** Governed multi-agent CI/CD deployment safety platform
**Researched:** 2026-08-22

## Table Stakes

Features users expect from a credible deployment safety product. Missing these makes the platform incomplete or unsafe to operate.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Deployment health monitoring | Release teams need one health signal covering error rate, latency, crashes, CPU, memory, restarts, and request rate after a deployment. | High | Cloud Deploy or deployment adapter, Cloud Monitoring metrics, deployment identity, runtime state |
| Baseline comparison and anomaly detection | Static thresholds miss regressions and vary by service; comparison with a recent healthy baseline is necessary for useful detection. | High | Metric normalization, baseline storage, windowing, deployment metadata, observability |
| Deployment lifecycle correlation | Operators must distinguish a release-caused regression from an unrelated production incident. | Medium | Deployment events, service/version identifiers, telemetry timestamps, runtime state |
| Deterministic decision policy | Autonomous action needs explicit severity, confidence, deployment-age, stable-version, and environment checks. | High | Anomaly evidence, policy configuration, policy evaluator, version registry |
| Specialized agent ownership | Separate monitor, decision, incident-memory, rollback, and postmortem responsibilities provide separation of duties and explainability. | High | Agent registry, identity, workflow state, gateway policy |
| Persistent workflow state | Recovery cannot depend on process memory; the deployment-to-detection-to-decision-to-recovery lifecycle must survive retries and restarts. | High | Firestore or equivalent state store, idempotency keys, event correlation |
| Governed rollback | Rollback must execute only an approved deployment operation against a known stable version, with a recorded authorization result. | High | Decision policy, stable-version registry, rollback adapter, gateway authorization, rollback identity |
| Human escalation and approval | Low-confidence, high-severity, policy-blocked, or ambiguous events require an operator path instead of silent failure or unsafe automation. | Medium | Dashboard, notification adapter, workflow state, decision trace |
| Complete decision and action trace | SREs and auditors need evidence, model reasoning inputs, confidence, policy checks, identity, authorization, tool calls, and outcomes. | High | Structured trace schema, immutable audit storage, agent identity, observability |
| Incident memory retrieval | Previous incidents, symptoms, actions, and outcomes improve investigation and reduce repeated diagnosis. | High | Firestore memory bank, retrieval/indexing, retention controls, access policy |
| Sensitive-data and prompt-injection protection | Production logs are untrusted and may contain secrets or instructions that can manipulate an agent. | High | Log sanitization, Model Armor, prompt/tool boundary, redaction policy |
| Agent registry | Platform operators need an inventory of agents, versions, capabilities, owners, environments, status, and granted tools. | Medium | Identity records, capability manifest, dashboard, policy configuration |
| Runtime state visibility | Operators need to see active workflows, agent heartbeats, current phase, leases, retries, and stuck or timed-out work. | Medium | Persistent workflow state, agent runtime telemetry, dashboard |
| Workload identity and least privilege | Every agent must have a distinct identity and only the permissions required for its role. | High | Google IAM/service accounts, deployment bindings, registry, gateway |
| Agent gateway for sensitive tools | A single enforceable boundary must authorize rollback and other external calls using identity, environment, policy, and request context. | High | Identity, policy evaluator, tool adapters, audit trace |
| Operational dashboard | The MVP needs fleet overview, deployment health, agent activity, decision traces, registry, active incidents, and recovery status in one operator view. | High | APIs/read models, event state, observability, access control |
| Failure-and-recovery demonstration path | A convincing healthy deployment, injected failure, investigation, governed rollback, recovery, and postmortem flow is essential to prove the product contract. | Medium | All core workflow components, simulation adapters, dashboard |

## Differentiators

Features that make DeployGuard more than an alerting system or an unconstrained DevOps chatbot.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Evidence-fused decisioning | Combine deterministic rules, statistical evidence, incident memory, bounded LLM reasoning, and enterprise policy so no single weak signal controls production. | High | Anomaly engine, memory retrieval, Gemini adapter, policy evaluator, decision trace |
| Governed autonomous action | Execute rollback automatically only when confidence, severity, version availability, age, and environment policy all pass; otherwise escalate. | High | Decision policy, gateway, rollback adapter, identity, audit trace |
| Policy simulation and dry run | Let teams test a policy against historical or synthetic incidents before enabling automatic rollback. | High | Versioned policy store, historical traces, simulation runner, dashboard |
| Progressive rollout safety | Monitor canary or staged releases and halt promotion or roll back before broad exposure. | High | Cloud Deploy rollout state, per-stage health, policy evaluator, stable-version registry |
| Multi-signal anomaly explanation | Show which metrics deviated, baseline comparison, timing, severity, confidence, and correlated deployment facts rather than only an alert score. | Medium | Feature extraction, baseline store, decision trace, dashboard |
| Incident memory with outcome learning | Store not just incident text but symptoms, hypotheses, actions, policy results, recovery evidence, and postmortem outcomes for future retrieval. | High | Structured incident schema, retention/access controls, postmortem agent, retrieval |
| Memory governance | Apply tenant/environment access controls, redaction, retention, regional placement, provenance, and deletion workflows to operational memory. | High | IAM, data classification, Firestore, audit trace |
| Automated postmortem generation | Produce a timeline, impact summary, contributing evidence, actions, policy decisions, and follow-ups from the trace, with human review before publication. | Medium | Trace schema, incident memory, LLM adapter, human escalation |
| Postmortem-to-memory feedback loop | Allow approved postmortems and operator corrections to become searchable incident knowledge without treating generated text as unquestioned truth. | Medium | Review workflow, provenance metadata, memory indexing |
| Model Armor at the reasoning boundary | Screen prompts and model interactions for prompt injection and sensitive-data leakage before reasoning or tool use. | High | Model Armor integration, log sanitization, Gemini adapter, gateway |
| Decision observability | Query fleet-wide decision latency, override rate, false rollback rate, policy denials, confidence calibration, and recovery outcomes. | High | OpenTelemetry, structured audit events, analytics read model, dashboard |
| Runtime fleet health | Detect missing heartbeats, duplicate workers, stale leases, retry storms, and agent version drift before they affect recovery. | Medium | Runtime state, agent telemetry, registry, alerting |
| Separation-of-duties enforcement | Make it technically impossible for the Decision Agent to execute rollback directly; only the Rollback Agent through the gateway can do so. | High | Distinct identities, capability manifests, gateway policy, IAM |
| Human-in-the-loop escalation workspace | Present evidence, recommended action, policy blockers, affected deployment, and approve/deny controls with an auditable operator identity. | High | Dashboard, decision trace, notifications, identity, workflow state |
| Safe adapter boundary | Run locally with deterministic simulators while keeping Cloud Deploy, Monitoring, Logging, Firestore, and Model Armor behind replaceable interfaces. | Medium | Adapter contracts, simulation fixtures, integration tests |
| Release risk scoring | Prioritize deployments using service criticality, change size, historical failure rate, rollout stage, and current health. | High | Deployment metadata, incident memory, telemetry, policy configuration |

## Anti-Features

Features to explicitly avoid because they violate the product boundary, increase blast radius, or create misleading confidence.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Arbitrary production shell access | It bypasses governance, makes actions difficult to review, and turns a deployment safety system into an unrestricted infrastructure agent. | Expose only typed, approved deployment operations through the gateway. |
| Source-code modification by agents | Automatic code changes expand scope, complicate review, and can make rollback insufficient. | Escalate code fixes to humans; limit automation to approved deployment and rollback operations. |
| One all-powerful DevOps chatbot | A single identity and broad tool set defeats separation of duties and makes decisions hard to audit. | Use specialized agents with distinct identities, capabilities, and policy boundaries. |
| LLM-only rollback decisions | Models can misread noisy telemetry or malicious logs; fluent reasoning is not authorization. | Require deterministic evidence and policy gates around bounded model interpretation. |
| Silent automatic rollback | Operators lose trust when actions lack explanation, authorization, or outcome verification. | Record a decision trace, notify operators, and verify recovery after every action. |
| Alert volume as the primary product metric | More alerts can look productive while increasing fatigue and hiding important incidents. | Optimize detection quality, time to recovery, false rollback rate, and trace completeness. |
| Full multi-cloud control plane in the initial release | It dilutes the demonstrable Google Cloud path and multiplies provider-specific policy and rollback semantics. | Target Google Cloud first behind adapters; add providers only after the contract is proven. |
| Unbounded long-term log retention in incident memory | Logs may contain secrets, personal data, or hostile instructions and create unnecessary compliance exposure. | Redact, classify, minimize, restrict, and retain only the evidence needed for operations. |
| Self-modifying policy or permissions | Agents must not rewrite the rules that authorize their own production actions. | Version policies and permissions through reviewed human-controlled changes. |
| Unreviewed generated postmortems as ground truth | Generated narratives can omit uncertainty or preserve incorrect hypotheses. | Require human review, provenance, evidence links, and correction before memory promotion. |
| Dashboard as the only alert channel | A dashboard does not guarantee timely response to blocked or degraded recovery. | Add configurable human escalation through existing incident notification paths. |
| Synthetic health score hiding raw evidence | A composite score can obscure which metric failed and make decisions unchallengeable. | Display score plus metric deltas, baseline, timestamps, confidence, and policy outcome. |

## Feature Dependencies

```text
Agent identity + registry -> gateway authorization -> governed tool execution
Telemetry ingestion -> deployment correlation -> baselines -> anomaly evidence
Deployment metadata + stable version registry -> rollback eligibility
Anomaly evidence + policy evaluator + incident memory -> decision recommendation
Decision recommendation + human/escalation policy -> approved action or escalation
Approved action + rollback adapter -> rollback execution -> recovery verification
Workflow state + traces -> dashboard, incident timeline, and postmortem
Sanitized logs + Model Armor -> safe reasoning context and memory ingestion
Postmortem review -> curated incident memory -> future investigation context
Cloud Deploy rollout state + per-stage health -> progressive rollout decisions
```

## MVP Recommendation

Prioritize:

1. Deployment health monitoring, deployment correlation, baselines, and anomaly detection across the required metric set.
2. Persistent workflow state with the five specialized agents, distinct identities, registry, least-privilege permissions, and a gateway that prevents direct Decision Agent rollback.
3. Deterministic decision policy combining structured evidence with bounded LLM reasoning, followed by approved rollback, recovery verification, and human escalation.
4. Sanitized incident memory with access and retention controls, Model Armor protection, complete decision traces, and an operational dashboard.
5. One simulated or Google Cloud-backed end-to-end demo covering healthy deployment, injected failure, investigation, governed rollback, recovery, and reviewed postmortem.

Defer broad multi-cloud support, autonomous code or infrastructure changes, policy self-modification, advanced risk scoring, and fully automated postmortem publication until the core traceable recovery loop is reliable.

## Sources

- [DeployGuard project brief](../PROJECT.md) - product boundary, active requirements, constraints, and intended Google Cloud stack.
- [Google Cloud Deploy documentation](https://cloud.google.com/deploy/docs) - deployment progression and rollback integration surface.
- [Google Cloud Monitoring documentation](https://cloud.google.com/monitoring/docs) - metrics, alerting, and service health telemetry.
- [Google Cloud IAM documentation](https://cloud.google.com/iam/docs) - identities, roles, and least-privilege authorization.
- [Google Cloud Firestore documentation](https://cloud.google.com/firestore/docs) - persistent operational and incident data store candidate.
- [Google Cloud Model Armor documentation](https://cloud.google.com/security-command-center/docs/concepts-model-armor) - prompt injection and sensitive-data protection boundary.
- [OpenTelemetry documentation](https://opentelemetry.io/docs/) - traces, metrics, and logs for decision observability.
