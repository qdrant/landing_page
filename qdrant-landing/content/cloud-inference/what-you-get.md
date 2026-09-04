---
label: What You Get
title: Inference Runs Inside Your Cluster
description: Qdrant Cloud Inference ships a set of hosted models you call through the same API as your database.
image:
  src: /img/cloud-inference/inference-flow.png
  alt: Your application sending text and images to an embedding model inside a Qdrant Cloud cluster, writing to collections A, B, and C
items:
  - id: 0
    title: One call from query to result.
    description: >-
      Send raw text, image or multivectors, get ranked results back. Your application
      code handles one request type, covering both vectorization and retrieval in a
      single operation.
  - id: 1
    title: Run hybrid search at no inference cost.
    description: >-
      Pair a free dense model like all-MiniLM-L6-v2 with BM25; free models carry no token
      charges and are available even on free-tier clusters. SPLADE and other larger
      models are metered. Sparse and dense embeddings run together, so keyword-precision
      and semantic recall are available in the same query through the same managed
      endpoint. Cluster resources bill as usual.
button:
  text: Read About Inference
  url: /documentation/inference/
sitemapExclude: true
---
