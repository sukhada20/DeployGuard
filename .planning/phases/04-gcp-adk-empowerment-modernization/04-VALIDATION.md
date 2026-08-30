---
phase: 4
slug: gcp-adk-empowerment-modernization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pyproject.toml` |
| **Quick run command** | `pytest tests/test_adk_fleet.py tests/test_gcp_connectors.py tests/test_vector_search.py -q` |
| **Full suite command** | `pytest -q && make eval` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_adk_fleet.py tests/test_gcp_connectors.py tests/test_vector_search.py -q`
- **After every plan wave:** Run `pytest -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FLEET-01 | T-04-01 | Gateway tool decorator blocks unauthorized tool invocations | unit | `pytest tests/test_adk_fleet.py -k test_gateway_decorator` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | FLEET-02 | T-04-02 | ADK Agent manifest and schemas conform to Google ADK specification | unit | `pytest tests/test_adk_fleet.py -k test_adk_manifest` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | MEM-01 | T-04-03 | Synchronous embedding generation produces 768-dim vector | unit | `pytest tests/test_vector_search.py -k test_embeddings` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | MEM-02 | T-04-04 | Pre-filtered Firestore Vector Search filters by service and cosine distance | unit | `pytest tests/test_vector_search.py -k test_vector_search` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | GOV-01 | T-04-05 | Cloud Monitoring client builds valid ListTimeSeries filter and handles mock fallback | unit | `pytest tests/test_gcp_connectors.py -k test_monitoring_connector` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | SEC-02 | T-04-06 | Cloud Logging client builds LQL query and runs LogSanitizer pass | unit | `pytest tests/test_gcp_connectors.py -k test_logging_connector` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | FLEET-01 | T-04-07 | Eval dataset covers 4 categories and executes via pytest eval runner | integration | `pytest tests/test_evals.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_adk_fleet.py` — test stubs for ADK agent definitions and tool wrappers
- [ ] `tests/test_vector_search.py` — test stubs for Firestore vector search and embeddings
- [ ] `tests/test_gcp_connectors.py` — test stubs for live GCP telemetry clients with mock fallback
- [ ] `tests/test_evals.py` — pytest test runner for `evals/` dataset benchmarking

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live GCP Cloud Monitoring PromQL verification (optional cloud check) | GOV-01 | Requires active GCP project | `DEPLOYGUARD_MOCK_GCP=false gcloud auth application-default login && pytest tests/test_gcp_connectors.py` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-30
