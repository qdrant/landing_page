---
label: Similarity search
title: Run Similarity Search in the Metric Your Model Expects
description: Qdrant supports cosine similarity, dot product, Euclidean distance, and Manhattan distance for dense vectors, set per collection.
cards:
  - id: 0
    title: Get cosine similarity search with normalization built in.
    description: Qdrant normalizes each vector on write and computes cosine in two steps, which gives a higher search speed.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Cut off weak matches.
    description: Set score_threshold to exclude every result with a score worse than the value you give.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Search in batches.
    description: Send many queries in one request; n batched searches return the same results as n single searches.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
sitemapExclude: true
---
