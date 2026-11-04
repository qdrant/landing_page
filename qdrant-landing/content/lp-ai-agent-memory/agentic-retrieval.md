---
label: What's included
title: Let Autonomous AI Systems Adapt Retrieval at Query Time
description: In agentic RAG, the agent decides what to retrieve at each step. It might start with dense search, switch to hybrid search, tighten a filter, or re-weight scores based on what the last step returned. Qdrant exposes each retrieval primitive so a retrieval agent can combine them per query.
cards:
  - id: 0
    title: Combine hybrid search and filters in one query.
    description: Hybrid search pairs semantic matching with keyword matching, and re-ranking improves the final order.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Run late-interaction models such as ColBERT.
    description: Multi-vector support lets a retrieval agent use token-level models for higher precision.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
button:
  text: Explore Hybrid Search
  url: https://qdrant.tech/documentation/search/hybrid-queries/
sitemapExclude: true
---
