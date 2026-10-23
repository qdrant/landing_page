---
label: What you get
title: Search Any Subset, at Any Scale
description: As collections grow toward billions of vectors, your queries should still return the best match for search subsets of every size, whether it's a vendor, a jurisdiction, or a narrow overlap of several filters.
variant: grid
cards:
  - title: Balance recall and speed.
    description: Even with complex filtering, Qdrant keeps the graph connected, so you get your truest nearest match with low latency.
    icon:
      src: /icons/outline/speedometer-blue.svg
  - title: No pre-filtering and post-filtering tradeoffs.
    description: Pre-filtering sacrifices performance. Post-filtering discards the top k and misses the best match. Qdrant filters inside search instead, so neither tradeoff applies.
    icon:
      src: /icons/outline/filter-blue.svg
    links:
      - text: Learn more about pre-filtering vs post-filtering vs Qdrant
        url: /blog/pre-filtering-vs-post-filtering/
  - title: Reach the truest match.
    description: Where those approaches may never reach the truest match, Qdrant's traversal follows extra edges to it.
    icon:
      src: /icons/outline/target-blue.svg
  - title: Deliver high accuracy and precision.
    description: Qdrant's metadata filtering gives you both a tighter data scope and better recall, so your scoped queries return the right matches.
    icon:
      src: /icons/outline/precision-blue.svg
  - title: Benchmark every filter shape.
    description: Use our benchmark kit to find your optimal filter shape.
    icon:
      src: /icons/outline/chart-bar-blue.svg
links:
  - text: Get the benchmark kit
    url: https://github.com/qdrant-labs/acorn-filterable-hnsw-benchmark
  - text: See the payload index docs
    url: /documentation/manage-data/indexing/#payload-index
sitemapExclude: true
---
