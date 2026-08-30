---
phase: 3
slug: decisioning-engine-governance
status: active
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-29
---

# Phase 3 — Validation Strategy

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
| 3-01-01 | 01 | 1 | GOV-01, FLEET-03, FLEET-04 | — | Enforce policy limits and credentials | unit | `pytest tests/test_gateway.py` | ✅ Yes | ✅ green |
| 3-02-01 | 02 | 2 | GOV-03, SEC-02, SEC-03 | — | Wrap prompts with XML and Model Armor | unit | `pytest tests/test_decision.py` | ✅ Yes | ✅ green |
| 3-03-01 | 03 | 2 | GOV-02, GOV-01 | — | Pull historical incidents into context | unit | `pytest tests/test_decision.py` | ✅ Yes | ✅ green |
| 3-04-01 | 04 | 2 | GOV-04, MEM-02 | — | Store decision trace in traces collection | integration | `pytest tests/test_gateway.py` | ✅ Yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/test_gateway.py` — Agent Gateway permissions and policy rules tests
- [x] `tests/test_decision.py` — Gemini prompt wrapping and Decision Agent tests

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

