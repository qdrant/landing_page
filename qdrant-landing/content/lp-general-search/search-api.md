---
label: Search API
title: Run Every Query Type Through One Search API
description: Run dense, sparse, hybrid, and multi-stage queries through one Query API. Call it over REST or gRPC, or from the official Python, TypeScript, Rust, Go, .NET, or Java client. Use it as your search results API and get one ranked list per query.
cards:
  - id: 0
    title: Rescore candidates in a second stage.
    description: Fetch them with a fast first query, then rescore with a more accurate one in the same request.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Choose your fusion method.
    description: Fuse prefetch results with Reciprocal Rank Fusion (RRF) or Distribution-Based Score Fusion (DBSF).
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
callout:
  text: Poliscope runs BM25 and dense search in one request across 130 million points. A search across all of Germany's local councils takes 0.87 seconds on average.
  url: https://qdrant.tech/blog/case-study-poliscope/
  label: Read the Poliscope case study
button:
  text: Read the Hybrid Search Docs
  url: https://qdrant.tech/documentation/search/hybrid-queries
sitemapExclude: true
---
