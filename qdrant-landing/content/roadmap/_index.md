---
title: Roadmap
type: marketing/roadmap
cascade:
  type: marketing/roadmap
short_description: "What the Qdrant and Qdrant Cloud teams are building now and plan to build next."
description: "The Qdrant roadmap: what the Qdrant teams are building now and what they plan to build next."
keywords: qdrant roadmap, vector search roadmap, qdrant cloud roadmap, upcoming qdrant features
build:
  render: always
hero:
  label: Roadmap
  title: What We're Building
  description: "Follow what the Qdrant teams are working on right now and what comes next. Plans change as we learn from you, so treat this as direction, not a delivery schedule."
# Each item needs a product (qdrant or cloud) and a status (in-progress or
# planned). area is a short category, link is optional.
items:
  - title: Faster Index Builds
    product: qdrant
    status: in-progress
    area: Performance
    description: "New ways to construct the vector index, including PiPNN and building the graph from half-precision vectors, cut index build time without lowering search quality."
  - title: Regex Filters
    product: qdrant
    status: in-progress
    area: Search
    description: "Filter by regular expressions and substrings, and combine pattern matching with vector similarity in a single query."
  - title: Fuzzy Full-Text Search
    product: qdrant
    status: in-progress
    area: Search
    description: "Match text that is close to the query term, so typos and spelling variants still find the right points."
    link: https://github.com/qdrant/qdrant/issues/8725
  - title: Universal IO
    product: qdrant
    status: in-progress
    area: Storage
    description: "One I/O layer for every storage component, which lays the groundwork for reading vectors, payloads, and indexes from different storage backends."
  - title: Faster Resharding
    product: qdrant
    status: in-progress
    area: Scalability
    description: "Change the number of shards in a running collection in less time."
  - title: Enforced Tenant Filters
    product: qdrant
    status: in-progress
    area: Multitenancy
    description: "A strict mode option that rejects searches without a tenant filter in multitenant collections, so no request can accidentally read across tenants."
  - title: Qdrant Serverless
    product: cloud
    status: in-progress
    area: Deployment
    description: "Vector search on Qdrant Cloud without clusters or capacity planning: create a collection, load vectors, and search, with usage-based pricing and the same Qdrant API."
    link: /serverless/
  - title: Shared Indexing for Dedicated Clusters
    product: cloud
    status: in-progress
    area: Scalability
    description: "Dedicated clusters can offload indexing to a shared indexing service to reduce CPU usage during writes. This increases write scalability and search performance during write spikes."
  - title: Switch to new AWS instance types
    product: cloud
    status: in-progress
    area: Performance
    description: "Qdrant Cloud uses new AWS instances types for dedicated clusters with a newer CPU generation providing up to 16% more requests per seconds and improving p95 latency by up to 33%."
  - title: Improved Cluster Metrics UI
    product: cloud
    status: in-progress
    area: Operations
    description: "Additional metrics are added for dedicated clusters. The UI is improved to make it easier to understand and explore the metrics"
  - title: Prefetch Scores in Query Results
    product: qdrant
    status: planned
    area: Search
    description: "Return the score from each prefetch stage alongside the final score, so you can feed dense, sparse, and fused scores into your own reranking."
  - title: Default Inference Settings per Collection
    product: qdrant
    status: planned
    area: Search
    description: "Set the embedding model and its parameters once in the collection configuration instead of repeating them in every request."
  - title: Built-In MCP Server
    product: qdrant
    status: planned
    area: Operations
    description: "An MCP endpoint in Qdrant itself, so AI agents can configure and inspect an instance with the same authentication as the regular API."
  - title: Disk-Optimized HNSW
    product: qdrant
    status: planned
    area: Storage
    description: "A variant of the HNSW index designed for on-disk storage, for faster search when the index does not fit in memory."
    link: https://github.com/qdrant/qdrant/issues/10044
  - title: Streaming Snapshots to Remote Storage
    product: qdrant
    status: planned
    area: Operations
    description: "Write collection snapshots straight to S3 or another snapshot storage without a temporary local copy, so snapshots no longer need spare disk space."
  - title: Cross Region Replication
    product: cloud
    status: planned
    area: Scalability
    description: "Allows adding additional read replicas to a dedicated cluster that are placed in a different cloud region. This can be used to improve availability in case of a region outages or to improve latency for customers in a different region."
  - title: New instance types on GCP
    product: cloud
    status: planned
    area: Performance
    description: "Qdrant Cloud uses new GCP instances types for dedicated clusters with a newer CPU generation providing up to 8.5% more requests per seconds and improving p95 latency by up to 9%."
  - title: Disk Auto Scaling
    product: cloud
    status: planned
    area: Storage
    description: "The disk of dedicated clusters can be automatically scaled up based on usage."
  - title: Disk Performance Tiers on Azure
    product: cloud
    status: planned
    area: Storage
    description: "Dedicated Clusters on Azure can be configured with faster disks with more IOPS and throughput."
  - title: Disk Performance Tiers on GCP
    product: cloud
    status: planned
    area: Storage
    description: "Dedicated Clusters on GCP can be configured with faster disks with more IOPS and throughput."
  - title: Cross Region Backups
    product: cloud
    status: planned
    area: Operations
    description: "Allow to automatically copy cloud backups to an additional region for disaster recovery."
  - title: Configurable Alert Destinations
    product: cloud
    status: planned
    area: Operations
    description: "The alerting destinations in Qdrant Cloud can be configured to send alerts to email addresses or webhooks."
  - title: SCIM for Enterprise SSO
    product: cloud
    status: planned
    area: Security
    description: "Cross-domain identity management (SCIM) for SSO setups. This allows to manage Qdrant Cloud account memberships and permissions through group memberships in the identity provider."
---
