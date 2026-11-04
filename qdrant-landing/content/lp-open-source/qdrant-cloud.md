---
label: Qdrant Cloud
title: Let Qdrant Cloud Handle the Upkeep of Self-Hosted Qdrant
description: The open source engine is free, and self-hosting it means owning upgrades, shard balancing, backups, and on-call. Qdrant Cloud runs the same engine as a managed service on AWS, GCP, or Azure and handles that work for you.
cards:
  - id: 0
    title: Upgrade while you keep serving queries.
    description: Qdrant Cloud runs zero-downtime rolling upgrades on multi-node clusters with replication.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Add nodes and keep shards balanced.
    description: Qdrant Cloud rebalances shards across nodes automatically and can reshard a collection in place. On self-hosted Qdrant, you balance shards yourself, and changing the shard count means recreating the collection.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Scale when you need it.
    description: 'Move to a paid tier for horizontal and vertical scaling, backup and disaster recovery, monitoring and log management, and a 99.5% uptime SLA.'
    icon:
      src: /icons/outline/chart-bar-blue.svg
      alt: ""
callout:
  text: '"Filterable HNSW was the deal-maker, but Qdrant Cloud''s managed Rust backbone sealed it. We kept source-level transparency while off-loading 24×7 ops." Garden'
  url: https://qdrant.tech/blog/case-study-garden-intel/
  label: Read the Garden case study
sitemapExclude: true
---
