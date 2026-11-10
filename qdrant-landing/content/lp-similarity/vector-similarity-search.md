---
label: Vector similarity search
title: Filter and Rank in One Vector Similarity Search
description: Most apps filter and rank at once. Qdrant applies payload filters while it searches the vectors, so every result is both close and in scope.
cards:
  - id: 0
    title: Filter inside the graph.
    description: Index a payload field, and Qdrant adds links between points that share its values, so filtered queries keep a connected path to the nearest neighbors.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Keep recall under tight filters.
    description: 'In Qdrant''s published test on one million vectors, the default query planner held 99.9% to 100% recall@10 across four single-keyword filters, down to 0.012% of points.'
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
