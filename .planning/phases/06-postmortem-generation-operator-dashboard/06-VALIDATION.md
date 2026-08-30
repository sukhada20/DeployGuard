---
phase: 06
slug: postmortem-generation-operator-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-30
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + Next.js build / lint + Obscura CLI |
| **Config file** | `pyproject.toml` (Python backend) / `web/package.json` (Frontend) |
| **Quick run command** | `pytest tests/test_postmortem_agent.py tests/test_dashboard_api.py -v` |
| **Full suite command** | `pytest && npm --prefix web run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_postmortem_agent.py tests/test_dashboard_api.py -v`
- **After every plan wave:** Run `pytest && npm --prefix web run build`
- **Before `/gsd-verify-work`:** Full test suite & frontend build must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | POST-01 | — | PostmortemReport schema & serialization | unit | `pytest tests/test_postmortem_agent.py -k test_report_schema` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | POST-01 | T-06-01 | Graceful deterministic fallback on LLM failure | unit | `pytest tests/test_postmortem_agent.py -k test_fallback` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | POST-01 | — | Firestore postmortem storage & markdown export | integration | `pytest tests/test_postmortem_agent.py -k test_firestore_storage` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | POST-02 | — | Dashboard REST API endpoints (overview, metrics, traces) | integration | `pytest tests/test_dashboard_api.py -k test_rest_endpoints` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | POST-02 | — | SSE real-time event broadcaster streaming | integration | `pytest tests/test_dashboard_api.py -k test_sse_stream` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | POST-02 | — | Next.js + shadcn/ui scaffold and Mission Control header | build | `npm --prefix web run build` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | POST-02 | — | Live Operations & Telemetry view with Recharts + Anime.js | component | `npm --prefix web run build` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | POST-02 | — | Decision Trace Governance Stepper with GSAP animations | component | `npm --prefix web run build` | ❌ W0 | ⬜ pending |
| 06-04-02 | 04 | 2 | POST-02 | — | Postmortem Viewer with SRE layout and export buttons | component | `npm --prefix web run build` | ❌ W0 | ⬜ pending |
| 06-04-03 | 04 | 2 | POST-02 | — | Agent Fleet Registry view with IAM capability matrix | component | `npm --prefix web run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_postmortem_agent.py` — unit tests for PostmortemAgent and PostmortemReport
- [ ] `tests/test_dashboard_api.py` — tests for dashboard overview, metrics, traces, postmortems, and SSE stream
- [ ] `web/package.json` — Next.js, Tailwind, shadcn/ui, GSAP, Anime.js, Recharts dependencies setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time visual motion & GSAP animations | POST-02 | Visual smoothness and kinetic choreography validation | Run `obscura` or open `http://localhost:3000` in browser to observe live SSE ticks and GSAP transition effects |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-30
