---
title: Home
weight: 2
hideTOC: true
breadcrumb: false
content:
  - partial: "documentation/banners/banner-a"
    title: Qdrant Documentation
    description: Qdrant is an AI-native vector database and a semantic search engine. You can use it to extract meaningful information from unstructured data.
    linkDescription: <a href="https://github.com/qdrant/qdrant_demo/" target="_blank">Clone this repo now</a> and build a search engine in five minutes.
    cloudButton:
      text: Cloud Quickstart
      url: /documentation/quickstart-cloud/
    localButton:
      text: Local Quickstart
      url: /documentation/quickstart/
      contained: true
  - partial: documentation/banners/banner-d
    developingTitle: Ready to start developing?
    developingDescription: Qdrant is open-source and can be self-hosted. However, the quickest way to get started is with our <a href="https://qdrant.to/cloud" target="_blank">free tier</a> on Qdrant Cloud. It scales easily and provides a UI where you can interact with data.
    developingBlock:
      title: Create your first Qdrant Cloud cluster today
      button:
        text: Get Started
        url: https://qdrant.to/cloud
      image:
        src: /img/rocket.svg
        alt: Rocket
  - partial: documentation/sections/cards-section
    title: Optimize Qdrant's performance
    description: Boost search speed, reduce latency, and improve the accuracy and memory usage of your Qdrant deployment.
    button:
      text: Learn More
      url: /documentation/guides/optimize/
    cardsPartial: documentation/cards/docs-cards
    cards:
      - id: 1
        tag: Documents
        icon:
          src: /icons/outline/documentation-blue.svg
          alt: Documents
        title: Distributed Deployment
        description: Scale Qdrant beyond a single node and optimize for high availability, fault tolerance, and billion-scale performance.
        link:
          url: /documentation/guides/distributed_deployment/
          text: Read More
      - id: 2
        tag: Documents
        icon:
          src: /icons/outline/documentation-blue.svg
          alt: Documents
        title: Multitenancy
        description: Build vector search apps that serve millions of users. Learn about data isolation, security, and performance tuning.
        link:
          url: /documentation/guides/multiple-partitions/
          text: Read More
      - id: 3
        tag: Blog
        tagColor: violet
        icon:
          src: /icons/outline/blog-purple.svg
          alt: Blog
        title: Vector Quantization
        description: Learn about cutting-edge techniques for vector quantization and how they can be used to improve search performance.
        link:
          url: /articles/what-is-vector-quantization/
          text: Read More
partition: qdrant
---

THIS CONTENT IS GOING TO BE IGNORED FOR NOW

# Documentation

Qdrant is an AI-native vector database and a semantic search engine. You can use it to extract meaningful information from unstructured data. Want to see how it works? [Clone this repo now](https://github.com/qdrant/qdrant_demo/) and build a search engine in five minutes.

|||
|-:|:-|
|[Cloud Quickstart](/documentation/quickstart-cloud/)|[Local Quickstart](/documentation/quick-start/)|


## Ready to start developing? 

***<p style="text-align: center;">Qdrant is open-source and can be self-hosted. However, the quickest way to get started is with our [free tier](https://qdrant.to/cloud) on Qdrant Cloud. It scales easily and provides an UI where you can interact with data.</p>***

[![Hybrid Cloud](/docs/homepage/cloud-cta.png)](https://qdrant.to/cloud)

## Qdrant's most popular features: 
||||
|:-|:-|:-|
|[Filtrable HNSW](/documentation/filtering/) </br> Single-stage payload filtering | [Recommendations & Context Search](/documentation/concepts/explore/#explore-the-data) </br> Exploratory advanced search| [Pure-Vector Hybrid Search](/documentation/hybrid-queries/)</br>Full text and semantic search in one|
|[Multitenancy](/documentation/guides/multiple-partitions/) </br> Payload-based partitioning|[Custom Sharding](/documentation/guides/distributed_deployment/#sharding) </br> For data isolation and distribution|[Role Based Access Control](/documentation/guides/security/?q=jwt#granular-access-control-with-jwt)</br>Secure JWT-based access |
|[Quantization](/documentation/guides/quantization/) </br> Compress data for drastic speedups|[Multivector Support](/documentation/concepts/vectors/?q=multivect#multivectors) </br> For ColBERT late interaction |[Built-in IDF](/documentation/concepts/indexing/?q=inverse+docu#idf-modifier) </br> Advanced similarity calculation|

## Developer guidebooks:

| [A Complete Guide to Filtering in Vector Search](/articles/vector-search-filtering/) </br> Beginner & advanced examples showing how to improve precision in vector search.| [Building Hybrid Search with Query API](/articles/hybrid-search/) </br> Build a pure vector-based hybrid search system with our new fusion feature.|
|----------------------------------------------|-------------------------------|
| [Multitenancy and Sharding: Best Practices](/articles/multitenancy/) </br> Combine two powerful features for complete data isolation and scaling.| [Benefits of Binary Quantization in Vector Search](/articles/binary-quantization/) </br> Compress data points while retaining essential meaning for extreme search performance.|
