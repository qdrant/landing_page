---
label: Approximate nearest neighbor
title: Find the Nearest Vectors Fast With Approximate Nearest Neighbor Search
description: Qdrant indexes vectors in an HNSW graph, a graph-based approximate nearest neighbor index that makes large-scale search fast at a small, measurable recall cost.
image:
  src: /img/lp-similarity/graph-walk.png
  alt: An approximate nearest neighbor search walking the HNSW graph from an entry point through hops to the query's nearest neighbors
cards:
  - id: 0
    title: Tune speed against recall per query.
    description: Raise hnsw_ef to visit more of the graph for higher recall, or lower it for speed.
    icon:
      src: /icons/outline/award-blue.svg
      alt: ""
  - id: 1
    title: Check against exact results.
    description: 'Set exact: true to run a full scan and compare the approximate results with the ground truth.'
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Choose what sits in memory.
    description: Keep vectors or the index on disk for collections that outgrow RAM, and keep the hot path in memory.
    icon:
      src: /icons/outline/disk-storage-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
