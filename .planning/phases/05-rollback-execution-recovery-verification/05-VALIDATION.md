---
phase: 5
slug: rollback-execution-recovery-verification
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-30
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x + pytest-asyncio |
| **Config file** | `pyproject.toml` |
| **Quick run command** | `.venv/bin/pytest tests/test_rollback.py tests/test_recovery.py tests/test_telemetry.py` |
| **Full suite command** | `.venv/bin/pytest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `.venv/bin/pytest tests/test_rollback.py tests/test_recovery.py tests/test_telemetry.py`
- **After every plan wave:** Run `.venv/bin/pytest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ROLL-01, ROLL-03 | T-05-01 | Gateway rejects non-rollback callers; RollbackAgent verifies decision trace | unit | `.venv/bin/pytest tests/test_rollback.py` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | ROLL-01 | — | Executes rollback rollout targeting stable release ID format | integration | `.venv/bin/pytest tests/test_rollback.py -k test_rollback_execution` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | ROLL-02 | — | Stabilization wait and multi-iteration 7-dimension metric evaluation | integration | `.venv/bin/pytest tests/test_recovery.py` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | ROLL-02 | — | Correctly issues recovered / degraded / inconclusive verdicts | unit | `.venv/bin/pytest tests/test_recovery.py -k test_recovery_verdict` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | POST-03 | — | Dual exporter (InMemory vs GCP Trace) and root-to-child span hierarchy | integration | `.venv/bin/pytest tests/test_telemetry.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_rollback.py` — test harness for Rollback Agent and Cloud Deploy execution
- [ ] `tests/test_recovery.py` — test harness for recovery verification loop
- [ ] `tests/test_telemetry.py` — test harness for OpenTelemetry dual exporter and spans

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-30
