"""Unit tests for Plan 04-02: Firestore Vector Search & Incident Memory RAG."""

from __future__ import annotations

import os

import pytest

# Force mock mode for all tests in this module
os.environ["DEPLOYGUARD_MOCK_GCP"] = "true"

from deployguard.agents.incident_memory import IncidentMemoryAgent
from deployguard.cloud.embeddings import (
    COSINE_THRESHOLD,
    DEFAULT_TOP_K,
    cosine_similarity,
    generate_embedding,
    mock_embedding,
)
from deployguard.cloud.stubs import MockFirestore


# Embedding utility tests

def test_mock_embedding_is_deterministic():
    e1 = mock_embedding("payment service error")
    e2 = mock_embedding("payment service error")
    assert e1 == e2


def test_mock_embedding_different_texts_differ():
    e1 = mock_embedding("payment service error")
    e2 = mock_embedding("auth service timeout")
    assert e1 != e2


def test_mock_embedding_is_unit_vector():
    import math
    e = mock_embedding("test text")
    norm = math.sqrt(sum(v * v for v in e))
    assert abs(norm - 1.0) < 1e-6


def test_cosine_similarity_identical_vectors():
    e = mock_embedding("payment service error")
    score = cosine_similarity(e, e)
    assert abs(score - 1.0) < 1e-6


def test_cosine_similarity_different_vectors():
    e1 = mock_embedding("payment service error")
    e2 = mock_embedding("auth service timeout")
    score = cosine_similarity(e1, e2)
    assert score < 1.0


def test_generate_embedding_uses_mock_in_mock_mode():
    e = generate_embedding("test text")
    mock_e = mock_embedding("test text")
    assert e == mock_e


# MockFirestore vector search tests

@pytest.mark.asyncio
async def test_mock_firestore_find_nearest_returns_similar_docs():
    store = MockFirestore()
    text = "payment service high latency"
    embedding = mock_embedding(text)

    await store.set_document(
        "incidents", "inc-001",
        {"service_name": "svc-payments", "summary": text, "embedding": embedding},
    )

    results = await store.find_nearest_in_collection(
        collection="incidents",
        filter_field="service_name",
        filter_value="svc-payments",
        vector_field="embedding",
        query_vector=mock_embedding(text),
        limit=3,
        threshold=0.70,
    )
    assert len(results) == 1
    assert results[0]["summary"] == text


@pytest.mark.asyncio
async def test_mock_firestore_filters_by_service_name():
    store = MockFirestore()
    payments_emb = mock_embedding("payment error")
    auth_emb = mock_embedding("auth error")

    await store.set_document(
        "incidents", "inc-p",
        {"service_name": "svc-payments", "embedding": payments_emb},
    )
    await store.set_document(
        "incidents", "inc-a",
        {"service_name": "svc-auth", "embedding": auth_emb},
    )

    results = await store.find_nearest_in_collection(
        collection="incidents",
        filter_field="service_name",
        filter_value="svc-payments",
        vector_field="embedding",
        query_vector=payments_emb,
        limit=10,
        threshold=0.0,
    )
    assert all(r["service_name"] == "svc-payments" for r in results)
    assert len(results) == 1


@pytest.mark.asyncio
async def test_mock_firestore_excludes_below_threshold():
    store = MockFirestore()
    emb_a = mock_embedding("payment high latency")

    await store.set_document(
        "incidents", "inc-001",
        {"service_name": "svc-x", "embedding": emb_a},
    )

    results = await store.find_nearest_in_collection(
        collection="incidents",
        filter_field="service_name",
        filter_value="svc-x",
        vector_field="embedding",
        query_vector=mock_embedding("auth service down"),
        limit=3,
        threshold=0.99,  # Very high threshold
    )
    assert len(results) == 0


@pytest.mark.asyncio
async def test_mock_firestore_excludes_docs_without_embedding():
    store = MockFirestore()
    await store.set_document(
        "incidents", "inc-no-emb",
        {"service_name": "svc-payments", "summary": "no embedding"},
    )
    results = await store.find_nearest_in_collection(
        collection="incidents",
        filter_field="service_name",
        filter_value="svc-payments",
        vector_field="embedding",
        query_vector=mock_embedding("query"),
        limit=3,
        threshold=0.0,
    )
    assert len(results) == 0


@pytest.mark.asyncio
async def test_mock_firestore_respects_limit():
    store = MockFirestore()
    base_emb = mock_embedding("payment service error")
    for i in range(5):
        await store.set_document(
            "incidents", f"inc-{i:03d}",
            {"service_name": "svc-payments", "embedding": base_emb},
        )

    results = await store.find_nearest_in_collection(
        collection="incidents",
        filter_field="service_name",
        filter_value="svc-payments",
        vector_field="embedding",
        query_vector=base_emb,
        limit=3,
        threshold=0.0,
    )
    assert len(results) <= 3


# IncidentMemoryAgent tests

@pytest.mark.asyncio
async def test_store_incident_generates_embedding():
    store = MockFirestore()
    agent = IncidentMemoryAgent(document_store=store)
    await agent.store_incident(
        "deploy-001",
        {"service_name": "svc-payments", "summary": "high error rate"},
    )
    doc = await store.get_document("incidents", "deploy-001")
    assert doc is not None
    assert "embedding" in doc
    assert isinstance(doc["embedding"], list)
    assert len(doc["embedding"]) > 0


@pytest.mark.asyncio
async def test_find_similar_incidents_respects_threshold():
    store = MockFirestore()
    agent = IncidentMemoryAgent(document_store=store)

    # Use the exact text that store_incident will embed:
    # embed_text = "svc-payments payment high latency" (service_name + summary)
    exact_embed_text = "svc-payments payment high latency"
    await store.set_document(
        "incidents",
        "inc-abc",
        {
            "service_name": "svc-payments",
            "summary": "payment high latency",
            "embedding": mock_embedding(exact_embed_text),
        },
    )

    results = await agent.find_similar_incidents(
        service_name="svc-payments",
        query_text=exact_embed_text,  # same text → cosine similarity == 1.0
        k=3,
    )
    assert len(results) >= 1


@pytest.mark.asyncio
async def test_find_similar_incidents_filters_service():
    store = MockFirestore()
    agent = IncidentMemoryAgent(document_store=store)

    await agent.store_incident(
        "inc-p", {"service_name": "svc-payments", "summary": "latency spike"}
    )
    await agent.store_incident(
        "inc-a", {"service_name": "svc-auth", "summary": "latency spike"}
    )

    results = await agent.find_similar_incidents(
        service_name="svc-payments",
        query_text="latency spike",
        k=10,
    )
    assert all(r.get("service_name") == "svc-payments" for r in results)


@pytest.mark.asyncio
async def test_get_incidents_backward_compat():
    store = MockFirestore()
    agent = IncidentMemoryAgent(document_store=store)

    await store.set_document(
        "incidents", "inc-1", {"service_name": "svc-payments", "val": 1}
    )
    await store.set_document(
        "incidents", "inc-2", {"service_name": "svc-payments", "val": 2}
    )
    await store.set_document(
        "incidents", "inc-3", {"service_name": "svc-other", "val": 3}
    )

    results = await agent.get_incidents("svc-payments")
    assert len(results) == 2
    assert all(r["service_name"] == "svc-payments" for r in results)


def test_cosine_threshold_constant_exists():
    assert IncidentMemoryAgent.COSINE_THRESHOLD == 0.70


def test_default_top_k_constant_exists():
    assert IncidentMemoryAgent.DEFAULT_TOP_K == 3
