---
title: Documentation
short_description: "Build with Qdrant: install, run, and scale a vector search engine across self-hosted, Cloud, Hybrid Cloud, and Private Cloud deployments."
description: "Official Qdrant documentation for vector search and retrieval — quickstarts, deployment guides, integrations, and references for self-hosted and Qdrant Cloud."
weight: 2
hideTOC: true
breadcrumb: false
content:
  - partial: "documentation/banners/banner-a"
    title: Qdrant Documentation
    description: Qdrant is an AI-native vector search and a semantic search engine. You can use it to extract meaningful information from unstructured data.
    linkDescription: <a href="https://github.com/qdrant/qdrant_demo/" target="_blank">Clone this repo now</a> and build a search engine in five minutes.
    cloudButton:
      text: Cloud Quickstart
      url: /documentation/cloud-quickstart/
    localButton:
      text: Local Quickstart
      url: /documentation/quickstart/
      contained: true
  - partial: documentation/banners/banner-d
    developingTitle: Introducing Qdrant Edge
    developingDescription: Qdrant Edge is a lightweight, embedded vector search engine for in-process retrieval — no background services, minimal memory footprint, and no network required. Built for robots, kiosks, mobile devices, and any environment requiring offline-capable AI search.
    developingBlock:
      title: Run vector search anywhere, even offline
      button:
        text: Get Started
        url: /documentation/edge/edge-quickstart/
      image:
        src: /img/rocket.svg
        alt: Rocket
  - partial: documentation/sections/cards-section
    title: Qdrant User Manual
    description: Learn how to manage your data, run powerful searches, and leverage inference to build AI-native applications.
    cardsPartial: documentation/cards/docs-cards
    cards:
      - id: 1
        icon:
          src: /icons/outline/vectors-blue.svg
          alt: Vectors
        title: Manage Data
        description: Create collections, manage vectors, payloads, and storage. Learn about indexing, quantization, and multitenancy.
        link:
          url: /documentation/manage-data/
          text: Read More
      - id: 2
        icon:
          src: /icons/outline/search-blue.svg
          alt: Search
        title: Search
        description: Learn about similarity search, filtering, hybrid queries, and advanced retrieval techniques.
        link:
          url: /documentation/search/
          text: Read More
      - id: 3
        icon:
          src: /icons/outline/integration-blue.svg
          alt: Inference
        title: Inference
        description: Configure dense, sparse, and multi-vector embeddings. Use cloud-hosted embedding models directly with Qdrant.
        link:
          url: /documentation/inference/
          text: Read More
  - partial: documentation/sections/cards-section
    title: Support
    description: Get help from the Qdrant community or contact our support team.
    cardsPartial: documentation/cards/docs-cards
    cardsPerRow: 2
    cards:
      - id: 1
        icon:
          src: /icons/outline/discord-purple.svg
          alt: Discord icon
        title: Community Support
        description: Join 6,000+ active members to learn, collaborate, and participate in Qdrant's latest activities.
        link:
          text: Join our Discord
          url: https://qdrant.to/discord
      - id: 2
        icon:
          src: /icons/outline/support-blue.svg
          alt: Support icon
        title: Qdrant Cloud Support
        description: Paying customers have access to our Support team. Links to the support portal are available in the Qdrant Cloud Console.
        link:
          text: Join Qdrant
          url: https://qdrant.to/cloud
partition: develop
---

# Qdrant Documentation

Qdrant is an AI-native vector search engine for storing, indexing, and searching high-dimensional vectors — powering semantic search, RAG pipelines, recommendation systems, and AI-native applications.

## Getting Started

- [Local Quickstart](/documentation/quickstart/index.md) — Run Qdrant locally with Docker, connect a client SDK, and create your first collection.
- [Cloud Quickstart](/documentation/cloud-quickstart/index.md) — Create a free Qdrant Cloud cluster on AWS, GCP, or Azure and query it in minutes.
- [Overview](/documentation/overview/index.md) — How vector search works, the client-server architecture, and core data structures (points, vectors, payloads, collections).
- [API & SDKs](/documentation/interfaces/index.md) — Connect via REST or gRPC with official client libraries for Python, JavaScript/TypeScript, Rust, Go, Java, and .NET.

## Develop

- [Manage Data](/documentation/manage-data/index.md) — Create collections, insert and update points and payloads, configure vector indexes, quantization, and multitenancy.
- [Search](/documentation/search/index.md) — Similarity search, filtering, hybrid and multimodal queries, multi-stage pipelines, and relevance tuning.
- [Inference](/documentation/inference/index.md) — Configure dense, sparse, and multi-vector embeddings; use cloud-hosted embedding models directly within Qdrant.
- [Qdrant Edge](/documentation/edge/index.md) — Lightweight embedded vector search for in-process, offline-capable retrieval on robots, kiosks, and mobile devices.

## Deploy

- [Deploy Overview](/documentation/deploy-intro/index.md) — Compare all Qdrant deployment options: Managed Cloud, Hybrid Cloud, Private Cloud, and self-hosted.
- [Installation](/documentation/installation/index.md) — Install Qdrant via Docker, Kubernetes, or binary on Linux, macOS, or Windows.
- [Managed Cloud](/documentation/cloud/index.md) — Qdrant as a managed service on AWS, GCP, or Azure with automatic scaling, backups, and zero-downtime upgrades.
- [Hybrid Cloud](/documentation/hybrid-cloud/index.md) — Deploy into your own Kubernetes cluster while managing through Qdrant Cloud.
- [Private Cloud](/documentation/private-cloud/index.md) — Fully air-gapped deployment in your own Kubernetes cluster with no Qdrant Cloud connectivity required.
- [Distributed Deployment](/documentation/distributed_deployment/index.md) — Multi-node clusters with horizontal sharding and replication for scale and fault tolerance.
- [Security](/documentation/security/index.md) — API keys, JWT-based collection-scoped access control, TLS encryption, and network binding.
- [Configuration](/documentation/ops-configuration/index.md) — Customize Qdrant via config files and environment variables; runtime administration tools; GPU-accelerated vector indexing.
- [Monitoring & Telemetry](/documentation/ops-monitoring/index.md) — Monitor Qdrant with Prometheus and Grafana via built-in OpenMetrics endpoints.
- [Optimization](/documentation/ops-optimization/index.md) — Tune for high-speed search, high precision, or low memory usage; understand how the background optimizer works.
- [Production Checklist](/documentation/production-checklist/index.md) — Pre-launch review of sharding, replication, quantization, load balancing, and observability.
- [Capacity Planning](/documentation/capacity-planning/index.md) — Estimate RAM and disk for vectors, payloads, indexes, and replication factors.
- [Snapshots](/documentation/snapshots/index.md) — Back up and restore collections with snapshots for disaster recovery and cross-cluster replication.
- [Troubleshooting](/documentation/common-errors/index.md) — Diagnose common runtime errors: open-file limits, filesystem incompatibilities, corrupted collection metadata.

## Ecosystem

- [Frameworks](/documentation/frameworks/index.md) — Integrations with 40+ AI agent and RAG frameworks: LangChain, LlamaIndex, Haystack, CrewAI, AutoGen, Spring AI, and more.
- [Embedding Providers](/documentation/embeddings/index.md) — Connect to 30+ providers: OpenAI, Cohere, Jina, Mistral, AWS Bedrock, Voyage AI, Ollama, and more.
- [Platforms](/documentation/platforms/index.md) — No-code and low-code integrations with n8n, Make, MuleSoft, Pipedream, and more.

## Tutorials & Examples

- [Tutorials](/documentation/tutorials-lp-overview/index.md) — Hub for all tutorials covering basics, search engineering, retrieval quality, operations, migrations, and ecosystem integrations.
- [Examples](/documentation/examples/index.md) — End-to-end code samples for RAG pipelines, hybrid search, multitenancy, recommendations, and multimodal search.

## Learn

- [Articles](/articles/index.md) — Long-form articles on vector search, RAG, quantization, hybrid retrieval, and Qdrant internals from the engineering team.
- [Qdrant Academy](/course/index.md) — Free, self-paced courses on vector search, hybrid retrieval, multivectors, and production-grade AI search applications.
- [Tutorials](/documentation/tutorials-lp-overview/index.md) — Hub for all tutorials covering basics, search engineering, retrieval quality, operations, migrations, and ecosystem integrations.

## API Reference

- [Qdrant API Reference](https://api.qdrant.tech/api-reference) — Full REST API reference for all Qdrant operations: collections, points, search, indexing, cluster management, and more.
