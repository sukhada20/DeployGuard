---
phase: 7
slug: end-to-end-demo-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-30
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + npm build |
| **Config file** | `pyproject.toml`, `web/package.json` |
| **Quick run command** | `uv run python -m pytest tests/test_e2e_pipeline.py tests/test_security_scenarios.py -v` |
| **Full suite command** | `make verify` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test command
- **After every plan wave:** Run `make verify` (lint + typecheck + pytest + evals + web build)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DEMO-01 | — | N/A | unit | `uv run python -m pytest tests/test_e2e_pipeline.py -v` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | DEMO-01 | — | N/A | integration | `python -m deployguard.demo --ci` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | DEMO-01 | T-07-01 | Gateway rejects unauthorized rollback | security | `uv run python -m pytest tests/test_security_scenarios.py -k test_gateway_denial -v` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | DEMO-01 | T-07-02 | Multi-stage sanitization neutralizes prompt injection | security | `uv run python -m pytest tests/test_security_scenarios.py -k test_prompt_injection -v` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | DEMO-01 | — | Full pipeline state integrity | e2e | `uv run python -m pytest tests/test_e2e_pipeline.py -v` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 2 | DEMO-01 | — | Quality gate enforcement | ci | `make verify` | ✅ | ⬜ pending |
| 07-04-01 | 04 | 2 | DEMO-01 | — | Documentation completeness | doc | `test -f README.md && test -f DEMO.md && test -f docs/DEPLOYMENT.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_e2e_pipeline.py` — full autonomous lifecycle integration test
- [ ] `tests/test_security_scenarios.py` — security scenario test suite

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Interactive Demo Pauses | DEMO-01 | Requires human Enter keypress | Run `make demo` in terminal and observe stage pauses |
| Operator Dashboard SSE Animation | DEMO-01 | Visual UI inspection | Open browser at `http://localhost:8000` while running `make demo` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
