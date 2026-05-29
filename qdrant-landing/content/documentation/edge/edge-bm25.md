---
title: "BM25"
short_description: "Generate BM25 sparse embeddings for keyword search with Qdrant Edge, compatible with server-side BM25 collections."
description: "Use the built-in BM25 embedder in Qdrant Edge to generate sparse text embeddings on-device for keyword search, without an internet connection or external model server."
weight: 16
partition: develop
---

# BM25 with Qdrant Edge

[BM25](/documentation/search/text-search/#bm25) (Best Matching 25) is a popular sparse-vector ranking algorithm for full-text search. Qdrant Edge includes a built-in BM25 embedder, so you can run keyword search without an internet connection or external embedding service.

The BM25 embedder is compatible with server-side BM25: vectors produced by the Qdrant Edge embedder use the same token IDs and scoring formula as Qdrant Server's [text search](/documentation/search/text-search/#bm25) pipeline. You can initialize an Edge Shard from a server snapshot and query it with locally produced BM25 vectors without re-indexing.

In Python, use the `Bm25` and `Bm25Config` classes. In Rust, use `EdgeBm25` and `EdgeBm25Config` from the `qdrant_edge::bm25_embed` module.

## Configure a Sparse Vector

To get started with BM25, create an Edge Shard with a sparse vector field and `Modifier.Idf`. The IDF modifier enables inverse document frequency weighting, which is required for BM25 scoring:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="configure-bm25-shard" >}}

## Create a BM25 Embedder

Instantiate a BM25 embedder with a language setting. The embedder applies stemming and stopword filtering for the specified language:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="create-bm25" >}}

`Bm25Config` accepts the following parameters:

| Parameter | Description |
|---|---|
| `language` | Language for stemming and stopwords (for example, `"english"`, `"german"`). Defaults to `"english"`. |
| `k` | Term frequency saturation parameter. Default: `1.2`. |
| `b` | Document length normalization factor. Default: `0.75`. |
| `avg_len` | Expected average document length in tokens. Default: `256`. |
| `lowercase` | Convert tokens to lowercase before embedding. Default: `true`. |
| `ascii_folding` | Normalize accented characters to ASCII equivalents. Default: `false`. |
| `stemmer` | Override the stemming algorithm. |
| `stopwords` | Override the stopword list. |
| `min_token_len` | Minimum token length to include. |
| `max_token_len` | Maximum token length to include. |

For a full description of each parameter, see [Configuring BM25 Parameters](/documentation/search/text-search/#configuring-bm25-parameters).

## Embed and Upsert Documents

Use `embed_document` to generate a sparse vector for each document, then upsert the points. Call `optimize` after bulk inserts to build the sparse index:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="embed-and-upsert" >}}

## Query

Use `embed_query` to generate a sparse vector for the query text, then query the shard:

{{< code-snippet path="/documentation/headless/snippets/edge/bm25/" block="query-with-bm25" >}}

Always use `embed_query` for query text and `embed_document` for document text. Using the wrong function produces incorrect results, since BM25 applies different term weighting depending on the input type.
