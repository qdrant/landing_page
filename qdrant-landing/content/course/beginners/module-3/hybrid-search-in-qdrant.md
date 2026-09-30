---
title: "Setting Up Hybrid Search in Qdrant"
short_description: "Module 3 of the Beginner Course: named vectors, prefetch, and the Query API, with working code."
description: "Build hybrid search in Qdrant: store dense and sparse vectors on the same point, then use prefetch and the Query API to run and fuse both retrievers."
weight: 5
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Setting Up Hybrid Search in Qdrant

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

**Index Before Ingestion.** Create payload indexes before you ingest data. Qdrant can add an index later and still filter correctly, but it must rebuild the index for existing points. Creating it first lets Qdrant build the index as it writes the data.

Qdrant Cloud also enables [**strict mode**](/documentation/ops-configuration/administration/#strict-mode) by default. These guardrails reject queries that could be expensive enough to destabilize a cluster. Filtering on an unindexed field is one such case, so Qdrant returns a `400` error instead of running a slow query.

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

Every run in this module put the right shoe first, so the order is not what improved. What changed is the margin: dense and sparse alone each left the right shoe under two percent clear of a rival ([Where We Left Off](/course/beginners/module-3/where-we-left-off/) and [Hybrid Search: Dense and Sparse](/course/beginners/module-3/hybrid-search/)), while hybrid with RRF widens that lead to **41.7%** (1.0000 vs. 0.5833). The Pegasus 40 is the only product ranked first by *both* retrievers, and fusion turns that agreement into distance. Fusion scores come from rank position, which is why they resemble neither input scale.
