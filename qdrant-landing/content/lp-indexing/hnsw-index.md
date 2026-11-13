---
label: HNSW index
title: Tune One HNSW Index for Speed and Recall
description: Qdrant indexes dense vectors with HNSW, the graph behind fast similarity search at scale. It finds nearest neighbors in a fraction of the comparisons a full scan takes.
image:
  src: /img/lp-indexing/filter-aware-links.png
  alt: A payload index on a field adds filter-aware links between graph points that share a value.
cards:
  - id: 0
    title: Tune build and search separately.
    description: Set m and ef_construct when the graph is built, and raise hnsw_ef per query for higher recall.
    icon:
      src: /icons/outline/square-pen-blue.svg
      alt: ""
  - id: 1
    title: Check recall against exact results.
    description: 'Set exact: true on a query to run a full scan and compare the approximate results with it.'
    icon:
      src: /icons/outline/award-blue.svg
      alt: ""
  - id: 2
    title: Rebuild faster, on GPUs too.
    description: Qdrant reuses the existing HNSW index to speed up the next build, and Qdrant Cloud supports GPUs for indexing on AWS.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
