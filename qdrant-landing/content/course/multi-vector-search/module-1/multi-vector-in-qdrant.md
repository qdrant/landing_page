---
title: "Multi-Vector Embeddings in Qdrant"
description: Configure Qdrant collections for multi-vector embeddings and learn how to index and query multi-vector data.
weight: 5
---

{{< date >}} Module 1 {{< /date >}}

# Multi-Vector Embeddings in Qdrant

You've learned how MaxSim enables fine-grained token-level matching and explored both the benefits and challenges of multi-vector search. Now it's time to put that knowledge into practice.

Qdrant provides first-class support for multi-vector embeddings, making it straightforward to build search systems that leverage late interaction. In this lesson, you'll learn how to configure Qdrant collections for multi-vector search, index documents with token-level embeddings, and execute queries using MaxSim distance.

By the end, you'll understand the key configuration parameters, know when to use storage optimization strategies, and be ready to build your own multi-vector search applications.

---

<div class="video">
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-1/multi-vector-in-qdrant.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## Creating a Multi-Vector Collection

Setting up a collection for multi-vector search requires specific configuration to enable late interaction and MaxSim distance calculation. Here's how to create a collection configured for ColBERT embeddings:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="colbert-search",
    vectors_config={
        "colbert": models.VectorParams(
            # Size of an individual token vector
            size=128,
            # Distance function for token similarity
            distance=models.Distance.DOT,
            # Enable multi-vector mode with MaxSim
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            # Disable HNSW indexing
            hnsw_config=models.HnswConfigDiff(m=0),
        ),
    },
)
```

Let's break down each parameter:

- **`size`**: The dimensionality of each individual token embedding.
- **`distance`**: The similarity metric used to compare individual token vectors. This is the per-token comparison, and MaxSim will aggregate these scores.
- **`multivector_config`**: Enables multi-vector mode for this collection. The `comparator=MultiVectorComparator.MAX_SIM` parameter tells Qdrant to use MaxSim distance when comparing multi-vector documents to queries.
- **`hnsw_config`**: Setting `m=0` disables HNSW indexing. HNSW graphs don't work with MaxSim either way, so it should be disabled to not create an index we won't use.

You now have a collection ready for multi-vector search. The configuration handles MaxSim automatically - you just need to provide the embeddings.

## Indexing Multi-Vector Documents

With your collection configured, you can now index documents. Each document needs multiple token embeddings - one for each token in the text:

```python
import uuid

documents = [
    # Document A: Highly relevant - addresses all query aspects
    "When async tasks fail to return database connections, the pool "
    "becomes exhausted and requests start failing. Ensuring "
    "connections are closed after awaits prevents this.",

    # Document B: Partially relevant - mentions some concepts
    "Database resource exhaustion can occur due to limited pool sizes.",

    # Document C: Keyword-stuffed - contains related terms without substance
    "Understanding concurrency, async IO, and database performance in "
    "Python web applications.",

    # Document D: Completely irrelevant
    "Handling training for pythons should be done gradually, starting "
    "with short sessions and increasing duration as the snake becomes "
    "more comfortable.",
]

client.upsert(
    collection_name="colbert-search",
    points=[
        models.PointStruct(
            id=uuid.uuid4().hex,
            vector={
                "colbert": models.Document(
                    text=doc,
                    model="colbert-ir/colbertv2.0",
                )
            },
            payload={
                "text": doc,
            }
        )
        for doc in documents
    ]
)
```

This example uses `models.Document` for convenience - Qdrant's **local inference** feature powered by FastEmbed integration. You provide the text and model name, and Qdrant handles tokenization and encoding automatically. You can also generate embeddings externally and provide them directly as lists of vectors.

The `payload` field stores the original text and metadata, returned with search results.

## Querying with MaxSim

Querying works the same way - provide your query text and let Qdrant handle MaxSim computation:

```python
query = "How can I prevent Python database connection pool exhaustion?"

results = client.query_points(
    collection_name="colbert-search",
    query=models.Document(
        text=query,
        model="colbert-ir/colbertv2.0",
    ),
    using="colbert",
    limit=2,
)
```

The results show which documents have the highest token-level semantic overlap with your query. Documents about async connection pool exhaustion rank higher than generic database documents because more query tokens find strong matches.

## Storage Optimization: Offloading to Disk

As discussed in the previous lesson, multi-vector search requires significantly more memory than traditional single-vector search. A document with 500 tokens stores 500 separate embeddings, creating substantial memory pressure for large collections.

When you prioritize maximum precision over low latency, Qdrant offers a solution: **offload vectors to disk**. This strategy keeps embeddings on disk rather than loading them into RAM, dramatically reducing memory requirements at the cost of slower query performance:

```python
client.create_collection(
    collection_name="colbert-search-on-disk",
    vectors_config={
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.DOT,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
            # Offload vectors to disk
            on_disk=True,
        ),
    },
)
```

The single `on_disk=True` parameter changes the storage strategy. Here's the trade-off:

**Benefits**: Dramatically reduced memory footprint. Instead of storing thousands of token embeddings in RAM, Qdrant reads them from disk during search. This enables multi-vector search on collections that would otherwise exceed available memory.

**Costs**: Higher query latency due to disk I/O. Every MaxSim calculation requires reading document embeddings from disk, which is orders of magnitude slower than RAM access. Query times increase from milliseconds to potentially seconds, depending on collection size and hardware.

**When to use it**: Disk offloading works best when precision is critical but latency constraints are relaxed. Research applications, offline batch processing, or scenarios where you're willing to wait a few seconds for the most accurate results all benefit from this approach. For production systems requiring sub-second response times, you'll need other optimization strategies.

This is just one optimization technique. Module 3 covers additional approaches including quantization, pooling, and multi-stage retrieval that balance precision, memory, and latency more effectively for production deployments.

## What's Next

You've learned how to configure Qdrant for multi-vector search, from creating collections with MaxSim comparators to indexing documents and executing queries. The key takeaways:

- **Multi-vector collections** require specific configuration: `multivector_config` with `MAX_SIM` comparator
- **HNSW indexing is disabled** because MaxSim doesn't work with static proximity graphs
- **Disk offloading** (`on_disk=True`) reduces memory usage when precision matters more than latency
- **Local inference** with FastEmbed integration lets you provide text directly instead of pre-computed embeddings

The examples in this lesson focused on text search using ColBERT. But late interaction and MaxSim aren't limited to text. In Module 2, you'll discover how multi-vector embeddings extend to multi-modal data - searching PDFs and images using visual token embeddings with ColPali.
