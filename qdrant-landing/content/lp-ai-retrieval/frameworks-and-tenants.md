---
label: Frameworks and tenants
title: Keep the RAG Framework You Already Use
description: Qdrant integrates with more than 40 AI agent and RAG frameworks, including LangChain, LlamaIndex, Haystack, CrewAI, and AutoGen. Point your retriever at a Qdrant collection and keep the rest of your chain.
cards:
  - id: 0
    title: Serve many customers from one collection.
    description: Partition a single collection by payload so each tenant's documents stay separate. Bayer runs more than 10,000 knowledge bases this way.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Keep context fresh.
    description: 'Upsert new chunks while the collection keeps serving queries, so answers draw on the latest documents.'
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
