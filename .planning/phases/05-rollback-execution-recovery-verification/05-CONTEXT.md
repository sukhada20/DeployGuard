# Phase 5 Context — Rollback Execution & Recovery Verification

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 implements rollback execution and recovery verification:
1. **Rollback Agent**: Authorizes execution against the gateway, calls the `MockCloudDeploy` service using the formatted stable release ID.
2. **Recovery Verification Loop**: Deploy Monitor Agent polls telemetry metrics (using `MetricsSource`) after a rollback, computing a recovery verdict (`recovered` / `degraded` / `inconclusive`).
3. **OpenTelemetry Trace Instrumentation**: Emits trace spans for deployment events, anomalies, decisions, rollbacks, and recovery checks.
</domain>

<decisions>
## Implementation Decisions

### 1. Release ID Mapping
- **D-01:** **Standard release ID format** — Targets stable release versions are formatted using the template: `release-{service_name}-{stable_version}` (with dots replaced by hyphens, e.g. `release-payment-service-1-0-0`), keeping release IDs unique and auditable. — **Reversibility:** reversible — formatting function is centralized and local.

### the agent's Discretion
- **Verification Polling Window**: Default polling loop of every 1 second for a maximum of 5 iterations (5 seconds total runtime) to enable fast testing/demos, configurable via app settings/environment.
- **Recovery Verdict Criteria**: Verdict is `recovered` if all metrics return to baseline * ratio check limits; `degraded` if some metrics remain anomalous; `inconclusive` if metrics query fails or throws errors.
- **OpenTelemetry trace structure**: OpenTelemetry trace spans emit details for `deploy`, `anomaly`, `decision`, `rollback`, and `recovery` steps, propagating standard trace context headers.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- `.planning/PROJECT.md` — Core value, active requirements, and key decisions
- `.planning/REQUIREMENTS.md` — Project requirement definitions (ROLL-01, ROLL-02, ROLL-03, POST-03)
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and plans (05-01 through 05-03)

### Existing Implementation & Context
- `.planning/phases/03-decisioning-engine-governance/03-CONTEXT.md` — Decisioning engine rules, LLM capped logic, and Agent Gateway structure
- `src/deployguard/agents/rollback.py` — Rollback Agent base class and stub to be updated
- `src/deployguard/cloud/interfaces.py` — Service protocols defining stubs and cloud clients
- `src/deployguard/cloud/stubs.py` — MockCloudDeploy and MockMonitoring stubs
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MockCloudDeploy` in `src/deployguard/cloud/stubs.py` for simulated rollback operations.
- `MockMonitoring` in `src/deployguard/cloud/stubs.py` for fetching telemetry metrics.

### Established Patterns
- decopled Protocol boundaries: implement `DeploymentManager` protocol matching `MockCloudDeploy` in `src/deployguard/cloud/interfaces.py`.

### Integration Points
- `RollbackAgent` executing rollbacks using `AgentGateway` authorization check.
- `DeployMonitorAgent` re-polling metrics to determine post-rollback system status.
</code_context>

<specifics>
## Specific Ideas
No specific requirements — open to standard approaches.
</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.
</deferred>

---

*Phase: 05-rollback-execution-recovery-verification*
*Context gathered: 2026-08-29*
