# Phase 3 Discussion Log — Decisioning Engine & Governance

## Overview
Discussion regarding the implementation design choices for Phase 3 (Decisioning Engine & Governance), conducted on 2026-08-29.

## Decisions Log

### 1. Policy Logic & Rules Engine
- **Presented options:**
  1. Config-Driven JSON/YAML Policy (Parsed at runtime)
  2. Hardcoded Python Policy Class (Statically typed)
- **User selection:** Config-Driven JSON/YAML Policy.
- **Notes:** Promotes environment-specific custom rules without code modifications.

### 2. LLM Reasoning Integration & Model Armor
- **Decision:** Hybrid Model. Gemini LLM provides analysis, but its outcome is capped and overridden by the deterministic configuration policies.

### 3. Agent Gateway Authorization
- **Decision:** Registry-Bounded Gateway. Verifies calling agents using `agent_id` against registry configurations.

### 4. Decision Trace Schema
- **Decision:** Stored in Firestore under `"traces"` collection, keyed by `deployment_id`.

## Deferred Ideas
*None.*
