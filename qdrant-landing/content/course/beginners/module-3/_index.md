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

#### TL;DR

Module 2 showed you where your data lives and how Qdrant retrieves it. 
In this module, you'll learn what that retrieval misses and how to cover the gap. 
You'll explore dense and sparse vectors, BM25, and the inverted index, then see 
why a product code defeats either one alone. You'll also learn how fusion merges 
two ranked lists, and where a filter belongs so both retrievers respect it. 
By the end, you'll have built a hybrid collection, run a fused query, 
and filtered it correctly.


## Today's Path

1. Where We Left Off
2. The Two Families of Search
3. Hybrid Search: Dense and Sparse
4. Setting Up Hybrid Search in Qdrant
5. Fusion Strategies
6. Filtering: Works with Any Retrieval Method
7. Knowledge Check
8. References & Further Reading

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

Dense ranks the right shoe first, so nothing here looks broken. Look at the margin: **0.0087**, about one percent of the top score. To the model, "Pegasus 40" and "Pegasus 41" are near-identical statements about running shoes, because that is what they are. The digit a shopper cares about is one token out of five, averaged into a vector describing the whole phrase.

A margin that thin holds across eight products. Across eighty thousand, with every colorway and width in the catalog, something will drift into that one percent and take the top slot. Model numbers, SKUs, and part codes need matching, not neighborhood. That is the gap sparse search fills.

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

Read the gap, not the absolute number: what makes 0.73 meaningful is the distance from the 0.20, not the value on its own.

### Sparse Search

![A sparse vector drawn as a long mostly-empty row, with weights on only the handful of positions matching tokens present in the text.](/courses/beginners/module-3/sparse-search.png)

Sparse vectors are token-based: each dimension corresponds to a token, only the tokens present carry a weight, and everything else is zero. Storing that mostly-zero row would be wasteful, so a sparse vector is two parallel arrays, the `indices` of the non-zero dimensions and the `values` at those positions:

```python
# BM25 vector for "Nike Pegasus 40 running shoes"
indices = [1974139272, 24614856, 1784631546, 243905464, 303109060]
values  = [1.67, 1.67, 1.67, 1.67, 1.67]
```

Five tokens, five weights, nothing else stored. The indices are hashes of each token rather than positions in a word list, which is why they are large. The values are uniform because BM25 produces only half the score, the part counting how often a token appears. Qdrant computes the other half at query time.

Sparse retrieval does not match characters, which is a common assumption. BM25 first splits text into tokens and cuts each token back to its root (stemming), so `SKU-48291` and `SKU-48292` still share the token `sku`. <br>
What it gives you is that `40` and `41` are *different tokens* with no relationship at all, where dense placed them 0.0087 apart. The distinguishing token gets its own dimension instead of being averaged away.

Sparse similarity in Qdrant is always the dot product, with no metric to choose, unlike the dense side where you pick Cosine, Dot, or Euclidean.

#### Sparse Models

This module uses BM25, a statistical scoring method that requires no training. It scores the terms already present in the text.

Two trained models extend BM25:

- **SPLADE** expands the text with related terms, allowing a document to match a query even when they share none of the same words.
- **miniCOIL** keeps the original terms but weights them based on their surrounding context. We recommend it for new projects.

Switching between these models requires only a one-line change. Start with BM25, then read [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/) or [miniCOIL](/articles/minicoil/) when you need more.

#### Indexing Sparse Vectors

Because most dimensions are zero, Qdrant stores sparse vectors in an inverted index: rather than a row per point, it keeps one list per token recording which points contain that token and its weight.

```text
Token "nike"    → list: [point_1, point_2, point_4, ...]
Token "pegasus" → list: [point_1, point_2, point_3, ...]
```

A query reads only the lists for the tokens it contains, summing weights as it goes, so it scores just the points that share at least one token with the query. HNSW from Module 2 is approximate, trading a little accuracy for speed. The sparse index scores every candidate those lists hold, so its ranking is exact.

### Dense and Sparse, Side by Side

Module 1 covered the strengths of dense vectors, and those strengths apply here too. Dense vectors handle synonyms, paraphrases, and intent well, but they can miss cases where one exact token carries the meaning, such as a serial number, rare term, or invented product name. <br>
Sparse vectors make the opposite tradeoff. They work well for exact tokens and domain-specific terms, but they cannot recognize reworded content when the query and document share no words. <br>
One caveat is cross-language retrieval. The model used here, `sentence-transformers/all-MiniLM-L6-v2`, supports English only. For cross-language retrieval, use a multilingual embedding model.

Dense finds what a query means. Sparse finds what it says. Most real catalogs carry both, a name a shopper paraphrases and a model number they type exactly, which is what the next section builds.

## 3. Hybrid Search: Dense and Sparse

Hybrid search runs both retrievers in the same request and combines their ranked lists into one result set.

Run the same `Nike Pegasus 40` query through sparse alone and the picture inverts. The top three:

| Result | Sparse score |
|--------|--------------|
| Nike Pegasus 40 running shoes | 3.8396 |
| Nike Pegasus 40 womens running shoes | 3.8293 |
| Nike Pegasus 41 running shoes | 1.7007 |

Sparse pushes the 41 down to third, because `40` is a different token from `41`. But it now has dense's problem on a different pair: the men's and women's Pegasus 40 share every token the query contains, so it separates them by 0.0103 on a 3.8396 top score, roughly a quarter of a percent. Dense had those two 0.09 apart and no trouble at all.

Each retriever ranks the right shoe first, and each leaves it a hair ahead of something wrong. Neither is safe alone.

![Hybrid search for the query "Nike Pegasus 40": dense retrieval contributes semantically related running shoes while sparse retrieval locks onto the exact model number, and fusion combines both into one ranked list.](/courses/beginners/module-3/nike-example.png)

### Fusion

**Fusion** combines the ranked results from two retrievers into a single list. After both retrievers finish, Qdrant applies fusion on the server to determine the final ranking. <br>
Qdrant supports two fusion strategies: Reciprocal Rank Fusion and Distribution-Based Score Fusion. See the [Hybrid Queries documentation](/documentation/search/hybrid-queries/) for details and available parameters.

**Reciprocal Rank Fusion (RRF)** is the default. It merges the lists using each candidate's *position* and ignores the raw scores entirely, which matters because a dense score of 0.87 and a BM25 score of 3.84 sit on unrelated scales and cannot be meaningfully added. A document ranked highly by both retrievers finishes above one ranked highly by only one.

![Reciprocal Rank Fusion merging a dense ranked list and a sparse ranked list into a single fused ranking, with a candidate appearing in both lists rising to the top.](/courses/beginners/module-3/fusion.png)

## 4. Setting Up Hybrid Search in Qdrant

Hybrid search uses named vectors, dense and sparse on the same point, and the Query API to run a sub-query against each before fusing. A **prefetch** is one of those sub-queries: it produces a candidate list that fusion then merges.

### Step 1: Create a Hybrid Collection

Two things are new since Module 2. The collection declares a sparse config alongside the dense one, so both vectors live on the same point. And that sparse config carries a `modifier`, which has no dense equivalent: it tells Qdrant to compute the second half of the BM25 score at query time, the inverse document frequency. That half is what makes a rare token like `40` outweigh a common one like `shoes`, so without it BM25 scoring is wrong rather than merely untuned. miniCOIL needs the same modifier.

Install the client with FastEmbed support:

```bash
pip install "qdrant-client[fastembed]"
```

Then create the collection and its payload indexes:

```python
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
            modifier=models.Modifier.IDF,
        ),
    },
)

client.create_payload_index(
    collection_name="products",
    field_name="in_stock",
    field_schema=models.PayloadSchemaType.BOOL,
)
client.create_payload_index(
    collection_name="products",
    field_name="sizes",
    field_schema=models.PayloadSchemaType.INTEGER,
)
client.create_payload_index(
    collection_name="products",
    field_name="price",
    field_schema=models.PayloadSchemaType.FLOAT,
)
```

**Index Before Ingestion.** Create payload indexes before you ingest data. Qdrant can add an index later and still filter correctly, but it must rebuild the index for existing points. Creating it first lets Qdrant build the index as it writes the data. <br>
Qdrant Cloud also enables **strict mode** by default. These guardrails reject queries that could be expensive enough to destabilize a cluster. Filtering on an unindexed field is one such case, so Qdrant returns a `400` error instead of running a slow query.

### Step 2: Insert Points with Both Vectors

Each point carries a dense vector and a sparse vector. Pass a `models.Document` and name the model, and the client embeds the text locally with FastEmbed before upload. `upsert` waits for the write to land, so the next query sees the data.

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

Only the title is embedded. Price, stock, and sizes are constraints rather than meaning, so they sit in the payload where a filter can match them exactly.

### Step 3: Hybrid Query with Fusion

```python
def hybrid_search(query_text, limit=4):
    return client.query_points(
        collection_name="products",
        # One sub-query per vector, both running in the same request
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="dense",
                # A prefetch limit must be at least the outer limit
                limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse",
                limit=20,
            ),
        ],
        # Fusion merges the two candidate lists by rank position
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    ).points

for r in hybrid_search("Nike Pegasus 40"):
    print(f"{r.score:.4f}  {r.payload['title']}")
```

Real output:

```text
1.0000  Nike Pegasus 40 running shoes
0.5833  Nike Pegasus 41 running shoes
0.5833  Nike Pegasus 40 womens running shoes
0.4000  Nike Pegasus Trail 4 trail running shoes
```

Every run in this module put the right shoe first, so the order is not what improved. What changed is the margin: dense and sparse alone each left the right shoe under two percent clear of a rival (Sections 1 and 3), while hybrid with RRF widens that lead to **41.7%** (1.0000 vs. 0.5833). The Pegasus 40 is the only product ranked first by *both* retrievers, and fusion turns that agreement into distance. Fusion scores come from rank position, which is why they resemble neither input scale.

## 5. Fusion Strategies

The difference between the two strategies is what each does with magnitude. RRF knows only that a document came first, second, or third, so a runaway top match and a photo finish look identical to it. DBSF rescales each retriever's scores onto a comparable range before combining them, which keeps that information at the cost of depending on how those scores are distributed.

| Strategy | How it works | When to use it |
|----------|--------------|----------------|
| RRF (Reciprocal Rank Fusion) | Merges by rank position, discarding raw scores | The default, and the safe choice whenever the two score scales differ, which is nearly always |
| DBSF (Distribution-Based Score Fusion) | Normalizes each retriever's score distribution, then combines | When the size of the gaps between scores carries information worth keeping |

Neither reliably beats the other, so treat the choice as an evaluation result rather than a preference: start with RRF and switch only after measuring on a set of queries with known-good answers. The [Hybrid Queries documentation](/documentation/search/hybrid-queries/) covers both, along with their tuning parameters.

## 6. Filtering: Works with Any Retrieval Method

Payload filters are not a hybrid-only feature. The same conditions apply to dense-only, sparse-only, and hybrid retrieval, and Qdrant evaluates them during the search rather than after it, so a filtered search still returns a full result set. What changes is *where* the filter goes.

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

Put the filter inside every `Prefetch`, so each retriever searches only the valid subset:

```python
def filtered_hybrid_search(query_text, query_filter, limit=4):
    return client.query_points(
        collection_name="products",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query_text, model=DENSE_MODEL),
                using="dense",
                # The filter goes here, not at the top level, so this
                # retriever spends its 20 candidates on eligible points
                filter=query_filter,
                limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse",
                # The same filter, repeated for the second retriever
                filter=query_filter,
                limit=20,
            ),
        ],
        query=models.RrfQuery(rrf=models.Rrf()),
        limit=limit,
    ).points

for r in filtered_hybrid_search("Nike Pegasus 40", shopper_filter):
    print(f"{r.score:.4f}  {r.payload['title']}")
```

Real output:

```text
1.0000  Nike Pegasus 40 running shoes
0.6667  Nike Pegasus 41 running shoes
0.5000  Nike Invincible 3 road running shoes
0.2000  Brooks Ghost 15 neutral running shoes
```

The women's Pegasus 40 was second in the unfiltered run and is gone: out of stock, and it stops at size 8. The Trail 4 is gone too, since it stops at size 10. Neither was retrieved and discarded; they never entered a candidate list.

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

Whichever retriever you use, the filter admits the same four products, the ones in stock and stocked in size 11: the Pegasus 40 and 41, the Invincible 3, and the Ghost 15. Eligibility does not depend on the retriever. Only the order they come back in does, which is the whole reason the choice of retriever still matters after filtering.

<aside role="status">
The companion notebook uses local mode with `QdrantClient(":memory:")`. In this mode, Qdrant ignores a top-level filter on a hybrid query instead of returning an error, so the notebook may show results that don't match the filter.

Filters defined inside each `Prefetch` work consistently in both local mode and Qdrant Cloud.
</aside>

### Try It

Open the notebook and work through these against the catalog above:

1. Query `Nike Pegasus 41` and compare the dense-only, sparse-only, and hybrid rankings. Which retriever separates 41 from 40 more decisively, and by how much?
2. Add a `models.FieldCondition` on `price` with `models.Range(lte=140)` to `shopper_filter` and rerun. Two products should drop out. Predict which before you run it.
3. Query `comfortable shoes for long runs`, a phrase no title contains in full. Sparse can only score the titles that share `shoes` or `running`, and it orders them by how rare each token is and how long the title is, not by how well the shoe answers the question. Decide which retriever you would put in front of a shopper typing this, then run the hybrid version and see whether fusion changes your answer.

<aside role="status">
The same primitive extends beyond text: images with CLIP or SigLIP, video as sampled frames, audio as spectrogram embeddings, stored as named vectors exactly as this module stored dense and sparse together. Module 5 builds a full multimodal search system as the capstone.
</aside>

## 7. Knowledge Check

**Q: A shopper searches your catalog for `iPad Air`, and dense-only search returns `iPad Mini` first. Both are reasonable matches for the words, but the ranking is wrong. What would you add, and why would it fix this specific failure?**

<details>
<summary>Show answer</summary>

Add sparse (BM25) retrieval alongside dense, combined through hybrid search. Dense embeds the whole phrase into one vector, so "Air" and "Mini" barely move the score, the same failure mode as Pegasus 40 versus 41. Sparse treats "Air" and "Mini" as distinct tokens with no relationship, so it separates the two products cleanly. Hybrid fusion lets the sparse side catch what dense alone misses.

</details>

**Q: Two products differ only by a rare model suffix, and your BM25 sparse vectors give every token in the title the exact same weight. A teammate says BM25 is broken and suggests switching to SPLADE. What do you tell them?**

<details>
<summary>Show answer</summary>

BM25 is not broken. It stores only the token-frequency half of the score by design; the half that discounts common tokens and rewards rare ones is applied at query time. Check the sparse vector config for `modifier=models.Modifier.IDF` before assuming the model needs replacing.

</details>

**Q: You are comparing a dense score of 0.87 to a BM25 score of 3.84 to decide which retriever's result to trust more. What is wrong with that comparison, and how does RRF sidestep the problem?**

<details>
<summary>Show answer</summary>

The two scores live on unrelated scales, so treating one as "stronger" than the other is meaningless. RRF avoids the comparison entirely: it merges candidates by rank position rather than raw score, so results from retrievers with incompatible scales can still be combined consistently.

</details>

**Q: You filter a hybrid query and get results that violate the filter, with no error. What is the most likely cause?**

<details>
<summary>Show answer</summary>

You are in local mode with the filter at the top level rather than inside each prefetch. A real server would have applied it, and per-prefetch placement behaves the same everywhere.

</details>

## 8. References & Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, both fusion strategies, and their tuning parameters.
- [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/): how sparse vectors work and how SPLADE compares to BM25.
- [miniCOIL: Sparse Neural Retrieval](/articles/minicoil/): why miniCOIL exists and how it extends BM25 with contextual meaning.
- [Filtering](/documentation/search/filtering/): full filter syntax and the payload index each condition needs.
- [Named Vectors](/documentation/manage-data/vectors/#named-vectors): configuring and querying more than one vector on a single point.

## What's Next: Module 4

Eight products can fit in one collection and one query. A multilingual news archive with strict tenant isolation and a generation step requires a more deliberate design. <br>
Module 4 works through this system end to end, decision by decision. You'll learn how the layers of the stack work together, how filters behave when the query planner selects a strategy, and how deployment choices range from Docker to Qdrant Edge.
