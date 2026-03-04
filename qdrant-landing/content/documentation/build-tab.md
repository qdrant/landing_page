---
title: Ecosystem
slug: ecosystem
breadcrumb: false
aliases:
  - /documentation/build/
content:
  - partial: documentation/banners/banner-c
    title: Ecosystem
    description: Tools, integrations, and guides for building with Qdrant.
    image:
      src: /img/dev-portal-build/spanish-ai-app-hero.png
      alt: Qdrant Ecosystem
    startedButton:
      text: Get Started
      url: https://qdrant.to/cloud
  - partial: documentation/sections/cards-section
    title: Qdrant Tools
    description: First-party tools to simplify embedding generation, edge deployments, and external integrations.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-build/search.png
        alt: FastEmbed
      title: FastEmbed
      description: A lightweight Python library for fast, local embedding generation. Runs locally without a GPU.
      link:
        url: /documentation/fastembed/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-build/rag.png
        alt: Qdrant Edge
      title: Qdrant Edge
      description: Run Qdrant on edge devices and synchronize data with a central Qdrant cluster.
      link:
        url: /documentation/edge/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-build/pipelines.png
        alt: MCP Server
      title: MCP Server
      description: Connect Claude and other AI assistants directly to your Qdrant collections via the Model Context Protocol.
      link:
        url: /documentation/qdrant-mcp-server/
        text: Read More
  - partial: documentation/sections/cards-section
    title: Integrations
    description: Connect Qdrant with your existing data pipelines, embedding models, AI frameworks, and observability tools.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-build/search.png
        alt: Frameworks
      title: Frameworks
      description: Use Qdrant with LangChain, LlamaIndex, Haystack, and many more AI application frameworks.
      link:
        url: /documentation/frameworks/
        text: Read More
    - id: 2
      image:
        src: /img/dev-portal-build/rag.png
        alt: Embeddings
      title: Embeddings
      description: Generate embeddings with OpenAI, Cohere, Voyage, Mistral, and other leading embedding providers.
      link:
        url: /documentation/embeddings/
        text: Read More
    - id: 3
      image:
        src: /img/dev-portal-build/pipelines.png
        alt: Data Management
      title: Data Management
      description: Stream, transform, and load data into Qdrant using Airbyte, Kafka, dbt, Spark, and more.
      link:
        url: /documentation/data-management/
        text: Read More
partition: ecosystem
hideInSidebar: true
---
