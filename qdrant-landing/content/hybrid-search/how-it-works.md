---
label: How it works
title: Set Up Hybrid Search on a Single Qdrant Collection
description: In legal and semantic workloads, hybrid search opens retrieval that pure vector search misses.
steps:
  - number: 1
    title: Configure miniCOIL sparse vectors with an IDF modifier for open retrieval.
    description: miniCOIL calculates Inverse Document Frequency inside Qdrant, so configure its sparse vectors with the IDF modifier to get accurate keyword weighting across your collection.
    icon:
      src: /icons/outline/square-pen-blue.svg
  - number: 2
    title: Store vectors and metadata together in a Qdrant collection.
    description: Qdrant stores vectors and associated metadata in collections.
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 3
    title: Query with two prefetches, sparse and dense, fused by RRF.
    description: Qdrant provides an example of RRF applied to a query with two prefetches, each targeting a different named vector configured for sparse and dense retrieval respectively.
    icon:
      src: /icons/outline/binary-blue.svg
callout:
  text: Fieldy AI updated its backend API calls to use Qdrant's gRPC interface and combined BM25 hybrid search with dense vector retrieval via Reciprocal Rank Fusion for relevance scoring.
  url: https://qdrant.tech/blog/case-study-fieldy/
  label: Read the Fieldy AI case study
button:
  text: See the full hybrid search setup
  url: https://qdrant.tech/documentation/search/text-search/hybrid-search/
sitemapExclude: true
---
