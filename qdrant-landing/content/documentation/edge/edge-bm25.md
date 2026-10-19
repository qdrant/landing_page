---
title: "BM25"
short_description: "Rank points by BM25 relevance with Qdrant Edge, using a full-text index on a payload field."
description: "Run BM25 keyword search on-device with Qdrant Edge: create a full-text index with scoring, query text fields, tune k and b, and configure language-specific text processing."
weight: 16
partition: develop
---

# BM25 with Qdrant Edge

[BM25](https://en.wikipedia.org/wiki/Okapi_BM25) (Best Matching 25) is a popular ranking algorithm for keyword search. Qdrant Edge computes BM25 scores from a [full-text index](/documentation/manage-data/indexing/#full-text-index) on a payload field, so you can run keyword search on-device without an embedding model or an internet connection. The index holds everything BM25 needs, including the length of each document, so Qdrant Edge derives all statistics from your data.

<aside role="status">Qdrant Edge also includes a BM25 embedder that generates sparse vectors, compatible with sparse vector BM25 on Qdrant Server. In Python, use the <code>Bm25</code> class. In Rust, use <code>EdgeBm25</code> from the <code>qdrant_edge::bm25_embed</code> module. Refer to <a href="/documentation/search/text-search/sparse-vector-search/#bm25">Sparse Vector Search</a>.</aside>

## Create a Full-Text Index with Scoring

An Edge Shard requires at least one vector. This example configures a small dense vector, which you can also use for [hybrid search](/documentation/search/text-search/hybrid-search/):

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="configure-bm25-shard" >}}

To rank points with BM25, create a full-text index on the field you want to search and enable `scoring`. For example, to search the titles of books:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="create-bm25-index" >}}

This index also applies English stemming and stopword removal, which improves BM25 results for English text. Refer to [Text Processing](/documentation/search/text-search/full-text-search/#text-processing).

## Add Points

Store the text in the indexed payload field:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="upsert-points" >}}

## Query a Text Field

To run a BM25 query, use a `TextQuery` with the name of the indexed payload field and the query text. The following example searches for books with "time travel" in the title:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="query-bm25" >}}

A point matches the query if its text contains at least one of the query terms. Points that contain none of the terms are not returned. To require or exclude specific terms, add a [full-text filter](/documentation/search/filtering/#full-text-match) to the query.

A `TextQuery` can also be used in a prefetch, for example, to combine BM25 with dense vector search in [hybrid search](/documentation/search/text-search/hybrid-search/).

### Configure BM25 Parameters

The BM25 [ranking function](https://en.wikipedia.org/wiki/Okapi_BM25#The_ranking_function) has two parameters that you can set per query:

- `k`. Controls term frequency saturation. Higher values increase the influence of term frequency. Must be 0 or greater. Defaults to 1.2.
- `b`. Controls document length normalization. Ranges from 0 (no normalization) to 1 (full normalization). A higher value means longer documents have less impact. Defaults to 0.75.

Because these parameters are set per query, you can change them without rebuilding the index:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="query-bm25-params" >}}
