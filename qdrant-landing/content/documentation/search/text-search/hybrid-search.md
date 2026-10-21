---
title: Hybrid Search
short_description: "Combine dense vectors and BM25 full-text search in Qdrant for hybrid search that handles both semantic queries and keyword lookups in a single request."
description: "Build hybrid search pipelines in Qdrant by combining dense semantic vectors and BM25 full-text search with the prefetch API and Reciprocal Rank Fusion for comprehensive search results."
weight: 4
---

# Combining Semantic and Lexical Search using Hybrid Search

[Hybrid search](/documentation/search/hybrid-queries/#hybrid-search) enables you to combine semantic and lexical search in a single query, returning results that match the semantic meaning, the exact keywords, or both. This is useful when you don't know whether the user is looking for a specific keyword or a semantically similar document. For example, when a user searches for "time travel", semantic search finds books whose descriptions are about the concept of time travel, even if they use different words, while lexical search finds books with those exact words in the title. Hybrid queries enable you to return results for both cases in a single query.

For example, you can combine a dense vector for semantic search with [BM25 full-text search](/documentation/search/text-search/full-text-search/) on a payload field for lexical search. To do so, create a collection with a dense vector, and create a full-text index with BM25 scoring enabled on the payload field you want to search:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-hybrid-collection/" >}}

After ingesting data with both the dense vector and the payload field, you can use the prefetch feature to run both semantic and lexical queries in a single request. The results of both queries are then combined using a fusion method like Reciprocal Rank Fusion (RRF).

{{< code-snippet path="/documentation/headless/snippets/text-search/hybrid-prefetch-rrf/" >}}

The semantic query returns books whose descriptions are about time travel, and the BM25 query returns books with "time" or "travel" in the title. Books that appear in both result lists rank highest after fusion. The `score_threshold` for the semantic query prevents weak semantic matches from being returned (0.5 is just an example threshold; you need to tune what a good threshold is for your data and model). If only one of the queries finds matches, the results of that query are returned.

You are not limited to prefetching just two queries. Examples include, but are not limited to:

- Fuse multiple lexical queries across the `title` and `author` fields alongside a semantic query to achieve a comprehensive search across all data.
- Prefetch using BM25, dense vectors, or filters, and [rescore with dense vectors or BM25](/documentation/search/hybrid-queries/#multi-stage-queries).
- [Prefetch with dense vectors and BM25, and rerank using late interaction embeddings](/documentation/tutorials-basics/reranking-hybrid-search/?q=late+interaction).
- Combine dense vectors with [learned sparse vectors](/documentation/search/text-search/sparse-vector-search/), such as SPLADE++ or miniCOIL, instead of BM25.
