---
label: Vector embedding database
title: Keep Each Embedding Next to the Data You Filter On
description: In a vector embedding database setup, each Qdrant point holds its vectors and a JSON payload, so you filter and rank in the same place you store.
cards:
  - id: 0
    title: Store several vector types per point.
    description: Keep dense and sparse vectors next to each other in one collection.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Create embeddings in the cluster.
    description: Qdrant Cloud Inference generates dense, sparse, and multimodal embeddings inside Qdrant Cloud.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Index the fields you filter on.
    description: Create a payload index on a field, and Qdrant adds filter-aware links to the HNSW graph.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
sitemapExclude: true
---
