---
title: "Module 3: Sparse vs Dense vs Hybrid Search"
short_description: "Module 3 of the Beginners course: understand dense vs sparse search, when each fails, and how hybrid systems combine them."
description: "Understand dense vs sparse search, when each fails, and how hybrid systems combine them. Learn about fusion strategies, multimodal search, and real-world use cases."
isLesson: true
weight: 40
---

{{< date >}} Module 3 {{< /date >}}

# Sparse vs Dense vs Hybrid Search

Understand dense vs sparse search, when each fails, and how hybrid systems combine them.

## Today's path

1. Where We Left Off
2. The Two Families of Search
3. Hybrid Search: Dense + Sparse + Filters (Optional)
4. Setting Up Hybrid Search in Qdrant
5. Fusion Strategies
6. Beyond Text: Multimodal Search
7. Real-World Use Cases
8. References & Further Reading

By the end, you'll understand when to use dense, sparse, or hybrid search and how to implement them in Qdrant.

## 1. Where We Left Off

In Module 2, you built a complete ingestion and retrieval pipeline: raw text → vector → store → top-K query. Dense-only search works well for natural language. It breaks immediately on structured identifiers.

| Query | SKU-48291 |
|-------|-----------|
| **The user wants exactly this product. No synonyms. No paraphrasing.** | |

**Dense search returns**

| SKU-48292 | (0.91) | ← wrong |
|----------|--------|---------|
| SKU-48291 | (0.89) | ← correct |
| SKU-48290 | (0.87) | ← wrong |

### The problem

Dense search understands meaning - but that's exactly wrong here. IDs, codes, and rare tokens need exact matching, not semantic neighborhood. This is the gap sparse search fills.

## 2. The Two Families of Search

Every retrieval system is built from one or both of these families. Understanding what each does - and what it cannot do - is the foundation of production search design.

### Dense Search (Semantic)

Dense vectors are embeddings: fixed-length lists of floating-point numbers that encode meaning. Two pieces of text with similar meaning produce vectors that are close in high-dimensional space, regardless of whether they share any words.

```python
# Dense vector: all dimensions have non-zero values
dense_vector = [0.12, -0.87, 0.33, 0.05, -0.42, ...]  # 384 dims

# Semantically close, even without shared words:
encode("car repair")       ≈  encode("automobile maintenance")
encode("cheap flights")    ≈  encode("affordable airfare")
```

### Sparse Search (Keyword-Based)

Sparse vectors are token-based. Only the dimensions corresponding to tokens that actually appear in the text have non-zero values - everything else is zero. BM25 and SPLADE are the most common sparse models.

```python
# Sparse vector: most values are zero
# Only the indices of present tokens are stored
sparse_vector = {
    "indices": [142, 9325, 44001],   # token IDs: 'nike', 'pegasus', '40'
    "values":  [2.3,   1.2,    0.8],  # BM25 scores for each token
}

# Exact match: 'SKU-48291' only matches the document
# that contains those exact characters.
```

### Head-to-Head Comparison

| Dense Search (Semantic) | | Sparse Search (Keyword) |
|-------------------------|---|-------------------------|
| **✔ Strengths** | | **✔ Strengths** |
| Synonyms - car = automobile | | Exact token matches - IDs, codes, SKUs |
| Paraphrasing - "cheap flights" ≈ "affordable airfare" | | Rare or domain-specific terms |
| Multilingual queries across languages | | Interpretable - easy to debug and explain |
| Intent and context understanding | | |
| **✖ Weaknesses** | | **✖ Weaknesses** |
| Exact IDs like SKU-48291 can drift | | Synonyms - car ≠ automobile |
| Rare or invented tokens | | Paraphrasing and rewordings |
| Precise code / serial number matching | | Cross-language queries |

### Key insight

Dense = meaning. Sparse = exact matching. Neither is complete alone. Every real-world query contains both semantic intent (what the user means) and exact constraints (what the user needs precisely). You need both.

## 3. Hybrid Search: Dense + Sparse + Filters (Optional)

Hybrid search runs dense and sparse retrieval simultaneously, then fuses the ranked candidate lists into a single result set. Payload filters can be applied as hard constraints throughout. The result: semantic understanding with exact-match precision.

### A Concrete Example

Query: "Nike Pegasus 40 size 10"

**Dense**
Understands: running shoes, athletic footwear, sport sneakers

**Sparse**
Exactly matches: Nike, Pegasus, 40, size, 10

**Filters**
Enforces: in_stock=true, price ≤ 200

↓ **RRF Fusion** ↓

Best results: correct product, correct size, in stock

## 4. Setting Up Hybrid Search in Qdrant

Hybrid search in Qdrant uses named vectors - dense and sparse stored together on the same point - and the Universal Query API to prefetch from each, then fuse the results.

### Step 1 - Create a Hybrid Collection

Declare both a dense vector config and a sparse vector config on the same collection. Points will carry both.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(":memory:")

client.create_collection(
    collection_name="products",
    vectors_config={
        "dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE,
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(),
    },
)
```

### Step 2 - Insert Points with Both Vectors

Each point carries a dense embedding and a sparse vector. Pass a models.Document object and specify the model - Qdrant handles embedding on the server side.

```python
client.upload_points(
    collection_name="products",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "dense": models.Document(
                    text="Nike Pegasus running shoes",
                    model="sentence-transformers/all-MiniLM-L6-v2",
                ),
                "sparse": models.Document(
                    text="Nike Pegasus running shoes",
                    model="Qdrant/bm25",
                ),
            },
            payload={"price": 120, "in_stock": True, "size": [9, 10, 11]},
        )
    ],
)
```

### Step 3 - Hybrid Query with Fusion

Prefetch from both the dense and sparse indexes simultaneously, then fuse the two ranked lists with RRF into a single result.

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text="Nike Pegasus 40 size 10",
                model="sentence-transformers/all-MiniLM-L6-v2",
            ),
            using="dense",
            limit=20,
        ),
        models.Prefetch(
            query=models.Document(
                text="Nike Pegasus 40 size 10",
                model="Qdrant/bm25",
            ),
            using="sparse",
            limit=20,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    query_filter=Filter(
        must=[FieldCondition(key="in_stock", match=MatchValue(value=True))]
    ),
    limit=5,
)
```

### How it works

Both prefetch calls run in parallel. Each returns 20 candidates. RRF fusion merges the two ranked lists based on position (not score), then the final limit=5 takes the top results. The filter applies throughout - out-of-stock products never enter the candidate set.

## 5. Fusion Strategies

Once both retrievers return their candidate sets, a fusion algorithm merges them into a single ranked list. Qdrant supports two strategies:

| Strategy | How it works | When to use it |
|----------|--------------|----------------|
| RRF (Reciprocal Rank Fusion) | Combines rankings only - ignores raw score values. Robust, hard to game. | Default for most cases. Safe starting point when score scales differ between dense and sparse. |
| DBSF (Distribution-Based Score Fusion) | Normalizes score distributions before merging. Sensitive to relative score differences. | Better when score gaps meaningfully encode relevance and both retrievers are well-calibrated. |

### Starting point

Start with RRF. It's the safer default because dense and sparse scores are on different scales - raw score fusion without normalization produces unreliable results. Switch to DBSF only after evaluating on a labeled test set.

## 6. Beyond Text: Multimodal Search

The same primitive - embed data, store as a vector, search by similarity - applies to any modality. Qdrant stores whatever vectors your embedding model produces. The retrieval mechanics are identical.

🖼️
**Images**
"red dress" → visually similar products
CLIP, SigLIP embed images and text into the same space

🎬
**Video**
"factory fire" → matching video scenes
Frames are sampled, embedded, stored as named vectors

🎧
**Audio**
Hum a melody → matching songs
Audio fingerprints or spectrogram embeddings

📝
**Text**
"cheap flights NYC" → semantic docs
Sentence transformers, OpenAI embeddings, etc.

### The Unifying Principle

**Data → Embedding Model → Vector → Qdrant**

The modality changes. The system does not.

### Named Vectors for Multimodal

When text and images must be searchable together, store them as named vectors on the same point. A query against one named vector retrieves across both.

```python
# A product point with both text and image embeddings
models.PointStruct(
    id=42,
    vector={
        "text":  text_model.encode("Red Nike running shoe").tolist(),
        "image": clip_model.encode_image(product_image).tolist(),
    },
    payload={"sku": "NK-RED-10", "price": 120},
)

# Query by image: find visually similar products
client.query_points(
    collection_name="products",
    query=clip_model.encode_image(query_image).tolist(),
    using="image",
    limit=10,
)
```

## 7. Real-World Use Cases

The dense + sparse + filters pattern repeats across domains. The signals change; the architecture does not. Here are five domains where hybrid retrieval is the standard approach:

| Domain | Dense signal | Sparse signal | Key filters |
|--------|-------------|---------------|-------------|
| E-commerce | Dense → user intent, style, vibe | Sparse → product names, SKUs, brand | Price, in-stock, category, brand |
| Legal Discovery | Dense → find semantically relevant docs | Sparse → match exact citations, statutes | Date range, jurisdiction, document type |
| Agent Memory | Dense → retrieve relevant past context | Sparse → match exact session IDs, names | user_id, session_id, timestamp |
| Customer Support | Dense → similar past tickets / answers | Sparse → error codes, version strings | Product, severity, resolved status |
| Medical Search | Dense → symptom similarity | Sparse → ICD codes, drug names | Condition, date, patient cohort |

### Deeper Dive: Agent Memory

Agentic AI systems need to retrieve relevant context from past interactions. This is one of the most common hybrid search patterns in production LLM systems:

```python
# Storing an agent interaction as a memory point
client.upsert(
    collection_name="agent_memory",
    points=[
        models.PointStruct(
            id=interaction_id,
            vector={
                "dense":  embed(interaction_text),
                "sparse": bm25_encode(interaction_text),
            },
            payload={
                "user_id":    user_id,
                "session_id": session_id,
                "timestamp":  unix_timestamp,
                "summary":    interaction_text[:200],
            },
        )
    ],
)

# Retrieving relevant past context for the current query
results = client.query_points(
    collection_name="agent_memory",
    prefetch=[
        models.Prefetch(query=embed(current_query), using="dense",  limit=20),
        models.Prefetch(query=bm25_encode(current_query), using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    query_filter=Filter(
        must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
    ),
    limit=5,
)
```

## 8. References & Further Reading

- **Sparse Retrieval Demo** - [Demo: Keyword Search with Sparse Vectors - Qdrant](https://qdrant.tech/documentation/tutorials/sparse_search/)
  - Live comparison of BM25, SPLADE, and dense embeddings on the same queries.

- **Hybrid Queries (RRF + DBSF)** - [Hybrid Queries - Qdrant](https://qdrant.tech/documentation/concepts/hybrid_query/)
  - Full reference for prefetch, FusionQuery, RRF, and DBSF in the Qdrant API.

- **Sparse Vectors Reference** - [Vectors - Qdrant](https://qdrant.tech/documentation/concepts/vectors/#sparse-vectors)
  - SparseVectorParams, index configuration, and storage options.

- **Multimodal Search Tutorial** - [Multimodal and Multilingual RAG with LlamaIndex and Qdrant](https://qdrant.tech/documentation/tutorials/multimodal_rag/)
  - Text + image search with embeddings and named vectors.

- **Named Vectors** - [Collections - Qdrant](https://qdrant.tech/documentation/concepts/collections/#multiple-vectors)
  - How to configure and query multiple named vectors on the same point.

## What's Next - Module 4

Next, we'll explore:

- Real enterprise architectures - Tripadvisor, HubSpot, and OpenTable in depth
- Production patterns: multi-tenancy, agent memory, and RAG pipelines
- Deployment options: Cloud, Hybrid Cloud, Edge, and self-hosted
- Formula queries - when RRF and DBSF aren't enough

End of Module 3. Continue to Module 4: Customer Use Cases and Production Architecture.
