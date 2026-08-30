# Phase 3: Decisioning Engine & Governance - Research

**Researched:** 2026-08-29
**Domain:** Policy evaluation, LLM prompt engineering, Model Armor wrappers, API Gateway authorization, and Firestore audit tracing.
**Confidence:** HIGH

## Summary

This phase implements the governance and decision-making capabilities of DeployGuard. The **Decision Agent** synthesizes anomalous signals from the Deploy Monitor Agent and retrieves historical context from the Incident Memory Agent. It then queries the Gemini LLM for recommendations and runs a deterministic configuration-based policy engine to authorize rollbacks safely. 

To protect the LLM from indirect injection and data leaks, a **Model Armor / Guardrails wrapper** is placed around the prompt. All actions and evaluations are auditable through the **Agent Gateway** and written to Firestore as a structured `DecisionTrace`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Config-Driven JSON/YAML Policy** — Policies (severity thresholds, environment rules, confidence scores) will be loaded from a configuration file and evaluated deterministically at runtime.
- **D-02: LLM Reasoning Integration & Model Armor** — Hybrid model where Gemini is consulted for reasoning, but its recommendations are strictly capped/filtered by deterministic policy check results.
- **D-03: Agent Gateway Authorization** — Registry-bounded gateway checks the calling agent's `agent_id` against the Agent Registry.
- **D-04: Decision Trace Schema** — Audit traces are persisted in a `"traces"` collection in Firestore, keyed by `deployment_id`.

### Deferred Ideas

None.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOV-01 | Policies (severity, age, environment) evaluated deterministically. | Covered by the JSON/YAML Config Policy Engine. |
| GOV-02 | Decision Agent retrieves similar historical incidents. | Supported by `IncidentMemoryAgent` query interfaces. |
| GOV-03 | Gemini LLM called with sanitized context and Model Armor protections. | Supported by `google-genai` and local Model Armor filtering stub. |
| GOV-04 | Decision traces recorded and persisted in Firestore. | Covered by `DocumentStore` writes to the `"traces"` collection. |
| FLEET-03 | Agent Gateway verifies identity and permissions before sensitive tool calls. | Supported by registry authorization middleware. |
| FLEET-04 | Agent Registry permissions checks. | Handled via in-memory or database registry store filters. |
| SEC-02 | Safe prompt formatting with XML/Markdown delimiters. | Mitigates indirect injection by scoping user logs. |
| SEC-03 | Model Armor safety screening. | Local Model Armor adapter redacts malicious tokens. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Agent Gateway | Middleware / Wrapper | — | Enforces credentials and least privilege before executing operations. |
| Policy Rules Engine | API / Domain | — | Deterministically evaluates thresholds against config limits. |
| LLM Client | API / Integration | — | Invokes Gemini LLM with structured safety wraps and delimiters. |
| Audit Persistence | Database | — | Writes traces to Firestore. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `google-genai` | `>=0.1` | Query Gemini models | Official SDK for Gemini Developer API [VERIFIED] |
| `google-cloud-firestore` | `>=2.16` | Document store for traces | Official Google client for Firestore [VERIFIED] |
| `pydantic` | `>=2.7` | Validation and serialization | Standard for Python type safety and JSON parsing [VERIFIED] |

**Installation:**
```bash
pip install google-genai>=0.1 google-cloud-firestore>=2.16
```

---

## Architecture Patterns

### System Flow Diagram

```
[Deploy Monitor] ────> [Anomaly Signal] ────┐
                                             ▼
[Incident Memory] ───> [Past Incidents] ───> [Decision Agent] ──(Query)──> [Model Armor Wrapper] ──> [Gemini LLM]
                                             │                                                      │
                                             │                                                      ▼
                                             ├───────────────────────────────────────────── [LLM Verdict]
                                             ▼
                                     [Policy Rules Engine] ──(Deterministic Capping)
                                             │
                                             ▼
[Gateway Execution Request] ────────> [Agent Gateway] ────(Authorized?)────> [Rollback Action]
                                             │
                                             ▼
                                     [Firestore: traces]
```

### Pattern 1: Structured Prompt Formatting (SEC-02)
To prevent indirect prompt injection from production logs, prompts must place logs/telemetry inside explicit XML tags:
```python
def build_prompt(context: dict, logs: str) -> str:
    return f"""You are the DeployGuard Decision Assistant. Analyze the system state and determine if rollback is needed.

<system_state>
Service: {context['service_name']}
Environment: {context['environment']}
Anomaly Severity: {context['anomaly_severity']}
Affected Metrics: {context['affected_metrics']}
</system_state>

<untrusted_logs>
{logs}
</untrusted_logs>

Response format MUST be JSON: {{"recommendation": "rollback|wait|alert", "confidence": float, "reasoning": "string"}}
"""
```

### Pattern 2: Agent Gateway Registry Enforcement (FLEET-03)
Enforce authorization using the agent registry permissions:
```python
class AgentGateway:
    def __init__(self, registry_store, document_store):
        self.registry = registry_store
        self.db = document_store
        
    async def authorize_action(self, agent_id: str, action: str) -> bool:
        agent = await self.registry.get_agent(agent_id)
        if not agent or agent.status != "active":
            return False
        return action in agent.permissions
```

---

## Anti-Patterns to Avoid
- **Implicit trust in LLM outputs**: Never let the LLM execute actions directly. The gateway and rules engine must act as final deciders.
- **Exposing raw passwords/PII to LLM prompts**: Logs must be sanitized *before* prompt assembly.

---

## Common Pitfalls

### Pitfall 1: Model Armor / Gemini Timeout during high-severity incidents
**What goes wrong:** Critical latency anomaly causes network congestion; LLM queries time out, blocking rollback logic.
**How to avoid:** Always set a strict timeout (e.g., 3-5 seconds) on Gemini/Model Armor queries. If the LLM call times out, fall back safely to deterministic rules only.

---

## Code Examples

### Policy Engine Evaluation
```python
class PolicyEngine:
    def __init__(self, policy_config: dict):
        self.config = policy_config

    def evaluate(self, state: dict) -> dict:
        checks = {}
        # 1. Environment policy
        env = state.get("environment", "production")
        env_policy = self.config.get("environments", {}).get(env, {})
        
        # 2. Stable version check
        has_stable = state.get("rollback_target_version") is not None
        checks["has_stable_version"] = has_stable
        
        # 3. Severity check
        severity = state.get("anomaly_severity", "LOW")
        allowed_severities = env_policy.get("allowed_auto_rollback_severities", [])
        checks["severity_allowed"] = severity in allowed_severities
        
        passed = all(checks.values())
        return {
            "policy_passed": passed,
            "checks": checks
        }
```

---

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| Firestore | Trace storage | ✓ | MockFirestore stub |
| Gemini API | LLM Reasoning | ✓ | Stubbed GenAI client |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `pytest` + `pytest-asyncio` |
| Config file | `pyproject.toml` [VERIFIED] |
| Quick run command | `pytest tests/ -q` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| GOV-01 | Rules engine evaluates JSON configs | Unit | `pytest tests/test_gateway.py` |
| GOV-03 | Gemini wrapped with safety model | Unit | `pytest tests/test_decision.py` |
| FLEET-03 | Gateway blocks unauthorized actions | Integration | `pytest tests/test_gateway.py` |

### Wave 0 Gaps
- [ ] `tests/test_gateway.py` — Agent Gateway identity & JSON rules engine checks
- [ ] `tests/test_decision.py` — Gemini mock wrapper and Model Armor checks
