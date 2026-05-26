---
subtitle: HOW IT WORKS
title: Three Steps to Agent Memory
description: No infra team required. Go from zero to production retrieval in a single session.
steps:
  - id: 0
    title: Store Context
    description: Embed and upsert conversation history, documents, tool outputs, or any unstructured data your agent needs to remember.
    code: |
      client.upsert(collection, points)
  - id: 1
    title: Retrieve with Filters
    description: Combine semantic similarity with metadata filters (session, user, timestamp, tool) to get precisely scoped context every query.
    code: |
      client.query_points(query, filter)
  - id: 2
    title: Feed to Your LLM
    description: Inject retrieved context into your agent's prompt. Qdrant handles relevance ranking so your LLM generates grounded responses.
    code: |
      messages += [{"role": "system",...}]
image:
  src: /img/ai-agents-memory.svg
  alt: Vector Search for Agent Memory
sitemapExclude: true
---