---
title: Guides
short_description: Find practical guidance on search evaluation, embedding model selection, multitenancy, bulk uploads, and memory placement.
description: Explore practical Qdrant guides for evaluating search quality, choosing embedding models, and planning multitenancy, bulk uploads, and memory use.
partition: learn
learning_kind: guides
breadcrumb: false
hideTOC: true
expandSidebar: true
slug: guides
hideInSidebar: true
build:
  render: always
content:
- partial: documentation/banners/banner-a
  title: Build Better Search
  description: Practical guidance for evaluating and tuning search, choosing models, and planning how your application grows.
  linkDescription: Start with the guide that matches your next decision.
  cloudButton:
    text: Explore Search Evaluation
    url: /documentation/search-quality/
  localButton:
    text: Explore Production & Performance
    url: /documentation/production-patterns/
- partial: documentation/guides/topics
- partial: documentation/sections/cards-section
  title: Start with a Practical Guide
  description: Work through a decision you can apply to your own search system.
  cardsPartial: documentation/cards/docs-cards
  cards:
  - title: 'How to Choose an Embedding Model: Evaluation & Tradeoffs'
    description: Compare relevance, language support, and serving cost before you rebuild document vectors.
    icon:
      src: /icons/outline/vectors-blue.svg
      alt: ''
    link:
      text: Compare Models
      url: /documentation/search-quality/choose-embedding-model/
  - title: How to Implement Multitenancy and Custom Sharding in Qdrant
    description: Choose shared collections, tenant filters, and shard placement as customer workloads grow.
    icon:
      src: /icons/outline/cloud-cog-teal.svg
      alt: ''
    link:
      text: Plan Tenant Growth
      url: /documentation/production-patterns/multitenant-search/
  - title: Bulk Uploading Data to Qdrant
    description: Plan batching, parallel uploads, sharding, and indexing for large datasets.
    icon:
      src: /icons/outline/refresh-cw-purple.svg
      alt: ''
    link:
      text: Plan Your Import
      url: /documentation/production-patterns/bulk-data-import/
---
