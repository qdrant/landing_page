---
label: Embeddings and ranking
title: Let Qdrant Cloud Create the Embeddings
description: Qdrant Cloud Inference generates dense, sparse, and multimodal embeddings inside Qdrant Cloud, or proxies requests to OpenAI, Cohere, and Jina.
cards:
  - id: 0
    title: Send text and get results.
    description: Pass a document with the text and model name, and Cloud Inference handles the embedding.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Rerank at the token level.
    description: Fetch candidates with a fast first query, then rerank them with a ColBERT multivector, scored by MaxSim on the server, in the same request.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Lower the cost of RAG storage.
    description: Scalar quantization stores your vectors in 4x less memory than float32.
    icon:
      src: /icons/outline/disk-storage-blue.svg
      alt: ""
sitemapExclude: true
---
