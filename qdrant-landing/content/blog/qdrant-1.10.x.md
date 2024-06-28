---
title: "Qdrant 1.10 - Universal Query, IDF & ColBERT Support"
draft: false
short_description: "Single search API. Server-side IDF. Native multivector support."
description: "Consolidated search API, built-in IDF, and native multivector support. " 
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

**Universal Query API:** All search APIs, including Hybrid Search, are now in one Query endpoint.</br>
**Built-in IDF:** We added the IDF mechanism to Qdrant's core search and indexing processes.</br>
**Multivector Support:** Native support for late interaction ColBERT is accessible via Query API.

## One Endpoint for All Queries
**Query API** will consolidate all search APIs into a single request. Previously, you had to work outside of the API to combine different search requests. Now these approaches are reduced to parameters of a single request, so you can avoid merging individual results. 

You can now configure the Query API request with the following parameters:

|Parameter|Description|
|-|-|
|no parameter|Returns points by `id`|
|`nearest`|Queries nearest neighbors ([Search](/documentation/concepts/search/))|
|`fusion`|Fuses sparse/dense prefetch queries ([Hybrid Search](/articles/sparse-vectors/))|
|`discover`|Queries `target` with added `context` ([Discovery](/documentation/concepts/explore/#discovery-api))|
|`context` |No target with `context` only ([Context](/documentation/concepts/explore/#context-search))|
|`recommend`|Queries against `positive`/`negative` examples. ([Recommendation](/documentation/concepts/explore/#recommendation-api))|
|`order_by`|Orders results by [payload field](/documentation/concepts/points/#order-points-by-payload-key)|

For example, you can configure Query API to run [Discovery search](/documentation/concepts/explore/#discovery-api). Let's see how that looks:

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

We will be publishing code samples in [docs](/documentation/concepts/search/) and our new [API specification](http://api.qdrant.tech).</br> *If you need additional support with this new method, our [Discord](https://qdrant.to/discord) on-call engineers can help you.*

### Native Hybrid Search Support
Query API now also natively supports **sparse/dense fusion**. Up to this point, you had to combine the results of sparse and dense searches on your own. This is now sorted on the back-end, and you only have to configure them as basic parameters for Query API. 

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
### Sub-Requests
Query API can now perform sub-requests, which means you can run queries sequentially within the same API call. There are a lot of options here, so you will need to define a strategy to merge these requests using new parameters. For example, you can now include **rescoring within Hybrid Search**, which can open door to strategies like iterative refinement via matryoshka embeddings. 

*To learn more about Sub-Requests, read the [Query API documentation](/documentation/concepts/search/).*

## Inverse Document Frequency [IDF]

IDF is a critical component of the **TF-IDF (Term Frequency-Inverse Document Frequency)** weighting scheme used to evaluate the importance of a word in a document relative to a collection of documents (corpus).
Here is how IDF is calculated:

$$
\text{IDF}(q_i) = \ln \left(\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5}+1\right)
$$

Where:</br>
`N` is the total number of documents in the collection. </br>
`n` is the number of documents containing non-zero values for the given vector.

Due to its relevance to BM25, we decided to move the IDF calculation into the Qdrant engine itself. This type of separation allows streaming updates of the sparse embeddings while keeping the IDF calculation up-to-date.

This mechanism is relevant when using BM25, but even more so for TFIDF. It previously had to be calculated using all the documents on the client side. However, now that Qdrant does it out of the box, you won't need to implement it anywhere else and recompute the value if some documents are removed or new added.

You can enable the IDF modifier in the collection configuration:

```http
PUT /collections/{collection_name}
{
    "sparse_vectors": {
        "text": {
            "modifier": "idf"
        }
    }
}
```
```python
from qdrant_client import QdrantClient, models
client = QdrantClient(url="http://localhost:6333")
client.create_collection(
    collection_name="{collection_name}",
    sparse_vectors={
        "text": models.SparseVectorParams(
            modifier=models.Modifier.IDF,
        ),
    },
)
```

### IDF as Part of BM42

This quarter, Qdrant's also introduced BM42, a novel algorithm that combines the IDF element of BM25 with **transformer-based attention matrices** to improve text retrieval. It utilizes attention matrices from `all-MiniLM-L6-v2` to determine CLS token importance. 

In practical terms, the BM42 method addresses the tokenization issues and computational costs associated with SPLADE. The model is both efficient and effective across different document types and lengths, offering enhanced search performance by leveraging the strengths of both BM25 and modern transformer techniques.

> To learn more about IDF and BM42, read our [dedicated technical article].

**You can expect BM42 to excel in scalable RAG-based scenarios where short texts are more common.** Document inference speed is much higher with BM42, which is critical for large-scale applications such as search engines, recommendation systems, and real-time decision-making systems.

## ColBERT Multivector Support 
We are adding native support for multivector search, compatible with the late-interaction [ColBERT](https://github.com/stanford-futuredata/ColBERT) model. If you are working with high-dimensional similarity searches, **ColBERT is highly recommended as a reranking step in the Universal Query search.** You will experience better quality of vector retrieval, since ColBERT’s approach  allows for deeper semantic understanding. 

This model retains contextual information during query-document interaction, leading to better relevance scoring. In terms of efficiency and scalability benefits, documents and queries will be encoded separately, which gives opportunity for precomputation and storage of document embeddings for faster retrieval. 

**Note:** *This feature supports all the original quantization compression methods, just the same as the regular search method.* 

**Run a query with ColBERT vectors:**

The `colbert` parameter is configured via Query API and is compatible with a host of other functionalities. As you can see here, Query API can handle exceedingly complex requests:

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

**Note:** *The multivector feature is not only useful for ColBERT; it can also be used in other ways.*</br> 
For instance, in e-commerce, you can use multivector to store multiple images of the same item. This serves as an alternative to the [group-by](/documentation/concepts/search/#grouping-api) method. 

## Sparse Vectors Compression

In version 1.9, we introduced the `uint8` [vector datatype](/documentation/concepts/collections/#vector-datatypes) for sparse vectors, in order to support pre-quantized embeddings from companies like JinaAI and Cohere. 
This time, we are introducing a new datatype **for both sparse and dense vectors**, as well as a different way of **storing** these  vectors. 

**Datatype:** Sparse and dense vectors were previously represented in larger `float32` values, but now they can be turned to the `float16`. `float16` vectors have a lower precision compared to `float32`, which means that there is less numerical accuracy in the vector values - but this is negligible for practical use cases. 

These vectors will use at least half the memory of regular vectors, which can significantly reduce the footprint of large vector datasets. Operations can be faster due to reduced memory bandwidth requirements and better cache utilization. This can lead to faster vector search operations, especially in memory-bound scenarios.

When creating a collection, you need to specify the `datatype` upfront:
```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 1024,
      "distance": "Cosine",
      "datatype": "float16"
    }
}
```
**Storage:** On the backend, we implemented bit packing to minimize the bits needed to store data, crucial for handling sparse vectors in applications like machine learning and data compression. For sparse vectors with mostly zeros, this focuses on storing only the indices and values of non-zero elements. 

You will benefit from a more compact storage and higher processing efficiency. This can also lead to reduced dataset sizes for faster processing and lower storage costs in data compression.

## New Rust Client 
Qdrant’s reshaped Rust client is now more accessible and easier to use. We have focused on putting together a minimalistic user experience. Its ownership model ensures memory safety without needing a garbage collector, making it ideal for managing intensive computations and large datasets typical of vector databases. Additionally, Rust supports safe concurrent execution, which is crucial for handling multiple simultaneous requests efficiently.

<p align="center">
    <a href="https://github.com/qdrant/rust-client">Rust Client Repo</a> and 
    <a href="https://docs.rs/qdrant-client">Client Documentation</a>
</p>

## S3 Snapshot Storage
Qdrant **Collections**, **Shards** and **Storage** can be backed up with [Snapshots](/documentation/concepts/snapshots/) and saved in case of data loss or other data transfer purposes. These snapshots can be quite large and the resources required to maintain them can result in higher costs. [AWS S3](https://aws.amazon.com/s3/) is a great low-cost alternative that can hold snapshots without incurring high costs. It is globally reliable, scalable and resistant to data loss. 

You can configure S3 bucket settings in the [config.yaml](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), specifically under`snapshots_storage`.

```yaml
storage:
  # Where to store all the data
  storage_path: ./storage

  # Where to store snapshots
  snapshots_path: ./snapshots

  snapshots_config:
    # "local" or "s3" - where to store snapshots
    snapshots_storage: local
    # s3_config:
    #   bucket: ""
    #   region: ""
    #   access_key: ""
    #   secret_key: ""
```

*Read more about [configuring Qdrant defaults](https://qdrant.tech/documentation/guides/configuration/).*

This integration allows for a more convenient distribution of snapshots. AWS users can now benefit from other platform services, such as automated workflows and disaster recovery options. S3's encryption and access control ensure secure storage and regulatory compliance. Additionally, S3 supports performance optimization through various storage classes and efficient data transfer methods, enabling quick and effective snapshot retrieval and management.


## Issues API 
Issues API reports irregularities in case something isn't operating up to standards. This powerful new feature allows users (such as database admins) to efficiently manage and track issues directly within the system, ensuring smoother operations and quicker resolutions.

You can find the Issues button in the top right. When you click the bell icon, a sidebar will open to show ongoing issues.

![issues api](/blog/qdrant-1.10.x/issues.png)


## Optimized Collection Loading 

(account for RocksDB and WAL issues)

Need assistance here.