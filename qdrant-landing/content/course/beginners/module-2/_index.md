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

**Follow-along code**: [Module 2 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module2.ipynb)

<br/>

#### TL;DR
```
Module 1 explained why semantic search works. In this module, you’ll learn 
where your data lives and how Qdrant searches it. You’ll explore collections,
points, vectors, payloads, and distance metrics, then see how Qdrant finds the 
top-k matches without scanning every vector. You’ll also learn how to filter
results by metadata and split long documents into smaller chunks before embedding
them. By the end, you’ll have created a collection, stored points, and run 
your first filtered query.
```

## Today's Path

1. From Idea to System
2. Core Data Model
3. Distance Metrics
4. Top-K Retrieval
5. Fast Approximate Search: HNSW
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
Convert to dense vectors

- **Store**
Upsert to Qdrant: insert a point if its ID is new, update it if the ID already exists

- **Query**
Retrieve the top-K results: the K most similar matches to your query

![](/courses/beginners/module-2/flow.png)

## 2. Core Data Model

Qdrant organizes data in a simple three-level hierarchy. Understanding this structure is the foundation for everything else in the course.

![](/courses/beginners/module-2/data-model.png)

### Collection

Like a table in a relational database. Stores vectors of a fixed size and a chosen distance metric. Every point in a collection must have a vector of the same dimension.

### Point

The atomic unit of data. Every point has an ID (integer or UUID), a vector, and an optional payload. Points are what you search, retrieve, and filter.

### Vector

A vector is a list of numbers. An embedding is a vector created by a model to represent the meaning of content. In semantic search, a dense vector is usually an embedding generated from text, images, or other data.<br>
Each number represents one dimension of the vector. Similar content produces similar vectors, making it easier to find related items. Dense vectors usually contain values across most dimensions. This module focuses on dense vectors; Module 3 introduces sparse vectors, which contain mostly zeros.

### Payload

Custom JSON metadata attached to a point. Used for filtering, retrieval scoping, and result enrichment. Can hold strings, numbers, booleans, geo coordinates, or arrays.

![](/courses/beginners/module-2/payload.png)

### Your Qdrant Cluster

To create a collection, you need a running Qdrant instance, or **cluster**. A cluster is a Qdrant deployment that stores your collections and handles requests. You can use Qdrant Cloud or run Qdrant yourself locally. Qdrant Cloud offers a free tier that takes about a minute to set up. Module 0 walks you through the process with screenshots.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    # your cluster URL, from Module 0
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",  
    # your cluster API key, from Module 0
    api_key="<your-api-key>",                                    
)
# For quick, throwaway experiments without a server, you can also use:
# client = QdrantClient(":memory:")
```

### Creating a Collection

Once connected, you create a collection by setting two parameters: the size of the vectors it accepts and the distance metric used for similarity. <br>
Both come from your embedding model. 384 is the vector size of all-MiniLM-L6-v2, the model from Module 1, and cosine is the metric it was trained for.

```python
client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        # 384: the vector size of all-MiniLM-L6-v2, from Module 1
        size=384,                     
        distance=models.Distance.COSINE,
    ),
)
```

### Inserting a Point

Each point contains an ID, a vector that represents your content, and a payload with metadata you can use to filter or return results later. <br>
Use `upsert` to add a point to a collection. If the ID is new, Qdrant inserts the point. If the ID already exists, Qdrant updates the existing point.

```python
from qdrant_client.models import PointStruct  # represents a single point: id, vector, and payload

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

When you query a collection, Qdrant compares your query vector with the stored vectors using the distance metric you chose when creating the collection. For text embeddings, cosine similarity is the most common metric. <br> 
Checking every vector would be too slow for large collections. Instead, Qdrant uses an HNSW index to find the closest matches efficiently without scanning the entire collection. Section 5 explains how it works.

| Metric | Notes |
|--------|-------|
| models.Distance.COSINE | Measures angle between vectors. Robust to magnitude differences. |
| models.Distance.DOT | Faster than cosine when vectors are unit-length at index time. |
| models.Distance.EUCLID | Measures absolute distance. Sensitive to vector magnitude. |
| models.Distance.MANHATTAN | Sum of absolute differences. Less sensitive to outliers than Euclidean; use when the embedding model was trained with L1. |

### Note

Choose your distance metric at collection creation; it cannot be changed later. If you need a different metric, create a new collection with that metric and re-ingest your data into it.

To avoid breaking callers during that switch, point a [collection alias](/documentation/manage-data/collections/#collection-aliases) at whichever collection is currently live, and repoint it to the new one once re-ingestion is done. HNSW (Hierarchical Navigable Small World) parameters like m and ef_construct, by contrast, can be updated after creation, and Qdrant will rebuild the index in the background with no downtime. Match your distance metric to what your embedding model was trained with: most sentence-transformer models use cosine.

## 4. Top-K Retrieval

A search query is converted into a vector using the same embedding model used to embed your documents. Qdrant finds the K points in the collection whose vectors are most similar to the query vector, ranked by similarity score.

```python
results = client.query_points(
    collection_name="articles",
    query=[0.12, -0.87, 0.33, ...],   # your query vector
    limit=3,                            # return top 3
)

for r in results.points:
    print(r.id, r.score, r.payload)
```

![](/courses/beginners/module-2/top-k.png)

### Why K Matters

Returning too few results (K=3) misses relevant content. Returning too many (K=100) creates noise in results. A common approach is to overfetch: retrieve a larger candidate pool, then rerank it down to the smaller K you actually show the user. Qdrant supports this natively via [multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) - for example, prefetching a large candidate set and reranking it down to a much smaller final `limit`. We'll cover reranking in detail later.

## 5. Fast Approximate Search: HNSW

Searching millions of vectors by computing similarity against every single one (brute force) is slow. Qdrant uses HNSW (Hierarchical Navigable Small World), a graph-based approximate nearest neighbor (ANN) index that makes large-scale search fast at a small, measurable recall cost.

![](/courses/beginners/module-2/hnsw.png)

### How HNSW Works

- **Graph structure**: Each vector is a node. Nodes are connected to their nearest neighbors by bidirectional edges, forming a navigable graph.
- **Hierarchical layers**: The graph has multiple layers. The top layer has few nodes and long-range connections. Lower layers are denser with short-range connections.
- **Search by traversal**: Query entry starts at the top layer. The search "jumps" through neighbors, zooming in on the region of interest at each layer.
- **Approximate, not exact**: HNSW trades some recall (see below) for massive speed gains. Whether that trade-off is worth it depends on your data and queries, so measure recall on queries representative of your actual workload rather than assuming it.

### Tunable Parameters

HNSW has a few tunable parameters (`m`, `ef_construct`, and `hnsw_ef`) that trade off search speed, **recall** (the fraction of the true nearest neighbors your approximate search actually finds), memory usage, and indexing time. The defaults work well for most use cases; only tune them once you're measuring an actual recall or latency gap against a benchmark, not before. You haven't run a search yet at this point in the course, so we won't go deeper here; the [Qdrant Essentials Course](/course/essentials/day-2/what-is-hnsw/) covers HNSW tuning in full once you're ready for it.

Real-world queries rarely stop at similarity alone; they usually need metadata constraints too. Rather than searching the full graph and filtering afterward, Qdrant applies those constraints during the HNSW traversal itself; see [Filterable HNSW](/articles/filterable-hnsw/) for how that works without falling back to brute force. Section 6 covers this next.

## 6. Payload Filtering

Payload filtering lets you apply hard conditions during HNSW traversal, not after retrieval. This keeps results both semantically relevant and legally/logically valid.

This searches by vector similarity as usual, but only among points whose payload passes the filter:

- `Filter` — the overall condition
- `must` — a list of conditions that all have to be true (AND logic)
- `FieldCondition` — checks one payload field; here, that `category` equals `"automotive"`

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="articles",
    query=[...],
    query_filter=Filter(
        must=[
            FieldCondition(
                # the payload field to check
                key="category",  
                # keep only points where category == "automotive"
                match=MatchValue(value="automotive")  
            )
        ]
    ),
    limit=5,
)
```

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

Embedding models have a maximum token limit, from 256 tokens for compact models like all-MiniLM-L6-v2 to 8,000+ tokens for larger ones (check your model's card). Long documents need to be split into chunks before embedding, and how you chunk affects retrieval quality: too large a chunk packs multiple topics into one embedding, making retrieval imprecise; too small a chunk loses the context needed for the result to be useful.

| Strategy | How it works | Trade-off |
|----------|--------------|-----------|
| Fixed-Size | Split every N tokens regardless of content boundaries | May cut sentences mid-thought |
| Semantic | New chunk when topic or meaning shifts | Slower; needs a model to detect shifts |
| Sliding Window | Chunks overlap to preserve context across the cut | More storage; duplicate content across results |

<aside role="status">
This module introduces the main chunking strategies but doesn’t explore how to choose between them in depth. For a detailed comparison and worked examples, see [Chunking Strategies](https://deploy-preview-2495--condescending-goldwasser-91acf0.netlify.app/course/essentials/day-1/chunking-strategies/#text-chunking-strategy-comparison) in the Qdrant Essentials course.
</aside>

**Fixed-Size**

![](/courses/beginners/module-2/fixed-size.png)

**Semantic**

![](/courses/beginners/module-2/semantic.png)

**Sliding Window**

![](/courses/beginners/module-2/sliding-window.png)

## 8. Ingestion Pipeline: End-to-End

Let's put everything together. This section walks through the complete ingestion pipeline from cloud setup to your first query.

### Step 1: Connect to Your Cluster

Module 0 walks you through creating a free cluster at [Qdrant Cloud](https://cloud.qdrant.io/) and retrieving its URL and API key. Use these credentials to initialize the Qdrant client:

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-west-1-0.aws.cloud.qdrant.io",  # your cluster's URL
    api_key="<your-api-key>",                                    # your API key
)
# In a real project, don't hardcode these; load them from environment
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
# upload_points handles batching and retries automatically; preferred for lists of points.
# upsert is the raw operation, better for single points or small real-time updates.
client.upload_points(collection_name="articles", points=points)
```

### Step 4: Query

This embeds the user's question the same way we embedded the documents, then searches with a payload filter on top: same pattern as section 6, now filtering to only the "automotive" category:

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

1. **Connect to your cluster**: Get its URL + API key (see Module 0 for the free-tier walkthrough).
2. **Create collection**: Fix the vector size and distance metric, and create a payload index on any field you'll filter on.
3. **Ingest**: Embed each document with your embedding model, then upsert it as a `PointStruct` with ID, vector, and payload.
4. **Query**: Embed the user's question, then call `query_points` with filters and a limit.

### Try It Yourself

Extend the pipeline above: add a third document with its own category, re-run the filtered query, and confirm it shows up when its category matches, and gets excluded when it doesn't.

## 8. Further Reading

- [Distance Metrics](/course/essentials/day-1/distance-metrics/) A closer look at cosine similarity, dot product, Euclidean, and Manhattan, and when each one fits.
- [What Is HNSW](/course/essentials/day-2/what-is-hnsw/) How the graph index is built and tuned, once you have real searches to measure it against.
- [Filtering](/documentation/search/filtering/) The full filter syntax, including range, geo, and nested conditions.
- [Payload Indexing](/documentation/manage-data/indexing/#payload-index) The available payload index types and how to configure them.
- [Chunking Strategies](/course/essentials/day-1/chunking-strategies/) The full comparison of fixed-size, semantic, and sliding-window chunking, with worked examples.

## What's Next: Module 3

Dense vectors capture meaning well, but they can miss exact keyword matches such as product codes or model numbers. <br> 
Module 3 introduces sparse vectors, which complement dense vectors by capturing exact terms and keywords. You’ll learn how to combine both in a single hybrid search query.
