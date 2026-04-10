---
title: Hybrid Search with Reranking
weight: 2
aliases:
  - /documentation/search-precision/reranking-hybrid-search/
  - /documentation/advanced-tutorials/reranking-hybrid-search/
---

# Qdrant Hybrid Search with Reranking

| Time: 40 min | Level: Intermediate |
| --- | ----------- |

Reranking is a powerful technique for improving search precision: rather than running an expensive model over your entire corpus, you apply it to a smaller set of candidates already retrieved by a faster method. This keeps latency low while surfacing the most relevant results.

Reranking pairs especially well with [hybrid search](/documentation/search/hybrid-queries/), which casts a wide retrieval net by combining dense embeddings for semantic matching with sparse embeddings for keyword matching, maximizing recall across both retrieval paths. Reranking can sort the hybrid search results with a deeper relevance signal. A late interaction model, for instance, represents both query and document as multiple vectors, enabling more nuanced term-level comparisons than a single embedding can capture.

In this tutorial, you'll learn how to build a hybrid search engine that uses dense embeddings for semantic search, sparse embeddings for keyword search, and late interaction embeddings for reranking. The result is a powerful search engine that delivers highly relevant results by combining the strengths of different embedding types.

You'll use [Qdrant Cloud Inference](/documentation/concepts/inference/#qdrant-cloud-inference) to generate vector embeddings. The three embedding models used in this tutorial (dense, sparse, and late interaction) are available free of charge on Qdrant Cloud. If you prefer to manage your own embedding infrastructure, you can apply the same principles, but you will need to adapt the code examples to use your embedding service.

## Overview

Let's start by breaking down the architecture:

### Ingestion Stage

![Processing dense, sparse, and late interaction embeddings in Qdrant](/documentation/examples/reranking-hybrid-search/image3.png)

You'll start by ingesting a CSV file containing information about science fiction books. Each row is a **document**, corresponding to a book, with fields for the title, author, and description. Each book description will be processed to generate three types of embeddings:
- **Dense embeddings** capture the deeper, semantic meanings behind the text.
- **Sparse embeddings** support more traditional, keyword-based methods. Specifically, you'll use [BM25](/documentation/search/text-search/#bm25), a probabilistic retrieval model. BM25 ranks documents based on how relevant their terms are to a given query, taking into account how often terms appear, document length, and how common the term is across all documents. It's perfect for keyword-heavy searches.
- **Late interaction embeddings** capture the nuanced interactions between query and document terms. You'll use a ColBERT model, which uses a two-stage approach. First, it generates contextualized embeddings for both queries and documents using BERT, and then it performs late interaction, matching those embeddings efficiently to fine-tune relevance. Learn more about late interaction models in the [Multivector Representations for Reranking in Qdrant](/documentation/tutorials-search-engineering/using-multivector-representations/) tutorial and the [Multi-Vector Search](/course/multi-vector-search/) course.

The data, including all the embeddings, is stored in Qdrant, a **vector search engine**. This enables you to efficiently search, retrieve, and rerank your documents based on multiple layers of relevance.

### Retrieval Stage

![Query retrieval and reranking process in Qdrant](/documentation/examples/reranking-hybrid-search/image2.png)

When a user submits a **query**, it is, just like documents, transformed into each of the types of embeddings: dense for semantic search, sparse for keyword search, and late interaction for precise reranking.

Next, **hybrid search** uses dense and sparse embeddings to find the most relevant documents. The dense embeddings are used for semantic search, while the sparse embeddings are used for keyword search. The resulting sets of documents are then **reranked** using late interaction embeddings, giving results that are not only relevant but also tuned to your query by prioritizing the documents that truly meet the user's intent.

## Implementation

### Install and Initialize the Qdrant Client

First, install the Qdrant client:

```python
pip install qdrant-client
```

Next, initialize the client:

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)
```

### Create Collection

Create a new collection called `hybrid-search`, configured to handle the three vector types:

- **Dense embeddings** (`dense`) using cosine distance for semantic comparisons.
- **Late interaction embeddings** (`multi`) using cosine distance, with a multivector configuration using the maximum similarity comparator. Note that we set `m=0` to disable HNSW indexing since these embeddings are used for reranking, not ANN retrieval.
- **Sparse embeddings** (`sparse`) for keyword-based searches using the [IDF modifier](/documentation/manage-data/indexing/#idf-modifier).

```python
from qdrant_client.models import Distance, VectorParams, models

collection_name = "hybrid-search"

if client.collection_exists(collection_name=collection_name):
    client.delete_collection(collection_name=collection_name)

client.create_collection(
    collection_name,
    vectors_config={
        "dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE,
        ),
        "multi": models.VectorParams(
            size=96,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            hnsw_config=models.HnswConfigDiff(m=0)  #  Disable HNSW for reranking
        ),
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(modifier=models.Modifier.IDF)
    }
)
```

### Models

Next, define the three embedding models:

```python
dense_embedding_model = "sentence-transformers/all-MiniLM-L6-v2"
sparse_embedding_model = "qdrant/bm25"
late_interaction_embedding_model = "answerdotai/answerai-colbert-small-v1"
```

### Ingest Data

Now you can load the sci-fi book descriptions from a CSV and insert them into the `hybrid-search` collection. With Cloud Inference, embeddings are computed server-side by wrapping the text in a `Document` object.

```python
import csv
from qdrant_client.models import Document, PointStruct
import urllib.request

csv_url = 'https://gist.githubusercontent.com/abdonpijpelink/288dc9939d285cd052eb36297a2b5ce1/raw/8e88626da2b52d8794e8e85824061e3989220d05/top_100_scifi_books_full.csv'
batch_size = 25
buffer: list[PointStruct] = []

with urllib.request.urlopen(csv_url) as response:
    reader = csv.DictReader(line.decode('utf-8') for line in response)
    for idx, row in enumerate(reader):
        buffer.append(PointStruct(
            id=idx,
            vector={
                "dense": Document(text=row['Description'], model=dense_embedding_model),
                "sparse": Document(text=row['Description'], model=sparse_embedding_model),
                "multi": Document(text=row['Description'], model=late_interaction_embedding_model),
            },
            payload={"title": row['Title'], "author": row['Author'], "description": row['Description']}
        ))

        if len(buffer) >= batch_size:
            client.upload_points(
                collection_name=collection_name,
                points=buffer
            )
            buffer = []

# Flush remaining partial batch
if buffer:
    client.upload_points(
        collection_name=collection_name,
        points=buffer
    )
```

For each book, create a point with three vector types and a payload containing the title, author, and description. Documents are uploaded to Qdrant in batches of 25, with Cloud Inference generating all three embeddings on the fly.

### Retrieval

Before combining results, let's see how dense and sparse retrieval perform individually. For retrieval, we wrap the query in a `Document` object so Cloud Inference computes the appropriate embedding server-side.

**Dense retrieval** captures semantic meaning:

```python
import pprint

query = "time travel"

results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=dense_embedding_model),
    using="dense",
    limit=10,
)

pprint.pp(results.points)
```

Let's take a look at the top 5 results:

| Position | Title | Description |
|----------|-------|-------------|
| 1 | The Time Machine | A Victorian scientist travels far into the future to witness civilization's fate. |
| 2 | Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. |
| 3 | The Peripheral | Two timelines intersect through telepresence technology. |
| 4 | The Space Between Worlds | A multiverse traveler uncovers dangerous secrets across parallel Earths. |
| 5 | The Forever War | A soldier experiences extreme time dilation while fighting an interstellar war. |

Each of these books has a strong semantic connection to the concept of time travel, even if the exact phrase doesn't appear in the description.

**Sparse retrieval** focuses on keyword matches:

```python
results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=sparse_embedding_model),
    using="sparse",
    limit=10,
)

pprint.pp(results.points)
```

The top 5 results are:

| Position | Title | Description |
|----------|-------|-------------|
| 1 | Station Eleven | A traveling symphony roams a post-pandemic North America. |
| 2 | Hyperion | Travelers share haunting tales on a pilgrimage to confront the mysterious Shrike. |
| 3 | The Space Between Worlds | A multiverse traveler uncovers dangerous secrets across parallel Earths. |
| 4 | The Time Machine | A Victorian scientist travels far into the future to witness civilization's fate. |
| 5 | Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. |

The sparse BM25 model performs keyword matching. As a result, it returns books whose descriptions contain the words "time" and "travel". For instance, "Station Eleven" and "Hyperion" mention "travel" but aren't primarily about time travel.

**Hybrid search** combines the prefetch parameter with fusion. This lets you run multiple sub-queries in one go and merge the results using [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf):

```python
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.Document(text=query, model=sparse_embedding_model),
        using="sparse",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
```

This runs two sub-queries in parallel: one using dense embeddings for semantic meaning, the other using sparse BM25 embeddings for keyword matching. The prefetch step retrieves the top 20 candidates from each sub-query (dense and sparse) and fuses the ranked lists into a single result using RRF.

The results are a mix of books that are semantically relevant to time travel and those that contain the keywords, giving you a broader set of relevant documents. However, the ranking may not be optimal since RRF treats both signals equally and doesn't capture the nuanced interactions between query and document terms. For example, "Station Eleven" ranks highly because it has stronger keyword matches, even though it is not about time travel.

| Position | Title | Description |
|----------|-------|-------------|
| 1 | The Time Machine | A Victorian scientist travels far into the future to witness civilization's fate. |
| 2 | Station Eleven | A traveling symphony roams a post-pandemic North America. |
| 3 | Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. |
| 4 | The Space Between Worlds | A multiverse traveler uncovers dangerous secrets across parallel Earths. |
| 5 | Hyperion | Travelers share haunting tales on a pilgrimage to confront the mysterious Shrike. |

### Rerank

The hybrid search results can be reranked using late interaction embeddings for maximum precision. Instead of fusing with RRF, use the ColBERT multi-vector as the final ranking signal:

```python
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.Document(text=query, model=sparse_embedding_model),
        using="sparse",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.Document(text=query, model=late_interaction_embedding_model),
    using="multi",
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
```

The prefetch step retrieves the top 20 candidates from each sub-query (dense and sparse), and the ColBERT late interaction model reranks the combined candidates to surface the most relevant results.

### Compare results

Let's compare the top 10 results of hybrid search with and without reranking. Notice how some documents shift in rank based on their relevance according to the late interaction embeddings.

 Title | Description | Reranked | RRF rank  | Rank Change |
|-------|-------------| ---------|----------|-------------|
| Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. | 1 | 3 | Moved up |
| The Forever War | A soldier experiences extreme time dilation while fighting an interstellar war. | 2 | 8 | Moved up |
| Kindred | A modern Black woman is pulled back in time to the antebellum South. | 3 | 7 | Moved up |
| Spin | Earth is enclosed in a time-distorting barrier by unknown forces. | 4 | 6 | Moved up |
| The Light Brigade | Soldiers are turned into light to fight a war across space-time. | 5 | 10 | Moved up |

## Best Practices in Reranking

Reranking can dramatically improve the relevance of search results, especially when combined with hybrid search. Here are some best practices to keep in mind:

- **Implement hybrid reranking**: blend keyword-based (sparse) and vector-based (dense) search results for a more comprehensive ranking system.
- **Continuous testing and monitoring**: regularly evaluate your reranking models to avoid overfitting and make timely adjustments to maintain performance.
- **Balance relevance and latency**: Reranking can be computationally expensive, so aim for a balance between relevance and speed. Therefore, the first step is to retrieve the relevant documents and then use reranking on them.

## Conclusion

Reranking is a powerful tool that boosts the relevance of search results, especially when combined with hybrid search methods. While it can add some latency due to its complexity, applying it to a smaller, pre-filtered subset of results ensures both speed and relevance.
