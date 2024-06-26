---
title: "Qdrant 1.10 - Universal Query, BM42 & ColBERT Support"
draft: false
short_description: "Single search API. New search algorithm. Native multivector support."
description: "Consolidated search API, brand new BM42 algorithm, and native multivector support. " 
preview_image: /blog/qdrant-1.10.x/social_preview.png
social_preview_image: /blog/qdrant-1.10.x/social_preview.png
date: 2024-06-25T00:00:00-08:00
author: David Myriel
featured: false 
tags:
  - vector search
  - ColBERT late interaction
  - BM25 algorithm
  - search API
  - new features
---

[Qdrant 1.10.0 is out!](https://github.com/qdrant/qdrant/releases/tag/v1.10.0) This version introduces at some major changes, so let's dive right in:

**Universal Query API:** All search APIs are now consolidated into the single Query API endpoint.</br>
**Hybrid Search:** Hybrid Search is offered out of the box, and you can use it via Query API.</br>
**BM42 Algorithm:** Alternative method of scoring is best suited for Hybrid Search on short docs.</br>
**Multivector Support:** Native support for late interaction ColBERT is accessible via Query API.

## One Endpoint for All Queries
**Query API** will consolidate all search APIs into a single request. You can now configure a single request to `nearest`/`fusion` search or `discover`/`recommend` or `context`/`order_by` results. Previously, you had to work outside of the API to combine different search requests. Now these approaches are reduced to parameters of a single request, so you can avoid merging individual results.

For example, you can configure Query API to run Discovery search. Let's see how that looks:

```http
POST collections/{collection_name}/points/query
{
  "query": {
    "discover": {
      "target": <vector_input>,
      "context": [{"positive": <vector_input>, "negative": <vector_input>}]
    }
  }
}
```

We will be publishing examples in docs and our new API specification. *For more details, read the [Query API documentation] (/documentation/concepts/query/)*

## Native Hybrid Search Support
Query API will also natively support **Hybrid Search**. Up to this point, you had to combine the results via `fusion` of `sparse` and `dense` vectors on your own. This is now sorted on the back-end, and you only have to configure them as basic parameters for Query API. 

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { 
                "indices": [1, 42],    // <┐
                "values": [0.22, 0.8]  // <┴─sparse vector
             },
            "using": "sparse",
            "limit": 20,
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "using": "dense",
            "limit": 20,
        }
    ],
    "query": { "fusion": "rrf" }, // <--- reciprocal rank fusion
    "limit": 10
}
```
Keep in mind that the Query API can now perform **sub-requests**. You will need to define a strategy to merge these requests using new parameters. For example, you can now include reranking within Hybrid Search, which can open door to strategies like iterative refinement via matryoshka embeddings. 

*Read the [Query API documentation] (/documentation/concepts/query/) for more details.*

## The Answer is 42

Qdrant's BM42 is a novel algorithm that combines the IDF (inverse document frequency) element of BM25 with **transformer-based attention matrices** to improve text retrieval. It utilizes attention matrices to determine token importance. Here is how we structured the algorithm:

$$
\text{score}(D,Q) = \sum_{i=1}^{N} \text{IDF}(q_i) \times \text{Attention}(\text{CLS}, q_i)
$$

This method addresses the tokenization issues and computational costs associated with SPLADE. The expected model is both efficient and effective across different document types and lengths, offering enhanced search performance by leveraging the strengths of both BM25 and modern transformer techniques.

> Read more about BM42 in our [dedicated article] (/articles/bm42/)

BM42 can now be used in Qdrant via FastEmbed inference. Let's see how you can setup a collection for hybrid search with BM42 and [jina.ai](https://jina.ai/embeddings/) dense embeddings.

```http
PUT collections/my-hybrid-collection
{
  "vectors": {
    "jina": {
      "size": 768,
      "distance": "Cosine"
    }
  },
  "sparse_vectors": {
    "bm42": {
      "modifier": "idf" // <--- This parameter enables the IDF calculation
    }
  }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient()

client.create_collection(
    collection_name="my-hybrid-collection",
    vectors_config={
        "jina": models.VectorParams(
            size=768,
            distance=models.Distance.COSINE,
        )
    },
    sparse_vectors_config={
        "bm42": models.SparseVectorParams(
            modifier=models.Modifier.IDF,
        )
    }
)
```

The search query will retrieve the documents with both dense and sparse embeddings and combine the scores
using Reciprocal Rank Fusion (RRF) algorithm.

```python
from fastembed import SparseTextEmbedding, TextEmbedding

query_text = "best programming language for beginners?"

model_bm42 = SparseTextEmbedding(model_name="Qdrant/bm42-all-minilm-l6-v2-attentions")
model_jina = TextEmbedding(model_name="jinaai/jina-embeddings-v2-base-en")

sparse_embedding = list(embedding_model.embed_query(query_text))[0]
dense_embedding = list(model_jina.embed_query(query_text))[0]

client.query_points(
  collection_name="my-hybrid-collection",
  prefetch=[
      models.Prefetch(query=sparse_embedding, using="bm42", limit=10),
      models.Prefetch(query=dense_embedding,  using="jina", limit=10),
  ],
  query=models.Fusion.RRF, # <--- Combine the scores
  limit=10
)

```

You can expect BM42 to excel in scalable RAG-based scenarios where short texts are more common. Document inference speed is much higher with BM42, which is critical for large-scale applications such as search engines, recommendation systems, and real-time decision-making systems.

## ColBERT Multivector Support 
We are adding native support for multivector search, compatible with the late-interaction ColBERT model. If you are working with high-dimensional similarity searches, ColBERT is highly recommended as a reranking step in Universal Query search. You will experience better quality of vector retrieval, since ColBERT’s approach  allows for deeper semantic understanding. 

This model retains contextual information during query-document interaction, leading to better relevance scoring. In terms of efficiency and scalability benefits, documents and queries will be encoded separately, which gives opportunity for precomputation and storage of document embeddings for faster retrieval. 

**Note:** *This feature supports all the original quantization compression methods, just the same as the regular search method.* 

The `colbert` parameter is configured via Query API and is compatible with a host of other functionalities. As you can see here, Query can handle exceedingly complex requests:

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "prefetch": {
            "query": [1, 23, 45, 67], // <------ small byte vector
            "using": "mrl_byte"
            "limit": 1000,
        },
        "query": [0.01, 0.45, 0.67, ...], // <-- full dense vector
        "using": "full"
        "limit": 100,
    },
    "query": [           // <─┐
        [0.1, 0.2, ...], // < │
        [0.2, 0.1, ...], // < ├─ multi-vector
        [0.8, 0.9, ...]  // < │
    ],                   // <─┘       
    "using": "colbert",
    "limit": 10
}
```

Keep in mind, the multivector feature is not only useful for ColBERT; it can also be utilized in other ways. For instance, in e-commerce, you can use multivector to store multiple images of the same item. This serves as an alternative to the [group-by](/documentation/concepts/search/#grouping-api) method. 


## Sparse Vectors Compression
For `sparse` vectors, we are introducing 1) a new **data type** for vectors and 2) a different way of **storing** these vectors. 

**For data types**, sparse vectors were represented in larger f32 values, but now they can be turned to the f16 or f8 data type. f16/f8 have a lower precision compared to f32, which means that there is less numerical accuracy in the vector values - but this is negligible for practical use cases. These vectors will use at least half the memory of f32, which can significantly reduce the footprint of large vector datasets. Operations can be faster due to reduced memory bandwidth requirements and better cache utilization. This can lead to faster vector search operations, especially in memory-bound scenarios.

**In terms of storage**, bit packing minimizes the bits needed to store data, crucial for handling sparse vectors in applications like machine learning and data compression. For sparse vectors with mostly zeros, it focuses on storing only the indices and values of non-zero elements. You will benefit from a more compact storage and higher processing efficiency. This can also lead to reduced dataset sizes for faster processing and lower storage costs in data compression.

## New Rust Client 
Qdrant’s reshaped Rust client is now more accessible and easier to use. We have focused on putting together a minimalistic user experience. Its ownership model ensures memory safety without needing a garbage collector, making it ideal for managing intensive computations and large datasets typical of vector databases. Additionally, Rust supports safe concurrent execution, which is crucial for handling multiple simultaneous requests efficiently.

> [Rust Client Repository](https://github.com/qdrant/rust-client) and [Rust Documentation](https://docs.rs/qdrant-client)

## S3 Snapshot Storage
How it works: Qdrant Collections, Shards and Storage can be snapshotted and saved in case of data loss or other data transfer/backup purposes.These snapshots can be quite large and the resources required to maintain them can result in higher costs. AWS S3 is a great low-cost alternative that can hold snapshots without incurring high costs. It is globally reliable, scalable and resistant to data loss. 

User benefit: This integration allows for a more convenient distribution of snapshots. AWS users can now benefit from other platform services, such as automated workflows and disaster recovery options. S3's encryption and access control ensure secure storage and regulatory compliance. Additionally, S3 supports performance optimization through various storage classes and efficient data transfer methods, enabling quick and effective snapshot retrieval and management.