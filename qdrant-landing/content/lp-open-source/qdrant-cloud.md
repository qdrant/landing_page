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
  text: 'My AskAI standardized on Qdrant Cloud for its AI support agents after running hybrid search on separate AWS infrastructure. Scaling is two clicks in the dashboard, and the agents deflect about 75% of support requests.'
  url: https://qdrant.tech/blog/case-study-my-askai/
  label: Read the My AskAI case study
sitemapExclude: true
---
