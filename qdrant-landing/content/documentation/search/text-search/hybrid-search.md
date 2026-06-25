---
title: Combining Semantic and Lexical Search
short_description: "Combine dense and sparse vectors in Qdrant for hybrid search that handles both semantic queries and keyword lookups in a single request."
description: "Build hybrid search pipelines in Qdrant by combining dense semantic vectors and sparse lexical vectors with the prefetch API and Reciprocal Rank Fusion for comprehensive search results."
weight: 3
---

# Combining Semantic and Lexical Search using Hybrid Search

[Hybrid search](/documentation/search/hybrid-queries/#hybrid-search) enables you to combine semantic and lexical search in a single query, returning results that match the semantic meaning, the exact keywords, or both. This is useful when you don't know whether the user is looking for a specific keyword or a semantically similar document. For example, when searching for books, a user may enter "time travel" to find books related to the concept of time travel, but they may also enter a book's ISBN to find a specific book. Hybrid queries enable you to return results for both cases in a single query.

Hybrid queries make use of Qdrant's ability to store [multiple named vectors](/documentation/manage-data/vectors/#named-vectors) in a single point. For example, you can store a dense vector for semantic search and a sparse vector for lexical search in the same point. To do so, first create a collection with both a dense vector and a sparse vector:

{{< code-snippet path="/documentation/headless/snippets/text-search/create-hybrid-collection/" >}}

After ingesting data with both vectors, you can use the prefetch feature to run both semantic and lexical queries in a single request. The results of both queries are then combined using a fusion method like Reciprocal Rank Fusion (RRF).

{{< code-snippet path="/documentation/headless/snippets/text-search/hybrid-prefetch-rrf/" >}}

This query searches for an ISBN, for which only the lexical search returns a result. The `score_threshold` for the semantic query prevents low-scoring results to be returned (0.5 is just an example threshold; you need to tune what a good threshold is for your data and model). So in this case, only the lexical result is returned to the user. If a user had searched for "time travel", only the semantic search would return results, and those would be returned to the user. If a user would search for a term that matched both the semantic and lexical vectors, the results from both searches would be combined to provide a more comprehensive set of results. 

You are not limited to prefetching just two queries. Examples include, but are not limited to:

- Fuse multiple lexical queries across the `title`, `author`, and `isbn` fields alongside a semantic query to achieve a comprehensive search across all data.
- Prefetch using sparse or dense vectors and/or filters, and [rescore with dense vectors](/documentation/search/hybrid-queries/#multi-stage-queries).
- [Prefetch with dense and sparse vectors, and rerank using late interaction embeddings](/documentation/tutorials-basics/reranking-hybrid-search/?q=late+interaction).
