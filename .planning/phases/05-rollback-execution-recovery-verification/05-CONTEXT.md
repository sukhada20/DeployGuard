# Phase 05: Rollback Execution & Recovery Verification - Context

**Gathered:** 2026-08-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 implements rollback execution, recovery verification, and distributed telemetry tracing:
1. **Rollback Agent**: Enforces two-tier gateway authorization, queries Decision Agent traces, and executes rollbacks via `LiveCloudDeployClient` / `MockCloudDeploy` targeting the stable release.
2. **Recovery Verification Loop**: Deploy Monitor Agent polls telemetry metrics (using `MetricsSource`) following rollback stabilization, evaluating strict multi-metric thresholds to issue a recovery verdict (`recovered` / `degraded` / `inconclusive`).
3. **OpenTelemetry Telemetry Instrumentation**: Emits a unified trace per deployment lifecycle (`deployguard.deployment`) with nested spans (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`), supporting Cloud Trace and in-memory test exporters.
</domain>

<decisions>
## Implementation Decisions

### 1. Rollback Target Resolution & Failure Handling
- **D-01:** **Strict state & decision trace lookup with N-1 fallback** — RollbackAgent resolves stable target version from `DeploymentWorkflowState` / `DecisionTrace`, formatting standard Cloud Deploy release IDs as `release-{service_name}-{stable_version}` (dots replaced with hyphens). If stable version is missing and cannot be determined, RollbackAgent strictly refuses execution and fails the workflow. — **Reversibility:** reversible — formatting logic is centralized and isolated.
- **D-02:** **Synchronous polling with configurable timeout** — Rollback execution synchronously polls the Cloud Deploy rollout status (default 1s interval up to 10s in local/demo mode, configurable for prod) until reaching terminal state (`SUCCEEDED` or `FAILED`), ensuring execution completes before initiating verification. — **Reversibility:** reversible — execution polling parameters live in configuration.

### 2. Recovery Verification Loop & Cooldown Policy
- **D-03:** **Stabilization delay + multi-iteration metric sampling** — After rollout succeeds, Deploy Monitor Agent waits for a configurable stabilization cooldown (default 2s in test/demo mode) and then polls telemetry over 3–5 iterations at 1s intervals. — **Reversibility:** reversible — sampling count and intervals are environment-configurable.
- **D-04:** **Strict multi-metric recovery criteria** — Verdict is classified as:
  - `recovered`: All 7 metric ratios drop below anomaly thresholds (<= 1.15x baseline for error rate, latency, CPU, memory, request rate, and zero crash/restart deltas).
  - `degraded`: One or more metrics remain anomalous above threshold.
  - `inconclusive`: Metrics query fails, telemetry data is unavailable, or timeout occurs.
  — **Reversibility:** reversible — threshold evaluation logic is isolated in metric evaluation utilities.

### 3. OpenTelemetry Tracing & Export Destination
- **D-05:** **Dual exporter architecture** — Use `InMemorySpanExporter` / `ConsoleSpanExporter` when `DEPLOYGUARD_MOCK_GCP=true` (fast local test assertions and demo inspection) and Google Cloud Trace Exporter (`opentelemetry-exporter-gcp-trace`) when live GCP mode is enabled. — **Reversibility:** reversible — tracer provider setup is modular in factory/tracing layer.
- **D-06:** **Unified root trace per deployment** — Structure a single root trace (`deployguard.deployment`) keyed by `deployment_id`, with distinct child spans for each agent phase (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`), injecting standard W3C TraceContext into ADK session state and log records. — **Reversibility:** costly — standardizes span and context propagation across all agents.

### 4. Gateway Tool Authorization & Refusal Behavior
- **D-07:** **Two-tier defense & refusal auditing** — (1) `AgentGateway` tool decorator strictly restricts rollback execution tools to the `rollback-agent` IAM identity, AND (2) `RollbackAgent` checks for an authorized, policy-passing `DecisionTrace` (`decision == "rollback"`, `authorized == True`, `policy_passed == True`) in workflow state before invocation. Unauthorized or policy-blocked attempts set `rollback_authorized=False`, update workflow status to `failed`, and write an auditable `DENIED` trace entry. — **Reversibility:** costly — defines security gating across gateway and agents.

### the agent's Discretion
- Cloud Deploy LRO backoff and timeout configuration defaults for live GCP runs.
- OpenTelemetry span attribute naming conventions (`deployguard.service`, `deployguard.version`, `deployguard.verdict`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- `.planning/PROJECT.md` — Core value, active requirements, and key decisions
- `.planning/REQUIREMENTS.md` — Project requirement definitions (ROLL-01, ROLL-02, ROLL-03, POST-03)
- `.planning/ROADMAP.md` §Phase 5 — Phase 5 goal, success criteria, and plans (05-01 through 05-03)

### Existing Implementation & Context
- `.planning/phases/03-decisioning-engine-governance/03-CONTEXT.md` — Decisioning engine rules, LLM logic, and Agent Gateway structure
- `.planning/phases/04-gcp-adk-empowerment-modernization/04-CONTEXT.md` — ADK fleet architecture, IAM service accounts, and live GCP connectors
- `src/deployguard/agents/rollback.py` — Rollback Agent base class and execution hooks
- `src/deployguard/agents/deploy_monitor.py` — Deploy Monitor Agent recovery verification loop
- `src/deployguard/security/gateway.py` — Agent Gateway identity and permission verification
- `src/deployguard/cloud/deploy_client.py` — LiveCloudDeployClient and IAM service account bindings
- `src/deployguard/cloud/interfaces.py` — Service protocols defining stubs and cloud clients
- `src/deployguard/cloud/stubs.py` — MockCloudDeploy and MockMonitoring stubs
- `src/deployguard/state/workflow.py` — DeploymentWorkflowState, AnomalySignal, DecisionTrace
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LiveCloudDeployClient` in `src/deployguard/cloud/deploy_client.py` with `execute_rollback` method.
- `MockCloudDeploy` & `MockMonitoring` in `src/deployguard/cloud/stubs.py` for simulated rollback operations and telemetry generation.
- `MetricBaseline` in `src/deployguard/cloud/metrics.py` for delta calculation and anomaly threshold checks.
- `AgentGateway` in `src/deployguard/security/gateway.py` for IAM permission enforcement.

### Established Patterns
- ADK `BaseDeployGuardAgent` subclassing with async generators yielding ADK `Event` objects.
- Pydantic state serialization in `DeploymentWorkflowState.to_session_dict()` / `from_session_dict()`.
- Protocol interfaces (`MetricsSource`, `DeploymentManager`) enabling transparent switching between mock stubs and live GCP clients.

### Integration Points
- `RollbackAgent._execute()`: Gateway permission verification, decision trace validation, and Cloud Deploy execution.
- `DeployMonitorAgent`: Adding post-rollback recovery verification mode to evaluate post-deployment stability.
- Tracing middleware / helper module: Initializing OpenTelemetry TracerProvider and attaching spans to agent lifecycles.
</code_context>

<specifics>
## Specific Ideas
- Strict separation of duties: Ensure DecisionAgent cannot execute rollbacks directly; all rollbacks must pass through RollbackAgent with verified decision trace.
- Fast testing: Allow mock stabilization delay and polling count to be overridden via test fixtures for sub-second test execution.
</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.
</deferred>

---

*Phase: 05-rollback-execution-recovery-verification*
*Context gathered: 2026-08-30*
