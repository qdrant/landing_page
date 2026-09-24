---
title: Guides
short_description: Find practical guidance on search evaluation, embedding model selection, multitenancy, bulk uploads, and memory placement.
description: Explore practical Qdrant guides for evaluating search quality, choosing embedding models, and planning multitenancy, bulk uploads, and memory use.
partition: learn
learning_kind: guides
layout: guides
breadcrumb: false
hideTOC: true
slug: guides
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
  - partial: documentation/recent-publications
    kind: guides
  - partial: documentation/guides/topics
  - partial: documentation/guides/featured
    title: Start with a Practical Guide
    description: Work through a decision you can apply to your own search system.
    cards:
      - page: /documentation/search-patterns/choose-embedding-model/
        description: Compare relevance, language support, and serving cost before you rebuild document vectors.
        icon:
          src: /icons/outline/vectors-blue.svg
          alt: ""
        link:
          text: Compare Models
      - page: /documentation/production-patterns/multitenant-search/
        description: Choose shared collections, tenant filters, and shard placement as customer workloads grow.
        icon:
          src: /icons/outline/cloud-cog-teal.svg
          alt: ""
        link:
          text: Plan Tenant Growth
      - page: /documentation/production-patterns/bulk-data-import/
        description: Plan batching, parallel uploads, sharding, and indexing for large datasets.
        icon:
          src: /icons/outline/refresh-cw-purple.svg
          alt: ""
        link:
          text: Plan Your Import
---
