---
title: Explore the Qdrant Ecosystem
short_description: "Explore the Qdrant ecosystem of integrations, partners, frameworks, and community tools built around vector search."
description: "Discover the Qdrant ecosystem — integrations with frameworks, embedding providers, cloud platforms, and community-built tools for vector search."
slug: ecosystem
aliases:
  - /documentation/build/
breadcrumb: false
content:
  - partial: documentation/banners/banner-c
    title: Explore the Qdrant Ecosystem
    description: Dev-portal Ecosystem
    image:
      src: /img/dev-portal-build/spanish-ai-app-hero.png
      alt: Spanish AI app.png
    startedButton:
      text: Get Started
      url: https://qdrant.to/cloud
  - partial: documentation/sections/cards-section
    title: Start Building
    description: Deploy and manage high-performance vector search clusters across cloud environments. Easily scale with fully managed cloud solutions, integrate seamlessly across hybrid setups, or maintain complete control with private cloud deployments in Kubernetes.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-build/search.png
        alt: Search
      title: Search
      description: Build a simple neural search service with Qdrant and FastEmbed. Learn how to upload data, create indexes, and run search queries.
      link:
        url: /documentation/tutorials-develop/hybrid-search-fastembed/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-build/rag.png
        alt: RAG
      title: RAG
      description: Build end-to-end prototype chatbots. Learn how Qdrant integrates with popular RAG frameworks like LangChain and LlamaIndex.
      link:
        url: /documentation/frameworks/langchain/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-build/pipelines.png
        alt: Pipelines
      title: Pipelines
      description: Integrate Qdrant into your data infrastructure by connecting with popular data engineering tools.
      link:
        url: /documentation/send-data/
        text: Read More
partition: ecosystem
hideInSidebar: true
build:
  render: always
---

# Explore the Qdrant Ecosystem

## Migration

- [Migration Tool](/documentation/migrate-to-qdrant/index.md) — Move vectors, payloads, and sparse embeddings from Chroma, Pinecone, Weaviate, Milvus, pgvector, Elasticsearch, and OpenSearch.
- [Migration Guidance](/documentation/migration-guidance/index.md) — Structured framework for verifying migrations and catching silent data and search regressions.
- [Data Synchronization](/documentation/data-synchronization/index.md) — Keep Qdrant in sync with source databases using CDC, batch reindexing, or dual-write patterns for fresh search results.

## Integrations

- [Data Management](/documentation/data-management/index.md) — Connect Qdrant to ETL and streaming tools to ingest, transform, and sync vectors at scale.
- [Embedding Providers](/documentation/embeddings/index.md) — Connect to 30+ providers: OpenAI, Cohere, Jina, Mistral, AWS Bedrock, Voyage AI, Ollama, and more.
- [Frameworks](/documentation/frameworks/index.md) — Integrations with 40+ AI agent and RAG frameworks: LangChain, LlamaIndex, Haystack, CrewAI, AutoGen, Spring AI, and more.
- [Observability](/documentation/observability/index.md) — Connect Qdrant to Datadog, OpenLIT, and OpenLLMetry to monitor performance and traces.
- [Platforms](/documentation/platforms/index.md) — No-code and low-code integrations with n8n, Make, MuleSoft, Pipedream, Power Apps, and more.

## Ecosystem Guides

- [Essential Examples](/documentation/tutorials-build-essentials/index.md) — Hands-on tutorials for agentic RAG, multimodal search, data ingestion, and automation integrations.
- [Build Prototypes](/documentation/examples/index.md) — End-to-end code samples for RAG pipelines, hybrid search, multitenancy, recommendations, and multimodal search.
- [Improve Search](/documentation/improve-search/index.md) — Techniques for improving retrieval relevance and pipeline output quality.
- [Practice Datasets](/documentation/datasets/index.md) — Ready-made Qdrant snapshots of public datasets you can import and explore without the embedding step.
