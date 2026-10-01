---
label: Index Configuration
title: Get configurations reviewed with additional context from Qdrant Cloud
cards:
  - id: 0
    title: 'Choose which fields to index: each one costs compute and memory.'
    description: Creating a payload index requires additional computational resources and memory, so selecting which fields to index is essential rather than indexing everything by default.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Plan for extra disk I/O when indexes land in cached or cold tier.
    description: A payload index stored in the cached or cold tier may require additional disk I/O operations, which can affect request latency for filtered queries.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Partition data by tenant when your collection embeds multiple subsets.
    description: In a multi-tenant scenario, the collection is expected to contain multiple subsets of data where each subset belongs to a different tenant.
    icon:
      src: /icons/outline/enterprise-blue.svg
      alt: ""
callout:
  text: Lyzr Ingestion times for large datasets were 2x faster, and the system required significantly fewer compute and memory resources to complete them.
  url: https://qdrant.tech/blog/case-study-lyzr/
button:
  text: Read the filterable HNSW docs
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
