---
title: Find Your Pattern by Experiment
description: Plan three to five days (a coding agent can run the loop for you).
steps:
  - number: 1
    title: Write targets down first.
    description: 'For example, 99% recall at p99 under 100 ms.'
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 2
    title: Sample 100,000 to 1,000,000 points with labeled queries.
    description: Search then runs through the HNSW index.
    icon:
      src: /icons/outline/puzzle-blue.svg
  - number: 3
    title: Start with dense search.
    description: Then add BM25 and fusion.
    icon:
      src: /icons/outline/shield-check-blue.svg
  - number: 4
    title: Add filters and tune weights.
    description: Then try a formula or a reranker.
    icon:
      src: /icons/outline/filter-blue.svg
  - number: 5
    title: Validate on held-out queries.
    description: 'Expect recall@10 of 0.85 to 0.95 against the source.'
    icon:
      src: /icons/outline/chart-bar-blue.svg
  - number: 6
    title: Load-test at peak query rate.
    description: Use bfb, Qdrant's benchmarking tool.
    icon:
      src: /icons/outline/binary-blue.svg
button:
  text: Read the article on search quality
  url: https://qdrant.tech/articles/search-quality/
sitemapExclude: true
---
