---
draft: false
title: "Now Available on Qdrant Cloud: GPU Indexing, Multi-AZ, and Audit Logging"
short_description: "Three enterprise capabilities now available in Qdrant Cloud"
description: "Learn how GPU-accelerated indexing, Multi-AZ replication, and audit logging support enterprise AI workloads in Qdrant Cloud."
date: 2026-04-28T00:00:00Z
author: Daniel Azoulai
featured: true
tags:
- gpu indexing
- multi-az
- audit logging
- enterprise
- qdrant cloud
---

![Qdrant Cloud Features](/blog/qdrant-cloud-enterprise-launch/multi-az.png)

# Now Available on Qdrant Cloud: GPU Indexing, Multi-AZ, and Audit Logging

We’re excited to announce some Qdrand Cloud upgrades to address AI workloads that write continuously, must meet higher uptime SLAs, and require audit logging. 

## Speed Indexing with GPUs

GPUs aren't just for model inference; they're for indexing too. Qdrant Cloud GPU-accelerated indexing delivers up to 4x faster HNSW index builds on dedicated GPUs, based on Qdrant benchmarks. That’s helpful for high-write workloads (e.g. dynamic content catalogs, real-time recommendation systems, agentic). 

GPU Indexing is available today in Qdrant Cloud on AWS clusters.

### How It Works

GPU indexing is a cluster-level capability. When you create or scale a cluster to a GPU-enabled package, every node in your cluster gets a dedicated GPU. Customers can add GPUs to existing clusters for high-volume indexing. This requires at least 16 GiB RAM per node and uses the NVIDIA T4 (shown below).

![gpu-accelerated-indexing][/blog/qdrant-cloud-enterprise-launch/gpu-accelerated-indexing.png]

## Multi-Availability-Zone (Multi-AZ) Replication

For teams needing vector search with stronger guarantees on availability, and higher uptime commitments, Qdrant Cloud now supports [Multi-AZ deployments](https://qdrant.tech/documentation/cloud/create-cluster/?q=multi+az#creating-a-production-ready-cluster). This is available in all regions through the Premium Qdrant Cloud tier ([contact us](https://qdrant.tech/contact-us/) for more details). 

Multi-AZ ensure that if one availability zone goes down, the cluster remains operational. Activate this feature by checking the Multi-AZ Deployment checkbox when creating a cluster (shown below). Note: This can not be changed later.

![multi-az][/blog/qdrant-cloud-enterprise-launch/multi-az.png]

### SLA Comparison

| Tier | Uptime SLA |
| ----- | ----- |
| Standard | 99.5% |
| Premium | 99.9% |
| **Premium Multi-AZ** | **99.95%** |

## Audit Logging

Audit logging is often a requirement for customers with compliance and security needs. Qdrant Cloud now enables [audit logging](https://qdrant.tech/documentation/cloud/configure-cluster/?q=audit+logging#audit-logging), which captures operations performed through the Qdrant API: queries, upserts, deletes, collection management, and snapshot operations. Each entry is structured JSON with user and API key attribution, timestamp, target collection, and result of the action (allowed or denied). 

This is helpful for agentic workloads; when an autonomous system acts on retrieved context, audit logging provides the trail showing which service queried which collection, when, and whether the request was authorized. 

### Additional Details 

Audit Logging is available on all Paid clusters. Additionally, users must use an endpoint to retrieve and build their own integrations. And since logs are written to disk, customers may need to consider larger disks.

You can activate audit logs for your cluster in the cluster configuration tab of the cluster details page (see below). 

![audit-logging][/blog/qdrant-cloud-enterprise-launch/audit-logging.png]

## All three capabilities are available now.

* **GPU Indexing:** Create a new cluster with a GPU-enabled package, or add GPU to an existing cluster. Available on AWS.  
* **Multi-AZ (Premium Tier Only):** Select a Premium Multi-AZ package when creating or scaling a cluster.  
* **Audit Logging:** Available on all paid clusters. Configure in the cluster configuration tab. Retrieve logs via the API.

With these new capabilities Qdrant is proving that Qdrant Cloud can meet the needs of enterprise customers (see our [customer stories](https://qdrant.tech/customers/)). 

Not yet on Qdrant Cloud? [Sign up](https://cloud.qdrant.io/) and start building. For enterprise deployments or custom SLA requirements, reach out [to our team](https://qdrant.tech/contact-us/).