"""Shared vector embedding utilities for DeployGuard.

Provides synchronous embedding generation for incident memory RAG.
In MOCK mode (DEPLOYGUARD_MOCK_GCP=true), uses a deterministic hash-based
embedding to avoid live API calls.

Constants:
    EMBEDDING_DIM: Dimension of embedding vectors (768 for text-embedding-004).
    COSINE_THRESHOLD: Minimum cosine similarity for incident retrieval (0.70).
    DEFAULT_TOP_K: Default number of incidents to retrieve (3).
"""

from __future__ import annotations

import hashlib
import logging
import math
import os

logger = logging.getLogger(__name__)

EMBEDDING_DIM: int = 768
"""Dimension of embedding vectors (text-embedding-004 output)."""

COSINE_THRESHOLD: float = 0.70
"""Minimum cosine similarity score for incident retrieval."""

DEFAULT_TOP_K: int = 3
"""Default number of similar incidents to retrieve."""

MOCK_GCP: bool = os.environ.get("DEPLOYGUARD_MOCK_GCP", "true").lower() == "true"


def mock_embedding(text: str) -> list[float]:
    """Generate a deterministic mock embedding vector from text.

    Uses SHA-256 hashing with byte seeding to produce a reproducible
    EMBEDDING_DIM-dimensional unit vector. Same text always produces
    the same vector, enabling stable test assertions.

    Args:
        text: The input text to embed.

    Returns:
        A normalized list of EMBEDDING_DIM floats (unit vector).
    """
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    vector: list[float] = []
    i = 0
    while len(vector) < EMBEDDING_DIM:
        chunk = hashlib.sha256(seed + i.to_bytes(4, "little")).digest()
        for b in chunk:
            if len(vector) >= EMBEDDING_DIM:
                break
            vector.append((b / 127.5) - 1.0)
        i += 1

    # L2 normalize to unit vector for cosine similarity
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def generate_embedding(text: str) -> list[float]:
    """Generate a text embedding vector synchronously.

    In MOCK mode (DEPLOYGUARD_MOCK_GCP=true), returns a deterministic
    mock embedding. In live mode, calls the google-genai embeddings API
    using the text-embedding-004 model.

    Args:
        text: The text to embed.

    Returns:
        A list of floats representing the embedding vector.
    """
    # Re-read env var each call to support runtime toggle in tests
    is_mock = os.environ.get("DEPLOYGUARD_MOCK_GCP", "true").lower() == "true"
    if is_mock:
        return mock_embedding(text)

    try:
        import google.genai as genai

        client = genai.Client()
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        if response.embeddings and response.embeddings[0].values:
            return [float(v) for v in response.embeddings[0].values]
        return mock_embedding(text)
    except Exception as exc:
        logger.warning("Live embedding failed, falling back to mock: %s", exc)
        return mock_embedding(text)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors.

    Args:
        a: First vector.
        b: Second vector.

    Returns:
        Cosine similarity in range [-1, 1]. Returns 0.0 if either vector
        is empty or zero-magnitude.
    """
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)
