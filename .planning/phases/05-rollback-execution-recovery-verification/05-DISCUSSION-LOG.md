# Phase 05: Rollback Execution & Recovery Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 05-rollback-execution-recovery-verification
**Areas discussed:** Rollback Target Resolution & Failure Handling, Recovery Verification Loop & Cooldown Policy, OpenTelemetry Tracing & Export Destination, Gateway Tool Authorization & Refusal Behavior

---

## Rollback Target Resolution & Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Strict state & decision trace lookup with N-1 fallback | RollbackAgent resolves stable target version from state/decision trace; formats standard release ID `release-{service}-{stable_version}`; refuses if undetermined | ✓ |
| Strict state only | Refuse rollback and mark workflow failed if stable_version is not explicitly provided in decision trace | |
| Dynamic discovery | Query Cloud Deploy delivery pipeline history to find most recent successfully deployed release | |

**User's choice:** Strict state & decision trace lookup with fallback to standard N-1 release tag convention (`release-{service}-{stable_version}` formatted identifier), raising an explicit error if stable version cannot be determined.
**Execution tracking:** Synchronous polling with configurable timeout (1s interval up to 10s default in test/demo, longer in prod) ensuring RollbackAgent marks execution complete only after rollout finishes.

---

## Recovery Verification Loop & Cooldown Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable stabilization delay + repeated sampling | 2s default delay in test/demo, then 3–5 iterations at 1s intervals across all 7 metric dimensions | ✓ |
| Immediate sampling without delay | Begin polling immediately after rollout with exponential backoff | |
| Single-shot sampling | Wait fixed duration and perform single metric snapshot comparison | |

**User's choice:** Configurable stabilization delay (default 2s for tests/demo) followed by repeated metric sampling across all 7 dimensions over a short window (3-5 iterations at 1s intervals).
**Verdict thresholds:** Multi-metric strict tolerance: `recovered` if all 7 metric ratios drop below anomaly thresholds (<= 1.15x baseline, 0 crashes/restarts); `degraded` if any metric remains above anomaly threshold; `inconclusive` if telemetry data is unavailable/errored.

---

## OpenTelemetry Tracing & Export Destination

| Option | Description | Selected |
|--------|-------------|----------|
| Dual exporter architecture | InMemorySpanExporter/ConsoleSpanExporter when mock GCP enabled, Google Cloud Trace Exporter for live GCP | ✓ |
| Standard OTLP Exporter | Always export via OTLP endpoint (grpc/http) with fallback | |
| In-memory structured span recorder | Custom span accumulator in workflow state | |

**User's choice:** Dual exporter architecture: Use InMemorySpanExporter / ConsoleSpanExporter when DEPLOYGUARD_MOCK_GCP=true (ideal for fast tests and demo inspection), and Google Cloud Trace Exporter (`opentelemetry-exporter-gcp-trace`) when live GCP mode is enabled.
**Span hierarchy:** Unified root trace (`deployguard.deployment`) keyed by `deployment_id`, child spans for each step (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`), injecting W3C TraceContext into ADK session state & logs.

---

## Gateway Tool Authorization & Refusal Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier defense & refusal auditing | Gateway validates caller identity ('rollback-agent') AND RollbackAgent validates authorized DecisionTrace; blocked attempts update workflow status to 'failed' and write DENIED trace | ✓ |
| Gateway-only enforcement | Rely exclusively on AgentGateway IAM permission checks | |
| Optimistic execution with prompt | Prompt operator if decision trace is missing | |

**User's choice:** Two-tier defense: (1) AgentGateway decorator strictly validates caller IAM identity (only 'rollback-agent' allowed) AND (2) RollbackAgent validates the presence of an authorized, policy-passing DecisionTrace in workflow state; unauthorized or policy-blocked attempts update workflow state (rollback_authorized=False, pipeline_status='failed') and emit a DENIED audit log.

---

## the agent's Discretion

- Cloud Deploy LRO backoff and timeout configuration defaults for live GCP runs.
- OpenTelemetry span attribute naming conventions (`deployguard.service`, `deployguard.version`, `deployguard.verdict`).

## Deferred Ideas

- None — discussion stayed within phase scope.
