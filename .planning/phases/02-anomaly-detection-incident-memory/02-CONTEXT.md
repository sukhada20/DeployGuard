# Phase 2: Anomaly Detection & Incident Memory - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 implements the real telemetry collection and storage operations:
1. **Deploy Monitor Agent**: Polls mock metrics and baseline data (via protocol-compatible `MetricsSource`) to calculate anomalies.
2. **Incident Memory Agent**: Integrates with Firestore (using protocol-compatible `DocumentStore`) to store incident events, signals, and postmortems.
3. **Log Sanitization Layer**: Pre-processes raw logs to strip PII and block prompt injection patterns.

</domain>

<decisions>
## Implementation Decisions

### Anomaly Baseline Strategy
- **D-01:** **Configurable ratio-threshold check** — Metrics are compared against baselines using configurable tolerance ratios (e.g. `current_value > baseline * error_ratio_threshold`). This keeps checks lightweight and avoids the complexity of timeseries database dependencies or statistical computations in Phase 2. — **Reversibility:** reversible — threshold values and logic are contained within the `DeployMonitorAgent` validation checks.

### Log Sanitization Approach
- **D-02:** **Multi-stage local sanitization** — Sanitization runs locally in two stages:
  1. **Regex Redaction**: Redacts PII including emails, IPs, API tokens, passwords, and secrets.
  2. **Keyword/Pattern Scanning**: Scans logs for prompt injection indicators (e.g. "ignore previous instructions", "system override").
  This provides cheap, fast, and local screening of untrusted logs before they are presented to LLM paths. — **Reversibility:** reversible — regex patterns and keyword dictionaries can be updated independently of the agent pipeline.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, active requirements, and key decisions (GCP services, specialized agents)
- `.planning/REQUIREMENTS.md` — v1 requirements (ANOM-01, ANOM-02, ANOM-03, MEM-01, MEM-03, SEC-01)
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and plans (02-01 through 02-04)

### Prior Phase Context
- `.planning/phases/01-project-foundation-simulation-layer/01-CONTEXT.md` — Decisions on Protocol-driven stubs, async methods, and fixture-driven tests

### Existing Implementation
- `src/deployguard/agents/deploy_monitor.py` — Deploy Monitor Agent stub to be updated
- `src/deployguard/agents/incident_memory.py` — Incident Memory Agent stub to be updated
- `src/deployguard/cloud/stubs.py` — Cloud stubs (MockFirestore, MockMonitoring, MockLogging) defining the Protocol signatures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DeploymentWorkflowState` and `AnomalySignal` models in `src/deployguard/state/workflow.py` for structured anomaly output.
- `MockFirestore` and `MockMonitoring` stubs in `src/deployguard/cloud/stubs.py` for testing baseline comparisons and Firestore operations locally.
- Fixtures in `tests/fixtures.py` containing simulated anomalous metrics and malicious payloads to verify the sanitization and detection engine.

### Integration Points
- `DeployMonitorAgent` and `IncidentMemoryAgent` implementations under `src/deployguard/agents/`.
- Telemetry interfaces inside `src/deployguard/cloud/stubs.py` that will eventually map to Google Cloud client libraries.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Decisions focus on simple, fast local logic for ratio comparison and regex sanitization.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-anomaly-detection-incident-memory*
*Context gathered: 2026-08-29*
