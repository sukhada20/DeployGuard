---
plan: 04-03
phase: 04
status: complete
date: 2026-08-30
key-files:
  created:
    - src/deployguard/cloud/monitoring_client.py
    - src/deployguard/cloud/logging_client.py
    - src/deployguard/cloud/deploy_client.py
    - src/deployguard/cloud/factory.py
    - tests/test_gcp_connectors.py
---

# Plan 04-03 Summary — Google Cloud Native Telemetry & Service Connectors

## What Was Built

- **`monitoring_client.py`**: `LiveCloudMonitoringClient` with query builders translating 7 deployment dimensions into Google Cloud Monitoring `projects.timeSeries.list` filters and PromQL aggregations for Cloud Run services.
- **`logging_client.py`**: `LiveCloudLoggingClient` with `build_lql_filter` for structured LQL filters (`resource.type="cloud_run_revision" severity>=...`) and automatic pass-through of all queried log entries through `LogSanitizer` to redact credentials/PII and neutralize prompt injection attempts.
- **`deploy_client.py`**: `LiveCloudDeployClient` for rollback execution and declarative IAM least-privilege service account mappings (`AGENT_SERVICE_ACCOUNT_MAPPING`, `SERVICE_ACCOUNT_ROLES`).
- **`factory.py`**: Cloud connector factory resolving live GCP clients or falling back seamlessly to `MockMonitoring`, `MockLogging`, `MockCloudDeploy`, and `MockFirestore` when `DEPLOYGUARD_MOCK_GCP=true` or Application Default Credentials (ADC) are missing.
- **`test_gcp_connectors.py`**: 13 unit tests verifying metric filter generation, PromQL queries, LQL generation, payload sanitization, IAM mappings, and ADC fallback behavior.

## Key Files
- `src/deployguard/cloud/monitoring_client.py` — NEW: Live monitoring client + query builders
- `src/deployguard/cloud/logging_client.py` — NEW: Live logging client + LQL generator + sanitizer pass
- `src/deployguard/cloud/deploy_client.py` — NEW: Live Cloud Deploy client + IAM mappings
- `src/deployguard/cloud/factory.py` — NEW: Connector factory with ADC fallback
- `tests/test_gcp_connectors.py` — NEW: 13 unit tests

## Self-Check: PASSED
- [x] ListTimeSeries filter generator maps all 7 dimensions
- [x] PromQL query builder creates valid aggregations
- [x] Logging client sanitizes all payloads through LogSanitizer
- [x] Service account mappings and least-privilege roles defined
- [x] Factory gracefully falls back to mock stubs
- [x] 13/13 unit tests pass

## Deviations
None.

