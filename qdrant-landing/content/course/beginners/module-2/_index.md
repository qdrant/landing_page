---
title: "Module 2: First Principles of Vector Search"
short_description: "Module 2 of the Beginners course: anatomy of a vector - how data is stored, indexed, and retrieved in Qdrant."
description: "Understand collections, points, vectors, payloads, HNSW, chunking, and the ingestion pipeline. Move from theory to actual system design in Qdrant."
isLesson: true
weight: 30
---

{{< date >}} Module 2 {{< /date >}}

# First Principles of Vector Search

## Today's path

1. From Idea to System
2. Core Data Model
3. Distance Metrics
4. Top-K Retrieval
5. How Search is Fast: HNSW
6. Payload Filtering
7. Chunking Strategies
8. Ingestion Pipeline: End-to-End
9. References & Further Reading

By the end, you'll understand every building block needed to go from raw text to a running Qdrant collection.

## 1. From Idea to System

In Module 1, we saw how search evolved from matching words to understanding meaning. Now we move from theory to actual system design. This module covers every building block you need to go from raw text to a running Qdrant collection.

- **Raw Text**
Documents, articles, PDFs

- **Chunk**
Split into passages

- **Embed**
Convert to vectors

- **Store**
Upsert to Qdrant

- **Query**
Retrieve top-K results

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

![Data Model Diagram](/courses/beginners/module-2/data-model.png)

### Collection

Like a table in a relational database. Stores vectors of a fixed size and a chosen distance metric. Every point in a collection must have a vector of the same dimension.

### Point

The atomic unit of data. Every point has an ID (integer or UUID), a vector, and an optional payload. Points are what you search, retrieve, and filter.

### Vector

A list of floating-point numbers (e.g. 384 or 768 values) that represent the meaning of the original content. Similar content produces similar vectors.

### Payload

Arbitrary JSON metadata attached to a point. Used for filtering, retrieval scoping, and result enrichment. Can hold strings, numbers, booleans, geo coordinates, or arrays.

![Payload Diagram](/courses/beginners/module-2/data-flow-2.png)

### Creating a Collection

When you create a collection, you fix two things: the size of vectors it will accept and the distance metric used for similarity.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(":memory:")  # or use cloud URL + API key

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

When you query a collection, Qdrant computes similarity between your query vector and every stored vector using the distance metric you chose at collection creation. The most common for text is cosine similarity.

| Metric | Notes |
|--------|-------|
| models.Distance.COSINE | Measures angle between vectors. Robust to magnitude differences. |
| models.Distance.DOT | Faster than cosine when vectors are unit-length at index time. |
| models.Distance.EUCLID | Measures absolute distance. Sensitive to vector magnitude. |
| models.Distance.MANHATTAN | Sum of absolute differences. Useful for very sparse vectors. |

### Rule

Choose your distance metric at collection creation - it cannot be changed later. Match it to the metric your embedding model was trained with. Most sentence-transformer models use cosine.

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

### Why K matters

Returning too few results (K=3) misses relevant content. Returning too many (K=100) creates noise in results. A common pattern is to retrieve K=20–50 with Qdrant, then rerank to K=5. We'll explain reranking later.

## 5. How Search is Fast: HNSW

Searching millions of vectors by computing similarity against every single one (brute force) is prohibitively slow. Qdrant uses HNSW - Hierarchical Navigable Small World - a graph-based approximate nearest neighbor (ANN) index that makes large-scale search fast without sacrificing meaningful accuracy.

![HNSW Diagram](/courses/beginners/module-2/hnsw.png)

### How HNSW Works

- **Graph structure**: Each vector is a node. Nodes are connected to their nearest neighbors by bidirectional edges, forming a navigable graph.
- **Hierarchical layers**: The graph has multiple layers. The top layer has few nodes and long-range connections. Lower layers are denser with short-range connections.
- **Search by traversal**: Query entry starts at the top layer. The search "jumps" through neighbors, zooming in on the region of interest at each layer.
- **Approximate, not exact**: HNSW trades a small accuracy loss for massive speed gains. In practice, the accuracy loss is negligible for retrieval quality.

<div class="video">
<iframe
  src="https://drive.google.com/file/d/1QaS7Pw3MMeV6GL0-PZMTIFG2Y8n9KVbB/preview"
  frameborder="0"
  allow="autoplay"
  allowfullscreen>
</iframe>
</div>

<br/>

### Tunable Parameters

You can fine-tune the HNSW graph to balance search speed, recall accuracy, memory usage, and indexing time. Three key parameters:

| Parameter | What it controls | Trade-off |
|-----------|------------------|-----------|
| m | Number of bidirectional links per node in the graph | Higher = better recall, more memory |
| hnsw_ef | Size of the candidate list during search (query time) | Higher = better recall, slower search |
| ef_construct | Size of the candidate list during index building | Higher = better graph quality, slower indexing |

```python
client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        m=16,              # default: 16
        ef_construct=100,  # default: 100
    ),
)

# Override ef at query time for recall vs. speed trade-off:
results = client.query_points(
    collection_name="articles",
    query=[...],
    search_params=models.SearchParams(hnsw_ef=128),
    limit=10,
)
```
To learn more about tuning HNSW, see the comprehensive [Qdrant Essentials Course](https://qdrant.tech/course/essentials/day-2/what-is-hnsw/).

### Starting point

Default values (m=16, ef_construct=100) work well for most use cases. Only tune if you're measuring a recall or latency gap against a benchmark.

## 6. Payload Filtering

Real-world search is always similarity plus constraints. Payload filtering lets you apply hard conditions during HNSW traversal - not after retrieval. This keeps results both semantically relevant and legally/logically valid.

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="articles",
    query=[...],
    query_filter=Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchValue(value="automotive")
            )
        ]
    ),
    limit=5,
)
```

![Payload Filtering Diagram](/courses/beginners/module-2/payload.png)

### Filter Types

| Condition | What it does | Example use case |
|-----------|--------------|------------------|
| must | All conditions must be true (AND logic) | Category = automotive AND year >= 2022 |
| should | At least one condition must be true (OR logic) | Category = automotive OR category = transport |
| must_not | Exclude matching points | Exclude documents flagged as deleted or expired |
| Range | Numeric range comparisons (gte, lte, gt, lt) | year between 2020 and 2024 |
| Geo | Geospatial radius or bounding box filter | Restaurants within 5 km of user location |

### Index your filter fields

For fields you filter on frequently, create a payload index. Without an index, Qdrant scans every payload at query time. With one, filtered queries run in logarithmic time. Use client.create_payload_index() for any field that appears in must, should, or must_not conditions. See [Payload Indexing](/documentation/manage-data/indexing/#payload-index) for the full list of index types and how to configure them.

## 7. Chunking Strategies

Embedding models have a maximum token limit - typically 256 to 512 tokens. Long documents must be split into chunks before embedding. How you chunk directly affects retrieval quality.

- **Too large a chunk**: Exceeds model token limit. One embedding represents many topics - retrieval becomes imprecise.
- **Too small a chunk**: Loses surrounding context. Retrieved chunks are too short to be useful as LLM context.

| Strategy | How it works | Example | Best for | Trade-off |
|----------|--------------|---------|-----------|-----------|
| Fixed-Size | Split every N tokens regardless of content boundaries | Every 500 tokens = 1 chunk | Simple RAG pipelines, fast preprocessing, uniform collections | May cut sentences mid-thought; context loss at boundaries |
| Semantic | Create a new chunk when topic or meaning shifts significantly | New chunk when subject changes | High-quality retrieval over long, varied documents | Slower preprocessing; requires a sentence model to detect shifts |
| Sliding Window | Chunks overlap with each other to preserve context continuity | Chunk 1: tokens 1–500, Chunk 2: tokens 400–900 | Conversational RAG, avoiding context loss at chunk edges | Increases storage and retrieval cost; duplicate content in results |

### Fixed-Size

Splits text every N tokens regardless of content boundaries - simple and fast, but can cut sentences mid-thought.

![Fixed-size chunking splits text every N words regardless of content boundaries](/courses/beginners/module-2/fixed-size.png)

### Semantic

Creates a new chunk when the topic or meaning shifts significantly, keeping each chunk focused on one idea.

![Semantic chunking splits text at meaning boundaries, keeping each topic in its own chunk](/courses/beginners/module-2/semantic.png)

### Sliding Window

Chunks overlap with each other so context carries across chunk boundaries instead of being lost at the cut.

![Sliding window chunking overlaps consecutive chunks to preserve context across boundaries](/courses/beginners/module-2/sliding-window.png)

### Chunking in Practice

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Fixed-size with overlap (sliding window)
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""],
)

chunks = splitter.split_text(document_text)
# Each chunk is then embedded and stored as a separate point
```
You can learn more about chunking strategies in the [Chunking Strategies](https://qdrant.tech/course/essentials/day-1/chunking-strategies/#text-chunking-strategy-comparison) section from the Qdrant's Essentials course.

## 8. Ingestion Pipeline: End-to-End

Let's put everything together. This section walks through the complete ingestion pipeline from cloud setup to your first query.

### Step 1 - Create a Free Cluster

Start with a free cluster at cloud.qdrant.io. Once created, you'll have a URL and an API key.

![Create a free cluster at cloud.qdrant.io](/courses/beginners/module-2/qdrant-cloud.png)

```python
from qdrant_client import QdrantClient
import os

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),       # e.g. https://6cec7aec.eu-west-1-0.aws.cloud.qdrant.io
    api_key=os.getenv("QDRANT_API_KEY")
)
```

### Step 2 - Create the Collection

```python
from qdrant_client import models

client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        size=384,
        distance=models.Distance.COSINE,
    ))
```

### Step 3 - Ingest Data

```python
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim

documents = [
    {"id": 1, "text": "Car repair guide",  "category": "automotive"},
    {"id": 2, "text": "How to cook pasta",  "category": "food"},
]

points = [
    PointStruct(
        id=doc["id"],
        vector=model.encode(doc["text"]).tolist(),
        payload={"title": doc["text"], "category": doc["category"]},
    )
    for doc in documents
]

client.upload_points(collection_name="articles", points=points)
```

### Step 4 - Query

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

query_text   = "automobile maintenance"
query_vector = model.encode(query_text).tolist()

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
2. **Create collection**: Fix the vector size and distance metric. These cannot be changed after creation.
3. **Chunk and embed**: Split documents into chunks, encode each with your embedding model.
4. **Upsert points**: Store each chunk as a PointStruct with ID, vector, and payload.
5. **Query**: Encode the user's question, call query_points with filters and limit.

## 9. References & Further Reading

- **Distance Metrics** - [Distance Metrics - Qdrant](https://qdrant.tech/documentation/concepts/#distance-metrics)
  - Cosine, dot product, Euclidean, Manhattan - when to use each metric and why.

- **Chunking Strategies** - [Text Chunking Strategies - Qdrant](https://qdrant.tech/documentation/guides/collection_setup/)
  - Fixed-size, semantic, sliding window, and advanced strategies with a full comparison table.

- **HNSW Deep Dive** - [HNSW Indexing Fundamentals - Qdrant](https://qdrant.tech/documentation/concepts/indexing/#hnsw)
  - How the graph index is built, how search traverses it, and a full parameter summary.

- **Filtering Reference** - [Filtering - Qdrant](https://qdrant.tech/documentation/concepts/filtering/)
  - Full filter syntax: must, should, must_not, range, geo, and payload index configuration.

- **Qdrant Cloud** - [Qdrant Cloud](https://cloud.qdrant.io/)
  - Create a free cluster and follow the quickstart to run your first query in under 5 minutes.

## What's Next - Module 3

Next, we'll explore:

- Sparse vs. dense search - when keyword precision beats semantic similarity
- Hybrid search - combining dense + sparse in a single query with RRF fusion
- Multimodal inputs - text, image, audio in one vector space
- etc..

End of Module 2. Continue to Module 3: Sparse vs Dense Search and Hybrid Retrieval.
