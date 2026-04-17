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

Reranking pairs especially well with [hybrid search](/documentation/search/hybrid-queries/), which casts a wide retrieval net, maximizing recall across several retrieval paths. Reranking can sort the hybrid search results with a deeper relevance signal. A [late interaction model](/course/multi-vector-search/module-1/late-interaction-basics/), for instance, represents both query and document as multiple vectors, enabling more nuanced term-level comparisons than a single embedding can capture.

In this tutorial, you'll learn how to build a hybrid search engine that uses dense embeddings for semantic search, sparse embeddings for keyword search, and late interaction embeddings for reranking. The result is a powerful search engine that delivers highly relevant results by combining the strengths of different embedding types.

You'll use [Qdrant Cloud Inference](/documentation/inference/#qdrant-cloud-inference) to generate vector embeddings. The three embedding models used in this tutorial (dense, sparse, and late interaction) are available free of charge on Qdrant Cloud. If you prefer to manage your own embedding infrastructure, you can apply the same principles, but you will need to adapt the code examples to use your embedding service.

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

{{< code-snippet path="/documentation/headless/snippets/install-client/" >}}

Next, initialize the client:

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="client-connection" >}}

### Models

Next, define the three embedding models. You'll use the 384-dimensional [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model for dense embeddings, the [`qdrant/bm25`](https://huggingface.co/Qdrant/bm25) model for sparse embeddings, and the 96-dimensional [`answerdotai/answerai-colbert-small-v1`](https://huggingface.co/answerdotai/answerai-colbert-small-v1) multivector model for late interaction embeddings.

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="define-models" >}}

### Create Collection

Create a new collection called `hybrid-search`, configured to handle the three vector types:

- **Dense embeddings** (`dense`) using cosine distance for semantic comparisons.
- **Late interaction embeddings** (`multi`) using cosine distance, with a multivector configuration using the maximum similarity comparator. Note the `m=0` configuration to disable HNSW indexing. These embeddings are used for reranking, not ANN retrieval, so an HNSW index is not needed.
- **Sparse embeddings** (`sparse`) for keyword-based searches using the [IDF modifier](/documentation/manage-data/indexing/#idf-modifier).

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="create-collection" >}}

### Ingest Data

Now you can load the sci-fi book descriptions from a CSV and insert them into the `hybrid-search` collection. With Cloud Inference, embeddings are computed server-side by wrapping the text in a `Document` object.

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="ingest-data" >}}

This code creates a point for each book, with three vector types and a payload containing the title, author, and description. Documents are uploaded to Qdrant in batches of 25, with Cloud Inference generating all three embeddings on the fly. In Production, the optimal batch size depends on your data and cluster, so you may want to experiment with different sizes for best performance.

This code uses a helper function to stream and parse the CSV file:

<details><summary>Details</summary> 
{{< code-snippet path="/documentation/headless/snippets/time-based-sharding/" block="parse-csv" >}}
</details>

### Retrieval

Before combining results, let's see how dense and sparse retrieval perform individually.

For retrieval, wrap the query in a `Document` object so Cloud Inference computes the appropriate embeddings server-side.

**Dense retrieval** captures semantic meaning:

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="dense-retrieval" >}}

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

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="sparse-retrieval" >}}

The top 5 results are:

| Position | Title | Description |
|----------|-------|-------------|
| 1 | Station Eleven | A traveling symphony roams a post-pandemic North America. |
| 2 | Hyperion | Travelers share haunting tales on a pilgrimage to confront the mysterious Shrike. |
| 3 | The Space Between Worlds | A multiverse traveler uncovers dangerous secrets across parallel Earths. |
| 4 | The Time Machine | A Victorian scientist travels far into the future to witness civilization's fate. |
| 5 | Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. |

The sparse BM25 model performs keyword matching with stemming. As a result, it returns books whose descriptions contain variants of the words "time" and "travel". For instance, "Station Eleven" and "Hyperion" mention "traveling" and "travelers" but aren't primarily about time travel.

**Hybrid search** can be used to prefetch the dense and sparse results and next merge them using [Reciprocal Rank Fusion (RRF)](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf):

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="hybrid-search" >}}

This runs two sub-queries in parallel: one using dense embeddings for semantic meaning, the other using sparse BM25 embeddings for keyword matching. The prefetch step retrieves the top 20 candidates from each sub-query (dense and sparse) and fuses the ranked lists into a single result using RRF.

The results are a mix of books that are semantically relevant to time travel and those that contain the keywords, giving you a broader set of relevant documents. However, the ranking may not be optimal since, [by default, RRF treats both signals equally](/documentation/search/hybrid-queries/#weighted-rrf) and doesn't capture the nuanced interactions between query and document terms. For example, "Station Eleven" ranks highly because it has stronger keyword matches, even though it is not about time travel.

| Position | Title | Description |
|----------|-------|-------------|
| 1 | The Time Machine | A Victorian scientist travels far into the future to witness civilization's fate. |
| 2 | Station Eleven | A traveling symphony roams a post-pandemic North America. |
| 3 | Slaughterhouse-Five | A nonlinear, time-tripping reflection on war and fate. |
| 4 | The Space Between Worlds | A multiverse traveler uncovers dangerous secrets across parallel Earths. |
| 5 | Hyperion | Travelers share haunting tales on a pilgrimage to confront the mysterious Shrike. |

### Rerank

The hybrid search results can be reranked using late interaction embeddings for maximum precision. Instead of fusing with RRF, use the ColBERT multi-vector as the final ranking signal:

{{< code-snippet path="/documentation/headless/snippets/tutorial-reranking-hybrid-search/" block="rerank" >}}

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

Reranking with late interaction models can dramatically improve the relevance of search results, especially when combined with hybrid search. Here are some best practices to keep in mind:

- **Continuous testing and monitoring**: regularly evaluate your hybrid search pipelines to avoid overfitting and make timely adjustments to maintain performance.
- **Balance relevance and cost**: Reranking can be computationally expensive, and late interaction embeddings require significant storage. Aim for a balance between relevance and cost. Simple fusion methods like RRF can be effective for many use cases, while late interaction models can be reserved for queries where precision is critical.

## Conclusion

Reranking with late interaction models is a powerful tool that boosts the relevance of search results, especially when combined with hybrid search methods. While it can add some latency due to its complexity, applying it to a smaller, pre-filtered subset of results ensures both speed and relevance.
