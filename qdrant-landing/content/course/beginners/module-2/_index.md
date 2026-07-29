---
title: "Module 2: First Principles of Vector Search"
short_description: "Module 2 of the Beginners course: how data is stored, indexed, and retrieved in Qdrant."
description: "Understand collections, points, vectors, payloads, HNSW, chunking, and the ingestion pipeline. Move from theory to actual system design in Qdrant."
isLesson: true
weight: 30
---

{{< date >}} Module 2 {{< /date >}}

# First Principles of Vector Search

<div class="video">
<iframe
  src="https://www.youtube.com/embed/zrUswSTeQMI?rel=0"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

Understand collections, points, vectors, payloads, and the HNSW index, and move from theory to actual system design in Qdrant.

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/Beginner-course/Module2.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

<br/>

**TL;DR:** Module 1 explained *why* semantic search works. This module is about *where the data actually lives*: how Qdrant organizes collections, points, vectors, and payloads; how it finds your top-K matches fast using an index called HNSW instead of scanning everything; how to filter results by metadata; how to split long documents into chunks before embedding them; and how all of that comes together into one working ingestion pipeline, from an empty cluster to your first filtered query.

## Today's Path

1. From Idea to System
2. Core Data Model
3. Distance Metrics
4. Top-K Retrieval
5. How Search Is Fast: HNSW
6. Payload Filtering
7. Chunking Strategies
8. Ingestion Pipeline: End-to-End
9. References & Further Reading

## 1. From Idea to System

In Module 1, we saw how search evolved from matching words to understanding meaning. Now we move from theory to actual system design. This module covers every building block you need to go from raw text to a running Qdrant collection.

- **Raw Text**
Documents, articles, PDFs

- **Chunk**
Split into passages

- **Embed**
Convert to vectors

- **Store**
Upsert to Qdrant — insert a point if its ID is new, update it if the ID already exists

- **Query**
Retrieve the top-K results — the K most similar matches to your query

![Flow Diagram](/courses/beginners/module-2/flow.png)

## 2. Core Data Model

Qdrant organizes data in a simple three-level hierarchy. Understanding this structure is the foundation for everything else in the course.

```
Collection
    └── Point
        ├── id
        ├── vector
        └── payload
```

<!--
TODO (image regen, blocks shipping): data-model.png has the banned term baked
into its subtitle (it uses "vector database", and an em-dash). Rebuild from the
Docs/Diagrams Figma library with palette tokens. Corrected subtitle text:
"Each point in a vector search engine wraps three pieces together: an ID, a
vector, and a payload." Use "vector search engine", never "vector database",
and no em-dashes.
-->
![Data model hierarchy: a collection contains points, and each point wraps together an ID, a vector, and a payload](/courses/beginners/module-2/data-model.png)

### Collection

Like a table in a relational database. Stores vectors of a fixed size and a chosen distance metric. Every point in a collection must have a vector of the same dimension.

### Point

The atomic unit of data. Every point has an ID (integer or UUID), a vector, and an optional payload. Points are what you search, retrieve, and filter.

### Vector

A list of floating-point numbers (such as 384 or 768 values, known as dimensions) that represent the meaning of the original content. Similar content produces similar vectors.

### Payload

Arbitrary JSON metadata attached to a point. Used for filtering, retrieval scoping, and result enrichment. Can hold strings, numbers, booleans, geo coordinates, or arrays.

<!--
TODO (verify image pairing): swapped so the payload concept uses payload.png and
the filtering section (§6) uses data-flow-2.png. The filenames were previously
crossed. Confirm the actual image contents match these sections.
-->
![A point's payload is JSON metadata attached alongside its vector, such as title, category, year, and region](/courses/beginners/module-2/payload.png)

### Your Qdrant Cluster

A collection needs a running Qdrant instance, a cluster, to live in. Qdrant Cloud has a free tier that takes about a minute to set up; section 8 walks through it step by step, screenshots included. 

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",  # your cluster URL, from section 8
    api_key="<your-api-key>",                                    # your cluster API key, from section 8
)
# For quick, throwaway experiments without a server, you can instead use:
# client = QdrantClient(":memory:")
```

### Creating a Collection

Once connected, you create a collection by fixing two things: the size of vectors it will accept and the distance metric used for similarity.

```python
client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        size=384,                      # must match your embedding model
        distance=models.Distance.COSINE,
    ),
)
```

### Inserting a Point

Each point carries an ID, a vector (the embedding of your content), and a payload (any metadata you want to filter or return later).

```python
from qdrant_client.models import PointStruct

client.upsert(
    collection_name="articles",
    points=[
        PointStruct(
            id=1,
            vector=[0.12, -0.87, 0.33, ...],   # 384-dim embedding
            payload={
                "title": "Car Repair Guide",
                "category": "automotive",
                "year": 2024,
                "region": "EU",
            },
        )
    ],
)
```

## 3. Distance Metrics

When you query a collection, Qdrant compares your query vector against the collection using the distance metric you chose at collection creation, and returns the closest matches. The most common for text is cosine similarity. (Checking literally every vector would be slow at scale — section 5 covers how Qdrant avoids that with the HNSW index.)

| Metric | Notes |
|--------|-------|
| models.Distance.COSINE | Measures angle between vectors. Robust to magnitude differences. |
| models.Distance.DOT | Faster than cosine when vectors are unit-length at index time. |
| models.Distance.EUCLID | Measures absolute distance. Sensitive to vector magnitude. |
| models.Distance.MANHATTAN | Sum of absolute differences. Less sensitive to outliers than Euclidean; use when the embedding model was trained with L1. |

### Rule

Choose your distance metric at collection creation; it cannot be changed later. If you need a different metric, create a new collection with that metric and re-ingest your data into it — there's no in-place conversion. To avoid breaking callers during that switch, point a [collection alias](/documentation/manage-data/collections/#collection-aliases) at whichever collection is currently live, and repoint it to the new one once re-ingestion is done. HNSW parameters like m and ef_construct, by contrast, can be updated after creation, and Qdrant will rebuild the index in the background with no downtime. Match your distance metric to what your embedding model was trained with — most sentence-transformer models use cosine.

## 4. Top-K Retrieval

A search query is itself a vector. Qdrant finds the K points in the collection whose vectors are most similar to the query vector, ranked by similarity score.

```python
results = client.query_points(
    collection_name="articles",
    query=[0.12, -0.87, 0.33, ...],   # your query vector
    limit=3,                            # return top 3
)

for r in results.points:
    print(r.id, r.score, r.payload)
```

![Top-K Diagram](/courses/beginners/module-2/top-k.png)

### Why K Matters

Returning too few results (K=3) misses relevant content. Returning too many (K=100) creates noise in results. A common approach is to overfetch: retrieve a larger candidate pool, then rerank it down to the smaller K you actually show the user. Qdrant supports this natively via [multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) - for example, prefetching a large candidate set and reranking it down to a much smaller final `limit`. We'll cover reranking in detail later.

## 5. How Search Is Fast: HNSW

Searching millions of vectors by computing similarity against every single one (brute force) is prohibitively slow. Qdrant uses HNSW (Hierarchical Navigable Small World), a graph-based approximate nearest neighbor (ANN) index that makes large-scale search fast without sacrificing meaningful accuracy.

<!--
TODO (image regen, blocks shipping): hnsw.png step callouts are numbered
backwards. Renumber top-to-bottom so the order matches how search actually
runs: 1 = enter at the top layer, 2 = navigate toward the query through
progressively denser layers, 3 = collect the K nearest neighbors at the bottom.
Also fix the spelling "neighbour" to "neighbor" (American English). Rebuild
from the Docs/Diagrams Figma library with palette tokens.
-->
![HNSW search enters at the top layer, navigates toward the query through progressively denser layers, and collects the K nearest neighbors at the bottom](/courses/beginners/module-2/hnsw.png)

### How HNSW Works

- **Graph structure**: Each vector is a node. Nodes are connected to their nearest neighbors by bidirectional edges, forming a navigable graph.
- **Hierarchical layers**: The graph has multiple layers. The top layer has few nodes and long-range connections. Lower layers are denser with short-range connections.
- **Search by traversal**: Query entry starts at the top layer. The search "jumps" through neighbors, zooming in on the region of interest at each layer.
- **Approximate, not exact**: HNSW trades a small accuracy loss for massive speed gains. In practice, the accuracy loss is negligible for retrieval quality.

### Tunable Parameters

HNSW has a few tunable parameters — `m`, `ef_construct`, and `hnsw_ef` — that trade off search speed, **recall** (the fraction of the true nearest neighbors your approximate search actually finds), memory usage, and indexing time. The defaults work well for most use cases; only tune them once you're measuring an actual recall or latency gap against a benchmark, not before. You haven't run a search yet at this point in the course, so we won't go deeper here — the [Qdrant Essentials Course](/course/essentials/day-2/what-is-hnsw/) covers HNSW tuning in full once you're ready for it.

## 6. Payload Filtering

Real-world search is always similarity plus constraints. Payload filtering lets you apply hard conditions during HNSW traversal, not after retrieval. This keeps results both semantically relevant and legally/logically valid.

This searches by vector similarity as usual, but only among points whose payload passes the filter: `Filter` is the overall condition, `must` is a list of conditions that all have to be true (AND logic), and each `FieldCondition` checks one payload field — here, that `category` equals `"automotive"`.

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="articles",
    query=[...],
    query_filter=Filter(
        must=[
            FieldCondition(
                key="category",              # the payload field to check
                match=MatchValue(value="automotive")  # keep only points where category == "automotive"
            )
        ]
    ),
    limit=5,
)
```

![A payload filter narrows a similarity search to only points whose metadata matches a condition, such as category equals automotive](/courses/beginners/module-2/data-flow-2.png)

### Filter Types

| Condition | What it does | Example use case |
|-----------|--------------|------------------|
| must | All conditions must be true (AND logic) | Category = automotive AND year >= 2022 |
| should | At least one condition must be true (OR logic) | Category = automotive OR category = transport |
| must_not | Exclude matching points | Exclude documents flagged as deleted or expired |
| Range | Numeric range comparisons (gte, lte, gt, lt) | year between 2020 and 2024 |
| Geo | Geospatial radius or bounding box filter | Restaurants within 5 km of user location |

### Index Your Filter Fields

For fields you filter on frequently, create a payload index. Without an index, Qdrant scans every payload at query time. With one, Qdrant jumps directly to matching points rather than scanning the collection, making filtered queries run significantly faster. Use `client.create_payload_index()` for any field that appears in must, should, or must_not conditions. See [Payload Indexing](/documentation/manage-data/indexing/#payload-index) for the full list of index types and how to configure them.

## 7. Chunking Strategies

Embedding models have a maximum token limit — from 256 tokens for compact models like all-MiniLM-L6-v2 to 8,000+ tokens for larger ones (check your model's card). Long documents need to be split into chunks before embedding, and how you chunk affects retrieval quality: too large a chunk packs multiple topics into one embedding, making retrieval imprecise; too small a chunk loses the context needed for the result to be useful.

| Strategy | How it works | Trade-off |
|----------|--------------|-----------|
| Fixed-Size | Split every N tokens regardless of content boundaries | May cut sentences mid-thought |
| Semantic | New chunk when topic or meaning shifts | Slower; needs a model to detect shifts |
| Sliding Window | Chunks overlap to preserve context across the cut | More storage; duplicate content across results |

This is a bare-bones overview — this module won't go deeper into choosing between them right now. For the full comparison and worked examples, see [Chunking Strategies](/course/essentials/day-1/chunking-strategies/#text-chunking-strategy-comparison) in the Qdrant Essentials course.

**Fixed-Size**

![Fixed-size chunking splits text every N words regardless of content boundaries](/courses/beginners/module-2/fixed-size.png)

**Semantic**

![Semantic chunking splits text at meaning boundaries, keeping each topic in its own chunk](/courses/beginners/module-2/semantic.png)

**Sliding Window**

![Sliding window chunking overlaps consecutive chunks to preserve context across boundaries](/courses/beginners/module-2/sliding-window.png)

## 8. Ingestion Pipeline: End-to-End

Let's put everything together. This section walks through the complete ingestion pipeline from cloud setup to your first query.

### Step 1: Create a Free Cluster

Start with a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io). Once created, you'll have a URL and an API key.

<!-- TODO: notebook currently lives on the unmerged "add-module-2-cloud-setup-notebook" branch (qdrant/examples PR #114). Merge that PR so this master-branch link resolves. -->

![Create a free cluster at cloud.qdrant.io](/courses/beginners/module-2/qdrant-cloud.png)

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",  # paste your cluster's URL here
    api_key="<your-api-key>",                                    # paste your API key here
)
# In a real project, don't hardcode these — load them from environment
# variables or a secrets manager instead of committing them to source control.
```

### Step 2: Create the Collection

```python
from qdrant_client import models

client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        size=384,
        distance=models.Distance.COSINE,
    ))

# Qdrant Cloud runs in strict mode, which rejects filtered queries on payload
# fields that aren't indexed. Step 4 filters on "category", so create that
# index now, before ingesting or querying.
client.create_payload_index(
    collection_name="articles",
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

### Step 3: Ingest Data

```python
!pip install fastembed

from qdrant_client.models import PointStruct
from fastembed import TextEmbedding

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")  # 384-dim

documents = [
    {"id": 1, "text": "Car repair guide",  "category": "automotive"},
    {"id": 2, "text": "How to cook pasta",  "category": "food"},
]

points = [
    PointStruct(
        id=doc["id"],
        vector=vector.tolist(),
        payload={"title": doc["text"], "category": doc["category"]},
    )
    for doc, vector in zip(documents, model.embed([d["text"] for d in documents]))
]
# upload_points handles batching and retries automatically — preferred for lists of points.
# upsert is the raw operation, better for single points or small real-time updates.
client.upload_points(collection_name="articles", points=points)
```

### Step 4: Query

This embeds the user's question the same way we embedded the documents, then searches with a payload filter on top — same pattern as section 6, now filtering to only the "automotive" category:

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

query_text   = "automobile maintenance"
query_vector = list(model.embed([query_text]))[0].tolist()

results = client.query_points(
    collection_name="articles",
    query=query_vector,
    query_filter=Filter(
        must=[FieldCondition(key="category", match=MatchValue(value="automotive"))]
    ),
    limit=3,
)

for r in results.points:
    print(f"Score: {r.score:.3f}  |  {r.payload['title']}")
```

### Pipeline Summary

1. **Create cluster**: Get URL + API key from cloud.qdrant.io. Free tier available.
2. **Create collection**: Fix the vector size and distance metric, and create a payload index on any field you'll filter on.
3. **Ingest**: Embed each document with your embedding model, then upsert it as a `PointStruct` with ID, vector, and payload.
4. **Query**: Embed the user's question, then call `query_points` with filters and a limit.

### Try It Yourself

Extend the pipeline above: add a third document with its own category, re-run the filtered query, and confirm it shows up when its category matches — and gets excluded when it doesn't.

## 9. References & Further Reading

**Qdrant docs:**

- [Distance Metrics](/course/essentials/day-1/distance-metrics/)
  - Cosine, dot product, Euclidean, and Manhattan, and when to use each metric.
- [Chunking Strategies](/course/essentials/day-1/chunking-strategies/)
  - Fixed-size, semantic, and sliding-window chunking with a full comparison table.
- [Indexing and HNSW](/documentation/manage-data/indexing/)
  - How the graph index is built, how search traverses it, and the available payload index types.
- [Filtering](/documentation/search/filtering/)
  - Full filter syntax: must, should, must_not, range, geo, and payload index configuration.
- [Qdrant Cloud](https://cloud.qdrant.io/)
  - Create a free cluster and follow the quickstart to run your first query in under 5 minutes.

**Go deeper:**

- [Filterable HNSW](/articles/filterable-hnsw/)
  - How Qdrant combines HNSW with payload filtering without falling back to brute force.
- [Efficient and Robust Approximate Nearest Neighbor Search Using HNSW Graphs](https://arxiv.org/abs/1603.09320)
  - The original HNSW paper, for anyone who wants the algorithm itself, not just the summary.

**Definitions:**

- [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Dot product](https://en.wikipedia.org/wiki/Dot_product)
- [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance)
- [Nearest neighbor search](https://en.wikipedia.org/wiki/Nearest_neighbor_search)

## What's Next: Module 3

In the next module, we'll break down:

- The two families of search: dense vs. sparse, and when each one fails
- How hybrid systems combine dense and sparse retrieval into a single query
- Setting up hybrid search in Qdrant and choosing a fusion strategy
- Beyond text: applying the same retrieval primitives to images, audio, and video
