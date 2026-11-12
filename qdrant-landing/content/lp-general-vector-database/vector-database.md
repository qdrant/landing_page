---
label: Vector database
title: What to Test When You Choose a Vector Database
description: Whether you searched for a vector database, a vectordb, or a db vector, the same questions decide the pick. Qdrant is an open source vector search engine, written in Rust under Apache 2.0.
image:
  src: /img/lp-general-vector-database/filter-in-search.png
  alt: A query vector with a filter walks only the matching points of the HNSW graph and returns results that all match.
cards:
  - id: 0
    title: Filter inside the search.
    description: Qdrant applies payload filters while it traverses the HNSW graph, so every result already matches the user, product, or date range you scoped.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Match keywords and meaning in one call.
    description: Run dense and sparse retrieval in one Query API request and fuse the two rankings with Reciprocal Rank Fusion (RRF).
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Boost memory efficiency.
    description: Scalar quantization stores your vectors in 4x less memory than float32, and binary or product quantization compresses them further.
    icon:
      src: /icons/outline/disk-storage-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
