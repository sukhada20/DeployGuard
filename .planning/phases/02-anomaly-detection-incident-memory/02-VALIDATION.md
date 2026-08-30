---
phase: 2
slug: anomaly-detection-incident-memory
status: active
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-asyncio |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/`
- **After every plan wave:** Run `pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | ANOM-01 | — | N/A | unit | `pytest tests/test_deploy_monitor.py` | ✅ Yes | ✅ green |
| 2-02-01 | 02 | 2 | ANOM-02, ANOM-03 | — | N/A | unit | `pytest tests/test_deploy_monitor.py` | ✅ Yes | ✅ green |
| 2-03-01 | 03 | 2 | MEM-01 | — | N/A | integration | `pytest tests/test_incident_memory.py` | ✅ Yes | ✅ green |
| 2-04-01 | 04 | 2 | SEC-01, MEM-03 | — | Redact PII and injection signatures | unit | `pytest tests/test_sanitizer.py` | ✅ Yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/test_deploy_monitor.py` — covers ANOM-01, ANOM-02, ANOM-03
- [x] `tests/test_sanitizer.py` — covers SEC-01, MEM-03
- [x] `tests/test_incident_memory.py` — covers MEM-01

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

**Approval:** approved

