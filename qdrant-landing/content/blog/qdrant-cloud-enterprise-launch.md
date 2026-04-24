---
draft: false
title: "Now Available on Qdrant Cloud: GPU Indexing, Multi-AZ, and Audit Logging"
short_description: "GPU-accelerated indexing, multi-AZ replication, and audit logging are now live on Qdrant Cloud."
description: "Qdrant Cloud now supports GPU-accelerated HNSW indexing (up to 4x faster builds), multi-AZ replication with a 99.95% uptime SLA, and structured audit logging for compliance and accountability."
preview_image: /blog/qdrant-cloud-enterprise-launch/enterprise-launch-social-preview.jpg
social_preview_image: /blog/qdrant-cloud-enterprise-launch/enterprise-launch-social-preview.jpg
date: 2026-04-24T00:00:00Z
author: Daniel Azoulai
featured: true
tags:
- qdrant cloud
- gpu indexing
- high availability
- audit logging
- enterprise
---

We increasingly see AI workloads write continuously while needing to perform, demand higher availability retrieval, and require accountability for every decision made on retrieved context. And today, we’re ensuring that Qdrant Cloud handles all three of these needs.

## GPU-Accelerated Indexing

GPUs aren't just for model inference; they're for indexing too. Qdrant already supports GPU-accelerated HNSW construction in open source. Now it's available in Qdrant Cloud.

GPU-accelerated indexing delivers up to 4x faster HNSW index builds on dedicated GPUs, based on Qdrant benchmarks. For high-write workloads (agentic AI memory, dynamic content catalogs, real-time recommendation systems) the difference is significant.

### How It Works

GPU indexing is a cluster-level capability. When you create or scale a cluster to a GPU-enabled package, every node in your cluster gets a dedicated GPU. Customers can add GPUs to existing clusters for high-volume indexing and remove them afterward.

Indexing only. GPU acceleration applies to HNSW index construction. Search queries continue to run on CPU using the same optimized Qdrant engine.

Available today on AWS.

## Multi-Availability-Zone Replication

For teams where vector search is on the critical path of user-facing products, high availability is required. Qdrant Cloud now supports multi-AZ deployments through the Premium Multi-AZ tier.

This is cross-AZ replication, not failover. Your data is replicated across three availability zones within a region. If one AZ goes down, reads and writes continue from the surviving zones. There's no failover delay and no customer action required.

### SLA

| Tier | Uptime SLA |
| ----- | ----- |
| Standard | 99.5% |
| Premium | 99.9% |
| **Premium Multi-AZ** | **99.95%** |

## Audit Logging

Tracing what was retrieved, when, and by which service is a compliance requirement for many organizations.

Qdrant Cloud now provides structured audit logging for all operations performed through the Qdrant API: queries, upserts, deletes, collection management (create, update, delete), and snapshot operations. Each log entry is structured JSON with user and API key attribution, timestamp, target collection, and result of the action (allowed or denied).

When an autonomous system acts on retrieved context, audit logging provides the trail showing which service queried which collection, when, and whether the request was authorized.

Retention is configurable; for long-term needs, logs can be downloaded via the API and stored externally. Audit logging is configurable via the Cloud UI. Logs are retrieved via the Qdrant API. Available on all paid Qdrant Cloud clusters.

## Getting Started

All three capabilities are available now.

* GPU Indexing: Create a new cluster with a GPU-enabled package, or add GPU to an existing cluster. Available on AWS.  
* Multi-AZ: Select a Premium Multi-AZ package when creating or scaling a cluster.  
* Audit Logging: Available on all paid clusters. Configure via the Cloud UI. Retrieve logs via the API.

Not yet on Qdrant Cloud? [Sign up](https://cloud.qdrant.io/) and start building. For enterprise deployments or custom SLA requirements, reach out [to our team](https://qdrant.tech/contact-us/).

