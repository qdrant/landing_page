---
title: "Module 3: Sparse vs Dense vs Hybrid Search"
short_description: "Module 3 of the Beginners course: dense and sparse retrieval, what each one misses, and how hybrid search combines them."
description: "Compare dense and sparse retrieval, see where each one fails on real queries, and build a hybrid search pipeline in Qdrant with rank fusion and filters."
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

**Follow-along code**: [Module 3 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module3.ipynb)

## Today's Path

1. Where We Left Off
2. The Two Families of Search
3. Hybrid Search: Dense and Sparse
4. Setting Up Hybrid Search in Qdrant
5. Fusion Strategies
6. Filtering: Works with Any Retrieval Method
7. Beyond Text: Multimodal Search
8. References and Further Reading

By the end, you'll know when to use dense, sparse, or hybrid search, and how to build each one in Qdrant.

## 1. Where We Left Off

In Module 2 you built a complete ingestion and retrieval pipeline: raw text, vector, store, top-K query. Dense retrieval handles meaning well. It gets shaky on the part of a query that has to be exact.

Here is a shoe catalog with two products one digit apart. Searching it dense-only for `Nike Pegasus 40`:

| Result | Dense score |
|--------|-------------|
| Nike Pegasus 40 running shoes | 0.8713 |
| Nike Pegasus 41 running shoes | 0.8626 |
| Nike Pegasus 40 womens running shoes | 0.7830 |
| Nike Pegasus Trail 4 trail running shoes | 0.7425 |

### The Problem

Dense gets the right answer, by **0.0087**. To the model, "Pegasus 40" and "Pegasus 41" are near-identical statements about running shoes, because that is what they are. The digit that matters to a shopper is one token out of five, averaged into a vector describing the whole phrase.

On eight products a margin that thin still lands the right answer. On eighty thousand, with every colourway and width in the catalog, it is noise. Model numbers, SKUs, and part codes need matching, not neighbourhood. That is the gap sparse search fills.

## 2. The Two Families of Search

Every retrieval system is built from one or both of these.

### Dense Search

![Two short phrases encoded into 384-dimensional dense vectors, positioned close together in vector space because they share meaning rather than words.](/courses/beginners/module-3/dense-search.png)

A dense vector has a small, fixed number of dimensions, 384 for the model used here, and every one of them holds a value. Two texts with similar meaning land close together whether or not they share any words:

```python
cosine("car repair",    "automobile maintenance")   # 0.7334
cosine("cheap flights", "affordable airfare")       # 0.7241
cosine("cheap flights", "bake a cake")              # 0.2047
```

Read the gap, not the absolute number. Two ways of saying the same thing score around 0.73 with this model, and an unrelated phrase scores 0.20; what makes 0.73 meaningful is the distance between the two, not the value on its own.

### Sparse Search

![A sparse vector drawn as a long mostly-empty row, with weights on only the handful of positions matching tokens present in the text.](/courses/beginners/module-3/sparse-search.png)

Sparse vectors are token-based. Each dimension corresponds to a token, and only the tokens present in the text carry a weight. Everything else is zero.

Storing a mostly-zero row per point would be wasteful, so a sparse vector is two parallel arrays: the `indices` of the non-zero dimensions and the `values` at those positions. Here is the real output for one product title:

```python
# BM25 vector for "Nike Pegasus 40 running shoes"
indices = [1974139272, 24614856, 1784631546, 243905464, 303109060]
values  = [1.67, 1.67, 1.67, 1.67, 1.67]
```

Five tokens, five weights, nothing stored for anything else. The indices are hashes of each token rather than positions in a numbered word list, which is why they are large. The values are uniform here because BM25 emits term frequency and Qdrant applies the rest of the scoring at query time, which Section 4 sets up.

One thing sparse retrieval is often assumed to do and does not: match characters. BM25 tokenizes and stems first, so near-miss codes still share tokens.

```python
# 'SKU-48291' and 'SKU-48292' share the token 'sku'
# 'Pegasus 40' and 'Pegasus 41' share the token 'pegasus'
```

What sparse gives you is that `40` and `41` are *different tokens* with no relationship at all, where dense placed them 0.0087 apart. The distinguishing token gets its own dimension instead of being averaged away.

Sparse similarity in Qdrant is always the dot product. There is no distance metric to choose, unlike the dense side where you pick Cosine, Dot, or Euclidean.

#### Sparse Models

Three models produce sparse vectors, differing in which tokens get weight and how much. **BM25** is statistical, needs no training, and scores only tokens as written. **SPLADE** is neural and expands a text with related terms it did not contain. **miniCOIL** keeps BM25's exact-token vocabulary but weights each occurrence using its context, which is Qdrant's recommendation for new projects. This module uses BM25, the simplest of the three, via FastEmbed's `Qdrant/bm25`.

![Side-by-side comparison of BM25, SPLADE, and miniCOIL across matching behaviour, language support, encoding speed, and retrieval cost.](/courses/beginners/module-3/comparison.png)

#### Indexing Sparse Vectors

Because most dimensions are zero, Qdrant indexes sparse vectors with an **inverted index**, the structure text search engines use: for every token it keeps a posting list, the set of points where that token has a non-zero weight.

```text
Token "nike"    → posting list: [point_1, point_2, point_4, ...]
Token "pegasus" → posting list: [point_1, point_2, point_3, ...]
```

A query walks only the posting lists for tokens it contains and skips every point sharing none of them. HNSW (Module 2) is approximate; Qdrant's sparse index is exact, so no accuracy is traded for speed.

### Head-to-Head Comparison

|  | Dense Search | Sparse Search |
|---|---|---|
| **Strengths** | Synonyms: car = automobile<br>Paraphrasing: "cheap flights" ≈ "affordable airfare"<br>Intent and context<br>With a multilingual model, queries across languages | Exact tokens: model numbers, SKUs, part codes<br>Rare and domain-specific terms<br>Interpretable, so easy to debug |
| **Weaknesses** | Distinguishing tokens averaged into the whole phrase<br>Rare or invented words<br>Serial numbers and codes | Synonyms: car ≠ automobile<br>Paraphrasing and rewordings<br>Anything not stated literally |

The multilingual row depends on the model you choose. The one used in this module, `all-MiniLM-L6-v2`, is English-only; cross-language retrieval needs a multilingual model, which Module 1 covered when choosing one.

### Key Insight

Dense finds what a query means. Sparse finds what it says. Product search, support search, and code search usually carry both at once, which is what the next section is for.

## 3. Hybrid Search: Dense and Sparse

Hybrid search runs both retrievers in the same request and fuses their ranked lists into one result set.

Run the same `Nike Pegasus 40` query through sparse alone and the picture inverts:

| Result | Sparse score |
|--------|--------------|
| Nike Pegasus 40 running shoes | 3.8396 |
| Nike Pegasus 40 womens running shoes | 3.8293 |
| Nike Pegasus 41 running shoes | 1.7007 |

Sparse separates 40 from 41 by more than 2x where dense managed 0.0087, because `40` is simply a different token from `41`. It also can't tell the men's and women's models apart, since their titles share every token the query contains. Dense ranked those two 0.09 apart.

Neither list is right on its own. Fusing them is.

![Hybrid search for the query "Nike Pegasus 40": dense retrieval contributes semantically related running shoes while sparse retrieval locks onto the exact model number, and fusion combines both into one ranked list.](/courses/beginners/module-3/nike-example.png)

### Reciprocal Rank Fusion

Reciprocal Rank Fusion (RRF) merges two ranked lists using each candidate's *position* in them, ignoring the raw scores entirely. That matters because a dense score of 0.87 and a BM25 score of 3.84 are not on the same scale and can't be added. A document ranked highly by both retrievers ends up above one ranked highly by only one.

![Reciprocal Rank Fusion merging a dense ranked list and a sparse ranked list into a single fused ranking, with a candidate appearing in both lists rising to the top.](/courses/beginners/module-3/fusion.png)

## 4. Setting Up Hybrid Search in Qdrant

Hybrid search uses named vectors, dense and sparse stored on the same point, and the Query API to prefetch from each before fusing. A **prefetch** is a sub-query that produces one candidate list; a hybrid query runs two of them and merges the results.

### Step 1: Create a Hybrid Collection

Declare a dense config and a sparse config on the same collection, and create a payload index for every field you will filter on before inserting anything.

```python
# pip install "qdrant-client[fastembed]"

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="YOUR_API_KEY",
)

client.create_collection(
    collection_name="products",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(
            modifier=models.Modifier.IDF  # required for correct BM25 scoring
        ),
    },
)

# Section 6 filters on both of these, so index them before ingestion
for field, schema in [
    ("in_stock", models.PayloadSchemaType.BOOL),
    ("sizes",    models.PayloadSchemaType.INTEGER),
]:
    client.create_payload_index(
        collection_name="products", field_name=field, field_schema=schema,
    )
```

The IDF modifier matters because BM25 sparse vectors deliberately store only term frequency, the `1.67` values from Section 2. `modifier=models.Modifier.IDF` tells Qdrant to compute and apply the inverse-document-frequency half at query time, which is what makes a rare token like `40` outweigh a common one like `shoes`. miniCOIL needs it too, since its scoring builds on the same formula.

### Step 2: Insert Points with Both Vectors

Each point carries a dense embedding and a sparse vector. Pass a `models.Document` and name the model; the client embeds it locally with FastEmbed before upload. `upsert` waits for the write to land, so the next query sees the data.

```python
CATALOG = [
    (1, "Nike Pegasus 40 running shoes",              139, True,  [8, 9, 10, 11]),
    (2, "Nike Pegasus 41 running shoes",              145, True,  [9, 10, 11]),
    (3, "Nike Pegasus Trail 4 trail running shoes",   149, True,  [9, 10]),
    (4, "Nike Invincible 3 road running shoes",       179, True,  [10, 11]),
    (5, "Adidas Ultraboost 22 running shoes",         189, False, [9, 10]),
    (6, "Brooks Ghost 15 neutral running shoes",      129, True,  [10, 11]),
    (7, "Nike Air Zoom Structure 25 stability shoes", 129, True,  [9, 10]),
    (8, "Nike Pegasus 40 womens running shoes",       139, False, [6, 7, 8]),
]

DENSE_MODEL  = "sentence-transformers/all-MiniLM-L6-v2"
SPARSE_MODEL = "Qdrant/bm25"

client.upsert(
    collection_name="products",
    points=[
        models.PointStruct(
            id=pid,
            vector={
                "dense":  models.Document(text=title, model=DENSE_MODEL),
                "sparse": models.Document(text=title, model=SPARSE_MODEL),
            },
            payload={"title": title, "price": price, "in_stock": stock, "sizes": sizes},
        )
        for pid, title, price, stock, sizes in CATALOG
    ],
)
```

Note what is *not* in the embedded text: price, stock, and available sizes are payload fields. They are constraints, not meaning, so they belong in a filter rather than in a vector. Section 6 uses them.

### Step 3: Hybrid Query with Fusion

Prefetch from both indexes, then fuse.

```python
def hybrid_search(query_text, limit=4):
    return client.query_points(
        collection_name="products",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="dense", limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse", limit=20,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    ).points

for r in hybrid_search("Nike Pegasus 40"):
    print(f"{r.score:.4f}  {r.payload['title']}")
```

```text
1.0000  Nike Pegasus 40 running shoes
0.5833  Nike Pegasus 41 running shoes
0.5833  Nike Pegasus 40 womens running shoes
0.4000  Nike Pegasus Trail 4 trail running shoes
```

Both prefetches run in one request and return up to 20 candidates each. The correct product is the only one ranked first by *both* retrievers, so fusion puts it clear of the field, where dense alone had it 0.0087 ahead. The scores are fusion scores, derived from rank position, which is why they no longer resemble either input scale.

## 5. Fusion Strategies

Qdrant supports two fusion strategies.

| Strategy | How it works | When to use it |
|----------|--------------|----------------|
| RRF (Reciprocal Rank Fusion) | Merges by rank position, ignoring raw scores | The default. Safe whenever the two score scales differ, which is nearly always |
| DBSF (Distribution-Based Score Fusion) | Normalizes each retriever's score distribution, then merges | When you trust raw scores to carry magnitude and both retrievers are well calibrated |

Reciprocal Rank Fusion also takes optional parameters once you have something to measure against: `k` adjusts how steeply rank position is discounted, and `weights` favours the stronger retriever rather than dropping the weaker one.

Start with unweighted RRF and move to DBSF or tuned weights only after measuring on a set of queries with known-good answers, tuning on one split and measuring on another. Neither strategy reliably beats the other, so the choice is an evaluation result, not a preference. The [Hybrid Queries documentation](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) covers both in depth.

## 6. Filtering: Works with Any Retrieval Method

Payload filters are not a hybrid-only feature. The same conditions apply to dense-only, sparse-only, and hybrid retrieval, and they are evaluated while the search runs rather than as a cleanup pass afterward. What changes between the three is *where* the filter goes.

Take the constraints a real shopper has: in stock, and available in their size.

```python
shopper_filter = models.Filter(
    must=[
        models.FieldCondition(key="in_stock", match=models.MatchValue(value=True)),
        models.FieldCondition(key="sizes",    match=models.MatchValue(value=11)),
    ]
)
```

`sizes` is a list on each point, and `MatchValue` on a list matches when any element matches, so this reads as "size 11 is among the sizes stocked".

### Filtering a Hybrid Query

The filter goes inside **every** `Prefetch`, so each retriever searches only the valid subset:

```python
def filtered_hybrid_search(query_text, query_filter, limit=4):
    return client.query_points(
        collection_name="products",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="dense", filter=query_filter, limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse", filter=query_filter, limit=20,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    ).points

for r in filtered_hybrid_search("Nike Pegasus 40", shopper_filter):
    print(f"{r.score:.4f}  {r.payload['title']}")
```

```text
1.0000  Nike Pegasus 40 running shoes
0.6667  Nike Pegasus 41 running shoes
0.5000  Nike Invincible 3 road running shoes
0.2000  Brooks Ghost 15 neutral running shoes
```

The women's Pegasus 40 was second in the unfiltered run and is gone: it is out of stock and stops at size 8. The Trail 4 is gone too, since it stops at size 10. Nothing was retrieved and discarded; those points never entered either candidate list.

### Filtering a Dense or Sparse Query

With no prefetch, the filter belongs at the top level as `query_filter`:

```python
results = client.query_points(
    collection_name="products",
    query=models.Document(text="Nike Pegasus 40", model=DENSE_MODEL),
    using="dense",
    query_filter=shopper_filter,
    limit=4,
).points
```

Swap `DENSE_MODEL` for `SPARSE_MODEL` and `using="sparse"` for the sparse equivalent. The placement is identical because there is no prefetch for the filter to belong to.

### Common Mistake: Filters in the Wrong Place

On a hybrid query the client accepts a filter in either place, and only one is right. Passing it as an outer `query_filter` next to `prefetch` lets each retriever search the whole catalog first; the filter then only trims what fusion already produced. Put it inside each `Prefetch` instead, so both retrievers start from the valid subset and come back with 20 candidates that already satisfy the constraint.

A real server applies the outer filter, so the results stay valid. Local mode ignores it and raises no error either way, which is how a notebook can print results that break their own filter while looking perfectly healthy. Per-prefetch placement behaves the same everywhere, which is reason enough to make it the habit.

Filtering also depends on the filtered field being indexed, which is why Step 1 creates both indexes before any data goes in. Module 4 goes deeper into why that ordering matters.

### Try It

Open the notebook and work through these against the catalog above:

1. Query `Nike Pegasus 41` and compare the dense-only, sparse-only, and hybrid rankings. Which retriever separates 41 from 40 more decisively, and by how much?
2. Add a `models.FieldCondition` on `price` with `models.Range(lte=140)` to `shopper_filter` and rerun. Two products should drop out. Predict which before you run it.
3. Query `comfortable shoes for long runs`, a phrase no title contains. Dense ranks the products; sparse returns a flat tie across several of them. Work out which tokens the query and the titles share, and why that produces a tie.

## 7. Beyond Text: Multimodal Search

The same primitive, embed data and search by similarity, applies to any modality. Qdrant stores whatever vectors your model produces, and the retrieval mechanics do not change.

- **Images**: "red dress" retrieves visually similar products, using CLIP or SigLIP.
- **Video**: frames are sampled, embedded, and stored as named vectors.
- **Audio**: hum a melody to find matching songs, using spectrogram embeddings.

Store them as named vectors on the same point, exactly as this module stored dense and sparse together. Each named vector is its own space, so a query has to be embedded by the model that produced the vectors it is searching: to find images with a text query, embed that text with CLIP's text encoder, not the sentence transformer. Module 5 builds this out as the capstone.

## 8. References and Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, Reciprocal Rank Fusion with `k` and weights, Distribution-Based Score Fusion, and formula queries.
- [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/): how sparse vectors work, how SPLADE builds them, and how they compare to BM25.
- [miniCOIL: Sparse Neural Retrieval](/articles/minicoil/): why miniCOIL exists and how it extends BM25 with contextual meaning.
- [Working with miniCOIL](/documentation/fastembed/fastembed-minicoil/): using miniCOIL through FastEmbed.
- [Sparse Vectors Reference](/documentation/manage-data/vectors/#sparse-vectors): `SparseVectorParams`, index configuration, and storage options.
- [Sparse Vector Indexing](/documentation/manage-data/indexing/#sparse-vector-index): how the inverted index works and when it rebuilds into an immutable index.
- [Named Vectors](/documentation/manage-data/vectors/#named-vectors): configuring and querying several vectors on one point.
- [Filtering](/documentation/search/filtering/): full filter syntax and the payload index types each condition needs.
- [Multimodal and Multilingual RAG](/documentation/tutorials-build-essentials/multimodal-search/): a LlamaIndex tutorial building retrieval over images and text in a shared embedding space.

## What's Next: Module 4

Next we go from primitives to judgment, designing a complete vector search system end to end:

- The five layers of a vector search stack: query, indexing, storage, knowledge, and distribution
- A worked example: designing a news search system, decision by decision
- Filtering in production: how the query planner combines filters with vector search, and multitenancy via payload filters
- The production RAG pipeline, from query understanding to generation
- Deployment options: Local, Docker, Managed Cloud, Hybrid Cloud, Private Cloud, and Edge
