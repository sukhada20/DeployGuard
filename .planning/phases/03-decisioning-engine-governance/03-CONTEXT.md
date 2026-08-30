# Phase 3 Context — Decisioning Engine & Governance

## Domain
The Decision Agent aggregates telemetry anomalies and historical context, evaluates policies using a config-driven rules engine, queries Gemini for structured recommendations, and logs all audit outcomes to Firestore via the Agent Gateway.

## SPEC Lock
*No SPEC.md file loaded.*

## Decisions

### 1. Policy Logic & Rules Engine
- Policies (e.g., severity thresholds, environment policies, minimum confidence scores, and stable version checks) are defined in a structured configuration file (e.g., `policies.json` or within `config.json`).
- The rules engine parses this configuration at runtime to deterministically check whether a rollback is permitted.

### 2. LLM Reasoning Integration & Model Armor
- Gemini LLM is consulted for recommendations and narrative reasoning.
- The LLM's recommendation is treated as advisory and is strictly filtered/overridden by the deterministic JSON policy rules.
- Model Armor wrapping is applied to screen input context and output recommendations.

### 3. Agent Gateway Authorization
- The Agent Gateway enforces separation of duties.
- Requests to execute sensitive tools (e.g., rollback) must pass through the Gateway, which checks the calling agent's `agent_id` and permissions against the Agent Registry.

### 4. Decision Trace Schema
- Traces are stored in a dedicated `"traces"` collection in Firestore, keyed by `deployment_id`.
- The trace contains: `trace_id`, `decision`, `confidence`, `evidence_summary`, `policy_checks`, `policy_passed`, `authorized`, and `decided_at`.

## Code Context

### Existing Components & Reusable Assets
- [interfaces.py](file:///c:/Users/sukha/Downloads/DeployGuard/src/deployguard/cloud/interfaces.py) — `MetricsSource` and `DocumentStore` protocols.
- [stubs.py](file:///c:/Users/sukha/Downloads/DeployGuard/src/deployguard/cloud/stubs.py) — `MockFirestore`, `MockMonitoring`, `MockCloudDeploy`, and `MockLogging`.
- [workflow.py](file:///c:/Users/sukha/Downloads/DeployGuard/src/deployguard/state/workflow.py) — `DeploymentWorkflowState`, `AnomalySignal`, and `DecisionTrace` models.

## Canonical Refs
*None.*
