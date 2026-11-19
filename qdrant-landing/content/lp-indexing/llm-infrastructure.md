---
label: LLM infrastructure
title: Fit Qdrant Into Your LLM Infrastructure
description: In LLM application architecture, Qdrant is the retrieval layer. It finds the context each prompt needs, which puts LLM context management inside the query.
cards:
  - id: 0
    title: Scope each prompt's context.
    description: Filter on user, product, or date range during the search, so every passage already matches the request.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Get memory-efficient storage.
    description: Scalar quantization stores vectors in 4x less memory than float32, and binary or product quantization compresses them further to cut cost.
    icon:
      src: /icons/outline/disk-storage-blue.svg
      alt: ""
  - id: 2
    title: Keep your framework.
    description: Qdrant integrates with more than 40 AI agent and RAG frameworks, including LangChain, LlamaIndex, and Haystack.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
