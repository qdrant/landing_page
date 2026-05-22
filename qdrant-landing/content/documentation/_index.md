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

THIS CONTENT IS GOING TO BE IGNORED FOR NOW

# Documentation

Qdrant is an AI-native vector search and a semantic search engine. You can use it to extract meaningful information from unstructured data. Want to see how it works? [Clone this repo now](https://github.com/qdrant/qdrant_demo/) and build a search engine in five minutes.

|||
|-:|:-|
|[Cloud Quickstart](/documentation/cloud-quickstart/)|[Local Quickstart](/documentation/quickstart/)|


## Ready to start developing? 

***<p style="text-align: center;">Qdrant is open-source and can be self-hosted. However, the quickest way to get started is with our [free tier](https://qdrant.to/cloud) on Qdrant Cloud. It scales easily and provides an UI where you can interact with data.</p>***

[![Hybrid Cloud](/docs/homepage/cloud-cta.png)](https://qdrant.to/cloud)

## Qdrant's most popular features: 
||||
|:-|:-|:-|
|[Filterable HNSW](/documentation/search/filtering/) </br> Single-stage payload filtering | [Recommendations & Context Search](/documentation/search/explore/#explore-the-data) </br> Exploratory advanced search| [Pure-Vector Hybrid Search](/documentation/search/hybrid-queries/)</br>Full text and semantic search in one|
|[Multitenancy](/documentation/manage-data/multitenancy/) </br> Payload-based partitioning|[Custom Sharding](/documentation/distributed_deployment/#sharding) </br> For data isolation and distribution|[Role Based Access Control](/documentation/security/?q=jwt#granular-access-api-keys)</br>Secure JWT-based access |
|[Quantization](/documentation/manage-data/quantization/) </br> Compress data for drastic speedups|[Multivector Support](/documentation/manage-data/vectors/?q=multivect#multivectors) </br> For ColBERT late interaction |[Built-in IDF](/documentation/manage-data/indexing/?q=inverse+docu#idf-modifier) </br> Advanced similarity calculation|

## Developer guidebooks:

| [A Complete Guide to Filtering in Vector Search](/articles/vector-search-filtering/) </br> Beginner & advanced examples showing how to improve precision in vector search.| [Building Hybrid Search with Query API](/articles/hybrid-search/) </br> Build a pure vector-based hybrid search system with our new fusion feature.|
|----------------------------------------------|-------------------------------|
| [Multitenancy and Sharding: Best Practices](/articles/multitenancy/) </br> Combine two powerful features for complete data isolation and scaling.| [Benefits of Binary Quantization in Vector Search](/articles/binary-quantization/) </br> Compress data points while retaining essential meaning for extreme search performance.|
