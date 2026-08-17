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

**TL;DR:** Dense search finds what a query means and blurs the exact parts. Sparse search finds what a query says and misses every rewording. On a query like a product code neither is safe alone, so Qdrant runs both in one request and fuses the two ranked lists. You will build that pipeline, then filter it correctly.

## Today's Path

1. Where We Left Off
2. The Two Families of Search
3. Hybrid Search: Dense and Sparse
4. Setting Up Hybrid Search in Qdrant
5. Fusion Strategies
6. Filtering: Works with Any Retrieval Method
7. Beyond Text: Multimodal Search
8. Knowledge Check
9. References & Further Reading

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

Five tokens, five weights, nothing else stored. The indices are hashes of each token rather than positions in a word list, which is why they are large. The values are uniform because BM25 produces only half the score, the part counting how often a token appears; Qdrant computes the other half at query time, and Step 1 configures the field for it.

Sparse retrieval does not match characters, which is a common assumption. BM25 tokenizes and stems first, so `SKU-48291` and `SKU-48292` still share the token `sku`. What it gives you is that `40` and `41` are *different tokens* with no relationship at all, where dense placed them 0.0087 apart. The distinguishing token gets its own dimension instead of being averaged away.

Sparse similarity in Qdrant is always the dot product, with no metric to choose, unlike the dense side where you pick Cosine, Dot, or Euclidean.

#### Sparse Models

This module uses **BM25**: statistical, no training needed, and it weights the tokens a text contains without adding any it does not. Two neural alternatives go further. **SPLADE** expands a text with related terms, and **miniCOIL** keeps BM25's vocabulary but weights each token using its context, which is what Qdrant recommends for new projects. Swapping between them is a one-line model change, so start here and read [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/) or [miniCOIL](/articles/minicoil/) when you need more.

#### Indexing Sparse Vectors

Because most dimensions are zero, Qdrant stores sparse vectors in an **inverted index**: rather than a row per point, it keeps one list per token recording which points contain that token and with what weight. Each list is a **posting list**.

```text
Token "nike"    → posting list: [point_1, point_2, point_4, ...]
Token "pegasus" → posting list: [point_1, point_2, point_3, ...]
```

A query reads only the posting lists for the tokens it contains, summing weights as it goes, and never touches a point sharing none of them. HNSW from Module 2 is approximate, trading a little accuracy for speed. The sparse index makes no such trade: it is exact.

### Dense and Sparse, Side by Side

Module 1 covered the strengths and they hold here. Dense handles synonyms, paraphrasing, and intent, and struggles wherever one distinguishing token carries the meaning: serial numbers, rare words, invented product names. Sparse is the mirror image, strong on exact tokens and domain jargon, and blind to any rewording that shares no words. One caveat on cross-language retrieval: the model used here, `sentence-transformers/all-MiniLM-L6-v2`, is English-only, so it needs the multilingual model Module 1 discussed.

Dense finds what a query means. Sparse finds what it says. Product search, support search, and code search usually need both at once, which is what the next section is for.

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

**Fusion** is the step that merges two ranked lists into one. It runs on the server once both retrievers finish, and it decides the final order. Qdrant offers two strategies, Reciprocal Rank Fusion and Distribution-Based Score Fusion; Section 5 covers the choice, and the [Hybrid Queries documentation](/documentation/search/hybrid-queries/) covers their parameters.

**Reciprocal Rank Fusion (RRF)** is the default. It merges the lists using each candidate's *position* and ignores the raw scores entirely, which matters because a dense score of 0.87 and a BM25 score of 3.84 sit on unrelated scales and cannot be meaningfully added. A document ranked highly by both retrievers finishes above one ranked highly by only one.

![Reciprocal Rank Fusion merging a dense ranked list and a sparse ranked list into a single fused ranking, with a candidate appearing in both lists rising to the top.](/courses/beginners/module-3/fusion.png)

## 4. Setting Up Hybrid Search in Qdrant

Hybrid search uses named vectors, dense and sparse on the same point, and the Query API to run a sub-query against each before fusing. A **prefetch** is one of those sub-queries: it produces a candidate list that fusion then merges.

### Step 1: Create a Hybrid Collection

Two things are new since Module 2. The collection declares a sparse config alongside the dense one, so both vectors live on the same point. And that sparse config carries a `modifier`, which has no dense equivalent: it tells Qdrant to compute the second half of the BM25 score at query time, the half that makes a rare token like `40` outweigh a common one like `shoes`. Without it, BM25 scoring is wrong rather than merely untuned.

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

Index before ingestion. An index added later still filters correctly, but the structure Qdrant uses to skip non-matching points during a search is built as the data is written, so adding one afterward means a rebuild. On Qdrant Cloud, strict mode is on by default and filtering an unindexed field returns a 400 rather than a slow answer.

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

Every run in this module put the right shoe first, so the order is not what improved. The margin is:

| Retriever | Top score | Runner-up | Lead |
|-----------|-----------|-----------|------|
| Dense only | 0.8713 | 0.8626 | 1.0% |
| Sparse only | 3.8396 | 3.8293 | 0.3% |
| Hybrid with RRF | 1.0000 | 0.5833 | 41.7% |

Alone, each retriever leaves the right product about one percent clear of a wrong one, close enough that a larger catalog will eventually close the gap. The Pegasus 40 is the only product ranked first by *both*, and fusion turns that agreement into distance. Fusion scores come from rank position, which is why they resemble neither input scale.

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
                filter=query_filter,
                limit=20,
            ),
            models.Prefetch(
                query=models.Document(text=query_text, model=SPARSE_MODEL),
                using="sparse",
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

### One Thing to Watch: Local Mode

A hybrid query accepts a filter in either place, and a real server honors both: a top-level `query_filter` does reach the prefetches, so results stay valid either way. Local mode is where they diverge. It ignores the top-level filter and raises no error, so a notebook can print results that break their own filter while looking healthy. Per-prefetch placement behaves the same everywhere, which is reason enough to make it the habit.

### Try It

Open the notebook and work through these against the catalog above:

1. Query `Nike Pegasus 41` and compare the dense-only, sparse-only, and hybrid rankings. Which retriever separates 41 from 40 more decisively, and by how much?
2. Add a `models.FieldCondition` on `price` with `models.Range(lte=140)` to `shopper_filter` and rerun. Two products should drop out. Predict which before you run it.
3. Query `comfortable shoes for long runs`, a phrase no title contains. Dense ranks the products, while sparse returns a flat tie across the five titles holding both `running` and `shoes`. Work out why sharing exactly the same query tokens produces a tie.

## 7. Beyond Text: Multimodal Search

The same primitive, embed data and search by similarity, applies to any modality: images with CLIP or SigLIP, video as sampled frames, audio as spectrogram embeddings. Qdrant stores whatever vectors your model produces and the retrieval mechanics do not change.

Store them as named vectors on the same point, exactly as this module stored dense and sparse together. Each named vector is its own space, so a query has to be embedded by the model that produced the vectors it is searching: to find images with a text query, embed that text with CLIP's text encoder, not the sentence transformer. Module 5 builds this out as the capstone.

## 8. Knowledge Check

**Q: Dense ranked the Pegasus 40 first. Why was that not good enough?**

A: It led the Pegasus 41 by 0.0087, about one percent. Ranking first by a margin that thin is not a reliable result, and a bigger catalog will eventually produce something closer.

**Q: A BM25 sparse vector comes back with identical weights on every token. Is something broken?**

A: No. BM25 stores only the token-frequency half of the score. The half that discounts common tokens is applied at query time, which is what `modifier=models.Modifier.IDF` on the sparse field switches on.

**Q: Why does RRF merge by rank instead of by score?**

A: The two retrievers produce scores on unrelated scales, around 0.87 for dense and 3.84 for BM25 here. Rank position is the only thing they share.

**Q: You filter a hybrid query and get results that violate the filter, with no error. What is the most likely cause?**

A: You are in local mode with the filter at the top level rather than inside each prefetch. A real server would have applied it, and per-prefetch placement behaves the same everywhere.

## 9. References & Further Reading

- [Hybrid Queries](/documentation/search/hybrid-queries/): prefetch semantics, both fusion strategies, and their tuning parameters.
- [Understanding SPLADE and Sparse Vectors](/articles/sparse-vectors/): how sparse vectors work and how SPLADE compares to BM25.
- [miniCOIL: Sparse Neural Retrieval](/articles/minicoil/): why miniCOIL exists and how it extends BM25 with contextual meaning.
- [Filtering](/documentation/search/filtering/): full filter syntax and the payload index each condition needs.
- [Named Vectors](/documentation/manage-data/vectors/#named-vectors): configuring and querying more than one vector on a single point.

## What's Next - Module 4

Next we go from primitives to judgment, designing a complete vector search system end to end:

- The five layers of a vector search stack: query, indexing, storage, knowledge, and distribution
- A worked example: designing a news search system, decision by decision
- Filtering in production: how the query planner combines filters with vector search, and multitenancy via payload filters
- The production RAG pipeline, from query understanding to generation
- Deployment options: Local, Docker, Managed Cloud, Hybrid Cloud, Private Cloud, and Edge
