# Phase 05: Rollback Execution & Recovery Verification - Research

**Date:** 2026-08-30
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Strict state & decision trace lookup with N-1 fallback — RollbackAgent resolves stable target version from `DeploymentWorkflowState` / `DecisionTrace`, formatting standard Cloud Deploy release IDs as `release-{service_name}-{stable_version}` (dots replaced with hyphens). If stable version is missing and cannot be determined, RollbackAgent strictly refuses execution and fails the workflow.
- **D-02:** Synchronous polling with configurable timeout — Rollback execution synchronously polls the Cloud Deploy rollout status (default 1s interval up to 10s in local/demo mode, configurable for prod) until reaching terminal state (`SUCCEEDED` or `FAILED`), ensuring execution completes before initiating verification.
- **D-03:** Stabilization delay + multi-iteration metric sampling — After rollout succeeds, Deploy Monitor Agent waits for a configurable stabilization cooldown (default 2s in test/demo mode) and then polls telemetry over 3–5 iterations at 1s intervals.
- **D-04:** Strict multi-metric recovery criteria — Verdict is classified as:
  - `recovered`: All 7 metric ratios drop below anomaly thresholds (<= 1.15x baseline for error rate, latency, CPU, memory, request rate, and zero crash/restart deltas).
  - `degraded`: One or more metrics remain anomalous above threshold.
  - `inconclusive`: Metrics query fails, telemetry data is unavailable, or timeout occurs.
- **D-05:** Dual exporter architecture — Use `InMemorySpanExporter` / `ConsoleSpanExporter` when `DEPLOYGUARD_MOCK_GCP=true` (fast local test assertions and demo inspection) and Google Cloud Trace Exporter (`opentelemetry-exporter-gcp-trace`) when live GCP mode is enabled.
- **D-06:** Unified root trace per deployment — Structure a single root trace (`deployguard.deployment`) keyed by `deployment_id`, with distinct child spans for each agent phase (`monitor.detect`, `decision.evaluate`, `rollback.execute`, `monitor.verify_recovery`), injecting standard W3C TraceContext into ADK session state and log records.
- **D-07:** Two-tier defense & refusal auditing — (1) `AgentGateway` tool decorator strictly restricts rollback execution tools to the `rollback-agent` IAM identity, AND (2) `RollbackAgent` checks for an authorized, policy-passing `DecisionTrace` (`decision == "rollback"`, `authorized == True`, `policy_passed == True`) in workflow state before invocation. Unauthorized or policy-blocked attempts set `rollback_authorized=False`, update workflow status to `failed`, and write an auditable `DENIED` trace entry.

### the agent's Discretion
- Cloud Deploy LRO backoff and timeout configuration defaults for live GCP runs.
- OpenTelemetry span attribute naming conventions (`deployguard.service`, `deployguard.version`, `deployguard.verdict`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROLL-01 | Rollback Agent executes approved rollback via Cloud Deploy, targeting the last known stable version. | Cloud Deploy client rollout creation (`create_rollout`), release naming convention `release-{service}-{version}`, and synchronous state polling. |
| ROLL-02 | After rollback, Deploy Monitor Agent re-checks metrics to verify recovery; outcome is written to workflow state and triggers Postmortem Agent. | Recovery verification engine with stabilization delay, multi-iteration 7-dimension metric evaluation against baselines, and state persistence. |
| ROLL-03 | Rollback is blocked when policy checks fail (low confidence, insufficient deployment age, no stable version, environment restriction). | Gateway permission enforcement and RollbackAgent pre-execution policy check (`DecisionTrace.policy_passed == True` & `authorized == True`). |
| POST-03 | All agent actions emit OpenTelemetry traces that can be correlated with Cloud Monitoring metrics and Cloud Logging entries. | OpenTelemetry tracer provider with dual exporter (Cloud Trace vs InMemory), unified root span keyed by `deployment_id`, and W3C TraceContext propagation. |
</phase_requirements>

---

## 1. Architecture & Technical Breakdown

### 1.1 Rollback Agent Execution & Cloud Deploy Integration (ROLL-01, ROLL-03)
- **Component:** `RollbackAgent` (`src/deployguard/agents/rollback.py`) & `LiveCloudDeployClient` (`src/deployguard/cloud/deploy_client.py`).
- **Authorization Flow:**
  1. Retrieve `DeploymentWorkflowState` from ADK `ctx.session.state`.
  2. Verify `state.decision_trace`:
     - Must be non-null.
     - `decision_trace.decision == "rollback"`.
     - `decision_trace.policy_passed is True`.
     - `decision_trace.authorized is True`.
  3. If check fails:
     - Mark `state.rollback_authorized = False`.
     - Mark `state.rollback_executed = False`.
     - Set `state.pipeline_status = "failed"`.
     - Yield `Event` describing policy refusal reason and record `DENIED` audit trace.
  4. If check passes:
     - Mark `state.rollback_authorized = True`.
     - Resolve target stable release ID: formatting `release-{service_name}-{stable_version}`.
     - Call Cloud Deploy client `execute_rollback(release_id=..., target_id=..., delivery_pipeline_id=...)`.
     - Poll rollout status until `SUCCEEDED` or `FAILED` with configurable timeout.
     - On success: set `state.rollback_executed = True`, `state.rollback_target_version = stable_version`, `state.rollback_operation_id = op_id`, `state.pipeline_status = "verifying_recovery"`.

### 1.2 Recovery Verification Loop (ROLL-02)
- **Component:** `DeployMonitorAgent.verify_recovery(ctx)` or recovery verification loop.
- **Workflow:**
  1. Check `state.pipeline_status == "verifying_recovery"` or invocation parameter.
  2. Cooldown stabilization: `asyncio.sleep(stabilization_seconds)` (configurable, default 2s in test/dev).
  3. Sampling loop: Perform $N$ iterations (default 3 iterations, 1s interval) fetching all 7 metric dimensions from `MetricsSource`.
  4. Compare sampled metrics against `state.baseline_metrics` using `compare_metrics()`.
  5. Compute verdict:
     - `recovered`: All 7 dimensions within $\le 1.15\times$ baseline, 0 crashes/restarts across all iterations.
     - `degraded`: One or more metrics still exceed anomaly threshold in final iterations.
     - `inconclusive`: Metric fetch throws an exception, returns empty, or times out.
  6. Update state: `state.recovery_verdict = verdict`, `state.recovery_checked_at = datetime.now(UTC)`, `state.pipeline_status = "complete"` (if recovered) or `"failed"` (if degraded/inconclusive).

### 1.3 Distributed Tracing & OpenTelemetry Telemetry (POST-03)
- **Component:** `src/deployguard/telemetry/tracer.py`
- **Exporter Setup:**
  - When `DEPLOYGUARD_MOCK_GCP=true` (or in test environment): Use `InMemorySpanExporter` and/or `ConsoleSpanExporter`.
  - When `DEPLOYGUARD_MOCK_GCP=false`: Use `CloudTraceSpanExporter` from `opentelemetry.exporter.gcp_trace`.
- **Span Hierarchy:**
  ```
  [deployguard.deployment] (trace_id / deployment_id)
    ├── [monitor.detect] (attributes: service, version, anomaly_severity, affected_metrics)
    ├── [decision.evaluate] (attributes: decision, confidence, policy_passed, authorized)
    ├── [rollback.execute] (attributes: target_version, rollout_id, operation_id)
    └── [monitor.verify_recovery] (attributes: recovery_verdict, checks_count)
  ```
- **Trace Context Propagation:**
  - W3C TraceContext headers injected into ADK `ctx.session.state["trace_context"]` so subsequent agents resume the parent span.

---

## 2. Dependencies & Don't-Hand-Roll Analysis

| Capability | Library / Module | Status |
|------------|------------------|--------|
| OpenTelemetry API & SDK | `opentelemetry-api>=1.25`, `opentelemetry-sdk>=1.25` | In pyproject.toml |
| GCP Cloud Trace Exporter | `opentelemetry-exporter-gcp-trace>=1.6` | Standard GCP exporter |
| Cloud Deploy Client | `google-cloud-deploy>=1.18` | In pyproject.toml |
| Metric Thresholds & Comparison | `deployguard.cloud.metrics` | Existing reusable module |
| Agent Gateway | `deployguard.security.gateway` | Existing reusable module |

---

## 3. Validation Architecture (Nyquist Framework)

### Automated Test Matrix
1. `tests/test_rollback.py`:
   - `test_rollback_agent_authorized_execution`: Validates rollback executes via Cloud Deploy stub when decision trace is authorized.
   - `test_rollback_agent_policy_blocked_refusal`: Validates rollback strictly refused when policy checks fail (`policy_passed=False`).
   - `test_rollback_agent_missing_decision_trace`: Validates refusal when no decision trace exists.
   - `test_rollback_gateway_permission_denial`: Validates `AgentGateway` blocks non-rollback agents from calling `request_deployment_rollback`.
2. `tests/test_recovery.py`:
   - `test_recovery_verification_recovered`: Validates recovery verdict when metrics return to baseline ratios $\le 1.15\times$.
   - `test_recovery_verification_degraded`: Validates degraded verdict when error/latency metrics remain elevated.
   - `test_recovery_verification_inconclusive`: Validates inconclusive verdict on telemetry query failure.
3. `tests/test_telemetry.py`:
   - `test_opentelemetry_tracer_initialization_mock`: Validates `InMemorySpanExporter` receives spans in mock mode.
   - `test_opentelemetry_span_hierarchy`: Validates root `deployguard.deployment` span contains child spans for monitor, decision, rollback, and recovery.
   - `test_trace_context_propagation`: Validates trace context correctly passed through workflow state.

---

## 4. Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Cloud Deploy Client & Rollback Execution | HIGH | Clear interfaces in place (`LiveCloudDeployClient`, `MockCloudDeploy`, `BaseDeployGuardAgent`). |
| Recovery Verification Loop | HIGH | `MetricsSource` and `compare_metrics` already battle-tested in Phase 2; recovery adds stabilization cooldown + multi-iteration threshold check. |
| OpenTelemetry Instrumentation | HIGH | Standard OpenTelemetry SDK patterns with dual exporter configuration. |
| Gateway Security Enforcement | HIGH | Gateway decorator already active across ADK tools from Phase 4. |

### Ready for Planning
Technical research is complete. Planner can now generate `05-01-PLAN.md`, `05-02-PLAN.md`, and `05-03-PLAN.md`.
