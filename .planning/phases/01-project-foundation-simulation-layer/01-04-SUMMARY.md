# Plan 01-04 Summary — Cloud Service Stubs

**Phase**: 01 — Project Foundation & Simulation Layer
**Plan**: 01-04
**Status**: ✅ Complete
**Completed**: 2026-08-23

## What Was Built

- `src/deployguard/cloud/stubs.py` — Protocol-compatible mock implementations for Google Cloud services:
  - `MockFirestore`: Simple in-memory document store with basic query support.
  - `MockMonitoring`: Metric storage and deterministic baseline generation (80% of current metric to easily trigger anomalies in tests).
  - `MockCloudDeploy`: Rollback tracking via `execute_rollback`.
  - `MockLogging`: Simple list-based log accumulator.
- `tests/fixtures.py` — Seed data for simulation testing:
  - `get_mock_baseline_metrics()`
  - `get_mock_anomalous_metrics()`
  - `get_malicious_log_payload()`: Specifically crafted for Phase 6 security demonstration, containing a simulated system override prompt injection.
- `tests/test_cloud.py` — Unit tests verifying stub behavior and fixture shapes.

## Verification Results

- ✅ `test_cloud.py` tests pass, correctly simulating interactions with GCP services without needing external network calls or emulators.
- ✅ Used `pytest.approx()` to prevent float precision errors in baseline metric assertions (`assert 0.04000000000000001 == 0.04` fixed).
- ✅ Ruff linters pass cleanly after addressing line-length constraints on the prompt injection string.

## Key Decisions

- Designed the stubs to be extremely lightweight, deferring the integration of the real `google-cloud-*` SDKs and the Firestore emulator to Phase 2. This guarantees 100% deterministic local tests in Phase 1.
- Kept the malicious log payload as a literal fixture to ensure we have a stable test case for the Model Armor implementation down the line.

## Next Plans

Wave 3:
- 01-05: Dev harness (Makefile, README, integration verification)
