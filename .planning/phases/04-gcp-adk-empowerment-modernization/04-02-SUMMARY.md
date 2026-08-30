---
plan: 04-02
phase: 04
status: complete
date: 2026-08-30
key-files:
  created:
    - src/deployguard/cloud/embeddings.py
    - tests/test_vector_search.py
  modified:
    - src/deployguard/agents/incident_memory.py
    - src/deployguard/cloud/stubs.py
---

# Plan 04-02 Summary — Firestore Vector Search & Incident Memory RAG

## What Was Built

- **`embeddings.py`**: Shared embedding utilities with `generate_embedding()` (mock or live text-embedding-004), `mock_embedding()` (deterministic SHA-256-seeded L2-normalized unit vector), `cosine_similarity()`, and constants `COSINE_THRESHOLD=0.70`, `DEFAULT_TOP_K=3`, `EMBEDDING_DIM=768`.
- **`incident_memory.py`**: Added `store_incident()` (generates embedding on write), `find_similar_incidents()` (pre-filtered hybrid retrieval — `find_nearest_in_collection` if available, in-memory cosine fallback), `get_incidents()` (backward compat). Class constants via `ClassVar`.
- **`stubs.py`**: Added `find_nearest_in_collection()` to MockFirestore implementing in-memory cosine similarity with pre-filter, threshold, and limit.
- **`test_vector_search.py`**: Comprehensive pytest tests for embedding utilities, MockFirestore vector search, and IncidentMemoryAgent RAG pipeline.

## Key Files
- `src/deployguard/cloud/embeddings.py` — NEW: embedding utilities
- `src/deployguard/agents/incident_memory.py` — MODIFIED: vector RAG
- `src/deployguard/cloud/stubs.py` — MODIFIED: mock vector search
- `tests/test_vector_search.py` — NEW: unit tests

## Self-Check: PASSED
- [x] generate_embedding returns mock in MOCK_GCP=true mode
- [x] store_incident embeds and persists
- [x] find_similar_incidents implements pre-filter + cosine threshold
- [x] MockFirestore find_nearest_in_collection correct
- [x] All tests pass (17/17)

## Deviations
- Added `embeddings.py` utility module for clean separation of embedding logic.
- Used `ClassVar` for class constants due to Pydantic model inheritance constraints.
- Installed `pytest-asyncio==1.4.0` (was in pyproject.toml test deps but not in venv).
- Fixed one test (`test_find_similar_incidents_respects_threshold`) to align with hash-based mock embedding behavior: stored embedding must be seeded from the exact same text as the query (SHA-256 mock vectors are not semantically similar for textually close but non-identical strings).
