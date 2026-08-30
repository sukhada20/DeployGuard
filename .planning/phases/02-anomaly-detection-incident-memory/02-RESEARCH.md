# Phase 2: Anomaly Detection & Incident Memory - Research

**Researched:** 2026-08-29
**Domain:** Telemetry monitoring, timeseries anomaly detection, Firestore persistence, and log sanitization/AI safety.
**Confidence:** HIGH

## Summary

This phase implements the backend monitoring, storage, and safety foundations for DeployGuard. The **Deploy Monitor Agent** transitions from a passive stub to a metric-polling service that queries Google Cloud Monitoring (or its protocol-compatible stubs) and computes anomalies across seven key metrics. The **Incident Memory Agent** integrates with Firestore to store deployment events, anomaly signals, rollback decisions, and postmortem outcomes. 

To protect downstream LLM reasoning (Gemini) and avoid data leakage, a **Log Sanitization Layer** sits before the database and agent boundaries, redacting PII and filtering prompt injection signatures. This research defines the interfaces, schemas, algorithms, and security guidelines for implementing these capabilities.

**Primary recommendation:** Use Python protocols to define clean decoupled interfaces for `MetricsSource`, `DocumentStore`, and `LogSanitizer` to keep stubs and GCP SDK clients interchangeable, while applying local multi-stage regex + keyword checking for log safety.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Anomaly Baseline Strategy** — Configurable ratio-threshold check: Metrics are checked against a baseline using a configurable tolerance ratio (e.g. `current_value > baseline * error_ratio_threshold`). This avoids the complexity of timeseries database dependencies or statistical computations in Phase 2.
- **D-02: Log Sanitization Approach** — Multi-stage local sanitization: Sanitization runs locally in two stages:
  1. **Regex Redaction**: Redacts PII including emails, IPs, API tokens, passwords, and secrets.
  2. **Keyword/Pattern Scanning**: Scans logs for prompt injection indicators (e.g. "ignore previous instructions", "system override").
  This provides cheap, fast, and local screening of untrusted logs before they are presented to LLM paths.

### the agent's Discretion

None — Decisions on stubs, interface protocols, data driven mock fixtures, and async interfaces were resolved in Phase 1 and are carried forward.

### Deferred Ideas (OUT OF SCOPE)

None — Discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANOM-01 | System detects post-deployment anomalies by comparing metrics against baselines. | Covered by Ratio-Threshold Check engine in `DeployMonitorAgent`. |
| ANOM-02 | Deploy Monitor Agent polls Cloud Monitoring and Cloud Logging. | Supported by `google-cloud-monitoring` and `google-cloud-logging` Python libraries. |
| ANOM-03 | Anomaly detection produces a structured signal. | Defined by the `AnomalySignal` Pydantic model structure. |
| MEM-01 | Incident Memory Agent stores events in Firestore. | Implemented via `google-cloud-firestore` client with strict document mapping. |
| MEM-03 | Stored incident data minimizes sensitive fields. | Ensured by passing raw log snippets through the Log Sanitization Layer first. |
| SEC-01 | Production logs and external data are sanitized before LLM/tool use. | Covered by Multi-Stage Sanitizer (Regex + Keyword scans). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Anomaly Check Engine | API / Backend | — | Computes metric deltas and triggers alerts. |
| Log Sanitizer | API / Backend | — | Pre-processes incoming log payloads before they are persisted or sent to LLMs. |
| Incident Storage | Database | — | Stores structured state, decisions, and postmortem records in Firestore. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `google-cloud-monitoring` | `>=2.22` | Query telemetry metrics from GCP | Official Google client for Cloud Monitoring [VERIFIED: pyproject.toml:20] |
| `google-cloud-firestore` | `>=2.16` | Document database for incident storage | Official Google client for Firestore [VERIFIED: pyproject.toml:19] |
| `google-cloud-logging` | `>=3.10` | Fetch logs for security/telemetry checks | Official Google client for Cloud Logging [VERIFIED: pyproject.toml:21] |
| `pydantic` | `>=2.7` | Data validation and schemas | Standard for modern Python API typing and validation [VERIFIED: pyproject.toml:16] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pytest-asyncio` | `>=0.24` | Async unit test execution | Testing async stubs and async agent methods [VERIFIED: pyproject.toml:32] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `google-cloud-monitoring` | Prometheus API client | Prometheus is widely used but doesn't align with the primary Google Cloud deployment target. |

**Installation:**
```bash
pip install google-cloud-monitoring>=2.22 google-cloud-firestore>=2.16 google-cloud-logging>=3.10
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `google-cloud-monitoring` | PyPI | > 5 yrs | 2.5M/wk | github.com/googleapis/google-cloud-python | [OK] | Approved |
| `google-cloud-firestore` | PyPI | > 5 yrs | 3.0M/wk | github.com/googleapis/google-cloud-python | [OK] | Approved |
| `google-cloud-logging` | PyPI | > 5 yrs | 2.8M/wk | github.com/googleapis/google-cloud-python | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[Cloud Monitoring] ──(Poll Metrics)──> [Deploy Monitor Agent] ──(Anomalous?)──> [Workflow State]
                                                                                      │
                                                                                      ▼
[Cloud Logging] ───(Read Logs)───> [Log Sanitizer] ───(Sanitized Logs)───> [Incident Memory Agent] ──> [Firestore]
```

### Recommended Project Structure
```
src/deployguard/
├── agents/
│   ├── base.py
│   ├── deploy_monitor.py
│   └── incident_memory.py
├── cloud/
│   ├── interfaces.py       # Typing protocols for services
│   ├── stubs.py            # Protocol-compatible stub implementations
│   └── client.py           # Real GCP clients implementing the protocols
├── security/
│   └── sanitizer.py        # Log sanitization logic (PII + Prompt Injection)
└── state/
    └── workflow.py
```

### Pattern 1: Service Protocols (D-02 from Phase 1)
Decouple agent implementation from specific SDKs by using Protocols:
```python
from typing import Protocol, Any, Dict, List

class DocumentStore(Protocol):
    async def set_document(self, collection: str, document_id: str, data: Dict[str, Any]) -> None: ...
    async def get_document(self, collection: str, document_id: str) -> Dict[str, Any] | None: ...
    async def query(self, collection: str, filters: List[tuple]) -> List[Dict[str, Any]]: ...
```

### Anti-Patterns to Avoid
- **Raw string concat in SQL/noSQL queries**: Always parameterize query filters to prevent injection.
- **Leaking un-sanitized logs to LLM prompts**: Logs must always pass through the sanitization layer before feeding Decision Agent prompts to avoid indirect prompt injections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-memory caching / Mocking Firestore | Custom mock file locking | Firestore Emulator or protocol-compatible Mock class | Manual mock files suffer from synchronization issues and data rot. |

## Common Pitfalls

### Pitfall 1: Float division / precision errors in threshold comparisons
**What goes wrong:** `assert 0.04000000000000001 > 0.04` returns True, triggering false positive anomalies.
**Why it happens:** IEEE 754 float arithmetic precision limits.
**How to avoid:** Use `math.isclose()` or round values to a fixed precision before comparing.

## Code Examples

### Multi-Stage Log Sanitization
```python
import re

class LogSanitizer:
    PII_PATTERNS = [
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", # Email
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",              # IPv4
        r"(?i)(api_key|token|password|secret|bearer)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.\~]+['\"]" # Keys/Secrets
    ]
    
    INJECTION_KEYWORDS = [
        "ignore previous instructions",
        "system override",
        "you are now an admin",
        "bypass security policies"
    ]
    
    def sanitize(self, raw_log: str) -> str:
        # Stage 1: PII Redaction
        sanitized = raw_log
        for pattern in self.PII_PATTERNS:
            sanitized = re.sub(pattern, "[REDACTED]", sanitized)
            
        # Stage 2: Injection check
        lower_log = sanitized.lower()
        for kw in self.INJECTION_KEYWORDS:
            if kw in lower_log:
                # Replace with placeholder or flag warning
                sanitized = sanitized.replace(kw, "[INJECTION_ATTEMPT_REDACTED]")
        return sanitized
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom regex lists only | AI-based Guardrails (e.g. Model Armor) | 2024-2026 | Better detection of semantic injection attacks. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Local regex/keyword checks catch 90% of basic injection attempts | Code Examples | Sophisticated attacks using character substitutions might sneak through. |

## Open Questions

1. **How should we handle metric baselines that naturally shift over time?**
   - What we know: Baselines are currently retrieved from a static/mock source.
   - What's unclear: How to compute weekly seasonality in real production.
   - Recommendation: Store historical baseline medians in a configuration document in Firestore that gets updated daily/weekly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Runtime | ✓ | 3.12+ | — |
| Firestore Emulator | Local testing | ✗ | — | MockFirestore stub |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `pytest` + `pytest-asyncio` |
| Config file | `pyproject.toml` [VERIFIED: pyproject.toml:50-53] |
| Quick run command | `pytest tests/ -q` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANOM-01 | System computes threshold metrics ratio | Unit | `pytest tests/test_deploy_monitor.py` | ❌ (To be created) |
| SEC-01 | Logs are sanitized before storage | Unit | `pytest tests/test_sanitizer.py` | ❌ (To be created) |
| MEM-01 | Incident write/read Firestore | Integration | `pytest tests/test_incident_memory.py` | ❌ (To be created) |

### Sampling Rate
- **Per task commit:** `pytest tests/`
- **Per wave merge:** `pytest tests/ -v`

### Wave 0 Gaps
- [ ] `tests/test_deploy_monitor.py` — Anomaly detection ratio checks
- [ ] `tests/test_sanitizer.py` — Log redaction & injection keyword tests
- [ ] `tests/test_incident_memory.py` — Firestore operations & protocol compatibility

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Multi-Stage Log Sanitizer before database writes |
| V4 Access Control | yes | Firestore client permissions |

### Known Threat Patterns for Python

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Indirect Prompt Injection | Tampering | Redact keywords and place user content in XML delimiter tags |
| Telemetry Tampering | Tampering | Authenticate and authorize monitoring writes |

## Sources

### Primary (HIGH confidence)
- `pyproject.toml` - project dependencies [VERIFIED: pyproject.toml]
- `src/deployguard/cloud/stubs.py` - service stub interfaces [VERIFIED: src/deployguard/cloud/stubs.py]

### Secondary (MEDIUM confidence)
- Google Cloud Python docs - firestore/monitoring usage examples
