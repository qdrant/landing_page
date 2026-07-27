---
title: "Module 3: Sparse vs Dense vs Hybrid Search"
short_description: "Module 3 of the Beginners course: Understand dense versus sparse retrieval, their strengths, and how a hybrid approach can combine them."
description: "Understand dense versus sparse retrieval, their strengths, and how a hybrid approach can combine them. Learn about fusion strategies and multimodal search."
isLesson: true
weight: 40
---

{{< date >}} Module 3 {{< /date >}}

# Sparse vs Dense vs Hybrid Search

<div class="video">
  <iframe src="https://www.youtube.com/embed/9XXz21jmWes?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
  </iframe>
</div>

Understand dense versus sparse retrieval, their strengths, and how a hybrid approach can combine them.


## Today's Path

1. Where We Left Off
2. The Two Families of Search
3. Hybrid Search: Dense + Sparse
4. Setting Up Hybrid Search in Qdrant
5. Fusion Strategies
6. Beyond Text: Multimodal Search
7. Filtering: Works with Any Retrieval Method
8. References & Further Reading

By the end, you'll understand when to use dense, sparse, or hybrid search and how to implement them in Qdrant.

## 1. Where We Left Off

In Module 2, you built a complete ingestion and retrieval pipeline: raw text → vector → store → top-K query. Dense-only retrieval is best for semantic and contextual search, but it struggles on precise product names and model numbers.

Take the query `iPhone 15`. The user wants exactly this product: no synonyms, no paraphrasing. A dense-only search typically returns something like this:

| Result | Score | Match |
|--------|-------|-------|
| iPhone 14 | 0.93 | Wrong model |
| iPhone 15 Pro Max | 0.91 | Wrong model |
| iPhone 15 | 0.89 | Correct |

### The Problem

Dense search understands meaning, and here that's the wrong instinct. "iPhone 14", "iPhone 15", and "iPhone 15 Pro Max" sit close together in embedding space because they describe the same product line, yet a shopper searching for one model wants that model, not its closest semantic neighbor. IDs, codes, and specific model names need exact matching, not semantic neighborhood. This is the gap sparse search fills.

## 2. The Two Families of Search

Every retrieval system is built from one or both of these families. Understanding what each does, and what it cannot do, is the foundation of production search design.

### Dense Search (Semantic)

![Dense search](/courses/beginners/module-3/dense-search.png)

A dense vector has a small, fixed number of dimensions (for example, 384), and every single one holds a value. Two pieces of text with similar meaning produce vectors that are close in high-dimensional space, regardless of whether they share any words.

```python
# Dense vector: all dimensions have non-zero values
dense_vector = [0.12, -0.87, 0.33, 0.05, -0.42, ...]  # 384 dims

# Semantically close, even without shared words:
#   encode("car repair")    is close to  encode("automobile maintenance")
#   encode("cheap flights") is close to  encode("affordable airfare")
```

### Sparse Search (Keyword-Based)

![Sparse search](/courses/beginners/module-3/sparse-search.png)

Sparse vectors are token-based. Each dimension maps to a token, and only the tokens that actually appear in your text carry a non-zero value. Everything else stays zero. BM25, SPLADE, and miniCOIL are the most common ways to produce them.

A sparse vector has one dimension per token in the vocabulary, often tens of thousands, but a given piece of text only ever activates the handful of tokens it contains. Everything else is implicitly zero.

Storing tens of thousands of mostly-zero numbers per point would be wasteful, so sparse vectors are represented as two parallel arrays instead: the `indices` of the non-zero dimensions, and the `values` at those positions. Nothing is stored for the dimensions that are zero.

```python
# Sparse vector: most values are zero.
# Only the indices of present tokens are stored, never the full vocabulary.
sparse_vector = {
    "indices": [142, 9325, 44001],   # token IDs: 'nike', 'pegasus', '40'
    "values":  [2.3,  1.2,   0.8],   # weight for each token
}

# Exact match: 'SKU-48291' only matches the document
# that contains those exact characters.
```

Sparse similarity in Qdrant is always the dot product. There is no distance metric to choose, unlike the dense side where you pick Cosine, Dot, or Euclidean.

#### Sparse Models: BM25, SPLADE, and miniCOIL

Different sparse models decide *which* tokens get weight and *how much*:

| Model | How it assigns weights | Notes |
|-------|-------------------------|-------|
| BM25 | Statistical: term frequency and inverse document frequency (IDF), no training involved | Classic, fast, fully interpretable. Only scores tokens exactly as written. FastEmbed handle: `Qdrant/bm25`. |
| SPLADE | Neural: a transformer learns to expand a text with related terms and assign them weights, even terms not in the original text | Captures some synonymy while staying sparse. More compute-intensive than BM25. Available in FastEmbed as SPLADE++. |
| miniCOIL | Neural, contextualized term weighting: keeps BM25's exact-token vocabulary but weights each occurrence using its surrounding context | Adds context-awareness to exact-match retrieval without the cost of full expansion models like SPLADE. FastEmbed handle: `Qdrant/minicoil-v1`. |

miniCOIL is Qdrant's recommendation for new projects: it matches BM25's exact-token vocabulary while adding context-awareness at low extra cost. Reach for BM25 when you need full interpretability, or the simplest and cheapest scoring with no model inference at all. Reach for SPLADE when you need aggressive term expansion across a large vocabulary.

![Side-by-side comparison of BM25, SPLADE, and miniCOIL, showing how each assigns weights to tokens: BM25 scores only tokens as written, SPLADE expands with related terms, and miniCOIL weights exact tokens by context.](/courses/beginners/module-3/comparison.png)

#### Indexing Sparse Vectors

Because the vast majority of dimensions are zero, comparing full vectors would waste effort scanning entries that don't matter. Qdrant indexes sparse vectors with a data structure similar to the **inverted index** used by text search engines: for every token, it keeps a posting list of every point where that token has a non-zero weight.

```text
Token "nike"    → posting list: [point_1, point_5, point_42, ...]
Token "pegasus" → posting list: [point_1, point_5, point_88, ...]
```

A query only walks the posting lists for tokens it actually contains, skipping every point that shares none of them. HNSW (Module 2) is an approximate index, but Qdrant's sparse index is exact: no accuracy is traded away for speed.

### Head-to-Head Comparison

|  | Dense Search (Semantic) | Sparse Search (Keyword) |
|---|---|---|
| **Strengths** | Synonyms: car = automobile<br>Paraphrasing: "cheap flights" ≈ "affordable airfare"<br>Multilingual queries across languages<br>Intent and context understanding | Exact token matches: IDs, codes, SKUs<br>Rare or domain-specific terms<br>Interpretable, so easy to debug and explain |
| **Weaknesses** | Exact IDs like SKU-48291 can drift<br>Rare or invented tokens<br>Precise code and serial number matching | Synonyms: car ≠ automobile<br>Paraphrasing and rewordings<br>Cross-language queries |

### Key Insight

Dense = meaning. Sparse = exact matching. Neither is complete alone. Every real-world query contains both semantic intent (what the user means) and exact constraints (what the user needs precisely). You need both.


## 3. Hybrid Search: Dense + Sparse

Hybrid search runs dense and sparse retrieval in the same request, then fuses the ranked candidate lists into a single result set. The result: semantic understanding with exact-match precision. Payload filters apply to both retrievers while they run, which Section 7 covers in full.

### A Concrete Example

![Hybrid search for the query "Nike Pegasus 40 size 10": dense retrieval contributes semantically related running shoes while sparse retrieval locks onto the exact model and size tokens, and fusion combines both into one ranked list.](/courses/beginners/module-3/nike-example.png)

### RRF Fusion

![Reciprocal Rank Fusion merging a dense ranked list and a sparse ranked list into a single fused ranking based on each candidate's position in the two lists.](/courses/beginners/module-3/fusion.png)

You can learn more about fusion in the [Hybrid Queries documentation](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf).

## 4. Setting Up Hybrid Search in Qdrant

**Follow along in Colab.** Every example from here through Section 7 is runnable in this notebook, no setup or API keys required: [Open in Google Colab](https://colab.research.google.com/drive/1YwUzhfP_Dxy_mgxP6dV8zJyYQvsWRn2i?usp=sharing).

Hybrid search in Qdrant uses named vectors, dense and sparse stored together on the same point, and the Universal Query API to prefetch from each, then fuse the results.

### Step 1: Create a Hybrid Collection

Declare both a dense vector config and a sparse vector config on the same collection. Points will carry both. Create a payload index for every field you plan to filter on, before inserting anything.

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
        "sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF  # Required for correct BM25 scoring
        ),
    },
)

# We filter on in_stock later, so index it now, before ingestion
client.create_payload_index(
    collection_name="products",
    field_name="in_stock",
    field_schema=models.PayloadSchemaType.BOOL,
)
```

**Note:** The IDF modifier is needed because BM25-style sparse vectors intentionally store only term frequency, so `modifier=models.Modifier.IDF` tells Qdrant to compute and apply the missing inverse-document-frequency weighting at scoring time. miniCOIL needs it too, since its scoring is built on the same BM25 formula.

**Note on local mode:** `QdrantClient(":memory:")` keeps this notebook dependency-free, but it's a Python reimplementation rather than the engine. Search is exact instead of approximate, and payload indexes have no effect. The index call above is still the right habit, and Module 4 explains why the ordering matters on a real server.

### Step 2: Insert Points with Both Vectors

Each point carries a dense embedding and a sparse vector. Pass a `models.Document` object and specify the model. The client embeds it locally using FastEmbed before upload.

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

### Step 3: Hybrid Query with Fusion

Prefetch from both the dense and sparse indexes, then fuse the two ranked lists with Reciprocal Rank Fusion into a single result. The filter goes inside each prefetch, so both retrievers only ever consider in-stock products.

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

stock_filter = Filter(
    must=[FieldCondition(key="in_stock", match=MatchValue(value=True))]
)

results = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text="Nike Pegasus 40 size 10",
                model="sentence-transformers/all-MiniLM-L6-v2",
            ),
            using="dense",
            filter=stock_filter,
            limit=20,
        ),
        models.Prefetch(
            query=models.Document(
                text="Nike Pegasus 40 size 10",
                model="Qdrant/bm25",
            ),
            using="sparse",
            filter=stock_filter,
            limit=20,
        ),
    ],
    query=models.RrfQuery(rrf=models.Rrf()),
    limit=5,
)
```

### How It Works

Both prefetches run as part of one request. Each returns up to 20 in-stock candidates. Reciprocal Rank Fusion merges the two ranked lists based on position rather than score, then the final `limit=5` takes the top results. Because each prefetch carries the filter, out-of-stock products never enter either candidate set.

That placement matters more than it looks. Once a query has prefetches, Qdrant runs them first and applies the outer query to their results, so a filter passed at the top level as `query_filter` would never reach the retrievers. Each would search the whole catalog, and the filter would only trim the fused list at the end. On a selective filter that leaves you with very little, and it raises no error while doing it. Section 7 shows where a top-level `query_filter` is correct: any query without prefetches.

### Try It

Put the three steps together and watch the behavior change:

1. Run the hybrid query from Step 3 and note where "Nike Pegasus 40 size 10" lands.
2. Run the same query dense-only: drop the sparse prefetch and the fusion query, and query with `using="dense"`. Compare the ranking. The exact model and size should sit higher once the sparse signal is fused back in.
3. Set `in_stock` to `False` on that point and rerun both queries. It should vanish from each. Now move the filter out of the two prefetches and pass it once as a top-level `query_filter` instead, then rerun the hybrid query. The out-of-stock point returns, often in first place, with no error. That is the difference between filtering during retrieval and filtering a fused list afterward.

## 5. Fusion Strategies

Once both retrievers return their candidate sets, a fusion algorithm merges them into a single ranked list. Qdrant supports two strategies:

| Strategy | How it works | When to use it |
|----------|--------------|----------------|
| RRF (Reciprocal Rank Fusion) | Combines rankings only, ignoring raw score values. Robust and hard to game. | Default for most cases. Safe starting point when score scales differ between dense and sparse. |
| DBSF (Distribution-Based Score Fusion) | Normalizes score distributions before merging. Sensitive to relative score differences. | Better when score gaps meaningfully encode relevance and both retrievers are well-calibrated. |

Reciprocal Rank Fusion also takes optional parameters once you have something to measure against: `k` adjusts how steeply rank position is discounted, and `weights` lets you favor the stronger retriever, so a dense-dominant workload can down-weight sparse rather than dropping it.

You can learn more about fusion in the [Hybrid Queries documentation](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf).

### Starting Point

Start with unweighted RRF. Dense and sparse scores live on different scales, so fusing raw scores without normalization produces unreliable rankings, and ranks sidestep the problem entirely. Move to DBSF or tuned weights only after evaluating on a labeled test set, and tune on a different split from the one you measure on.

## 6. Beyond Text: Multimodal Search

The same primitive, embed data, store as a vector, search by similarity, applies to any modality. Qdrant stores whatever vectors your embedding model produces. The retrieval mechanics are identical.

- **Images**: "red dress" retrieves visually similar products. CLIP and SigLIP embed images and text into the same space.
- **Video**: "factory fire" retrieves matching scenes. Frames are sampled, embedded, and stored as named vectors.
- **Audio**: hum a melody to find matching songs, using audio fingerprints or spectrogram embeddings.
- **Text**: "cheap flights NYC" retrieves semantically related documents, via sentence transformers or hosted embedding APIs.

![Multimodal search pipeline: text, image, video, and audio inputs each pass through an embedding model to produce vectors that are stored in and queried from Qdrant using the same mechanics.](/courses/beginners/module-3/multimodal.png)

### The Unifying Principle

**Data → Embedding Model → Vector → Qdrant**

The modality changes. The system does not.

### Named Vectors for Multimodal

When text and images must be searchable together, store them as named vectors on the same point. Each named vector is queried independently, using the model that produced it.

```python
# A product point with both text and image embeddings
models.PointStruct(
    id=42,
    vector={
        "text":  embed_text("Red Nike running shoe"),  # sentence transformer
        "image": embed_image(product_image),           # CLIP image encoder
    },
    payload={"sku": "NK-RED-10", "price": 120},
)

# Query by image: find visually similar products
client.query_points(
    collection_name="products",
    query=embed_image(query_image),
    using="image",
    limit=10,
)
```

Each named vector is its own space, and vectors from different models are not comparable. To search images with a *text* query, embed that text with CLIP's text encoder, not the sentence transformer, so the query lands in the same space as the stored image vectors. Module 5 builds this pipeline out in full.

## 7. Filtering: Works with Any Retrieval Method

Payload filters are not a hybrid-only feature. The same conditions apply whether you're running dense-only, sparse-only, or hybrid retrieval, and they're evaluated as hard constraints while the search runs, not as a separate step afterward.

What changes between the three is *where* the filter goes.

### Filtering a Dense Query

No prefetch, so the filter belongs at the top level as `query_filter`:

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="products",
    query=dense_query_vector,
    using="dense",
    query_filter=Filter(
        must=[FieldCondition(key="in_stock", match=MatchValue(value=True))]
    ),
    limit=5,
)
```

### Filtering a Sparse Query

Identical placement, since there's no prefetch here either:

```python
results = client.query_points(
    collection_name="products",
    query=sparse_query_vector,
    using="sparse",
    query_filter=Filter(
        must=[FieldCondition(key="in_stock", match=MatchValue(value=True))]
    ),
    limit=5,
)
```

### Filtering a Hybrid Query

Here the filter moves inside every `Prefetch`, as in Step 3 of Section 4. Prefetches run before the outer query, so a top-level `query_filter` would arrive too late to constrain either retriever and would only trim the already-fused candidates.

### Why It Matters

Because filters are applied during retrieval rather than after it, out-of-scope points never take up a slot in your top-K results, regardless of whether the underlying retrieval is dense, sparse, or hybrid. That keeps results both relevant and valid: in stock, within permissions, within a date range. It also depends on the filtered field being indexed, which is why Step 1 creates the index on `in_stock` before any data goes in. Module 4 goes deeper into why that ordering matters.

## 8. References & Further Reading
- [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/)
  - How sparse vectors work, how SPLADE builds them, and how they compare to BM25, with runnable examples.
- [Hybrid Queries](/documentation/search/hybrid-queries/)
  - Prefetch semantics, Reciprocal Rank Fusion with `k` and weights, Distribution-Based Score Fusion, and formula queries.
- [Sparse Vectors Reference](/documentation/manage-data/vectors/#sparse-vectors)
  - SparseVectorParams, index configuration, and storage options.
- [Sparse Vector Indexing](/documentation/manage-data/indexing/#sparse-vector-index)
  - How Qdrant's inverted-index-style sparse index works, and when it rebuilds into an immutable index.
- [Filtering](/documentation/search/filtering/)
  - Full filter syntax, and the payload index types each condition depends on.
- [miniCOIL: Sparse Neural Retrieval](/articles/minicoil/)
  - Why miniCOIL exists, how it extends the BM25 formula with contextual meaning, and how it benchmarks against BM25.
- [Working with miniCOIL](/documentation/fastembed/fastembed-minicoil/)
  - How miniCOIL's contextualized term weighting works, and how to use it via FastEmbed.
- [Named Vectors](/documentation/manage-data/vectors/#named-vectors)
  - How to configure and query multiple named vectors on the same point.
- [Multimodal Search](/documentation/multimodal-search/)
  - Images and text in one collection through a shared embedding space, with named vectors.

## What's Next - Module 4

Next, we'll go from primitives to judgment, designing a complete vector search system end to end:

- The five layers of a vector search stack: query, indexing, storage, knowledge, and distribution
- A worked example: designing a multilingual news search system, decision by decision
- Filtering in production: how the query planner combines filters with vector search, and multitenancy via payload filters
- The production RAG pipeline, from query understanding to generation
- Deployment options: Local, Docker, Managed Cloud, Hybrid Cloud, Private Cloud, and Edge
