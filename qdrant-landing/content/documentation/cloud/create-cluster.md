---
title: Create a Cluster
short_description: "Launch a free or standard Qdrant Cloud cluster on AWS, GCP, or Azure, with options for high availability, GPUs, and Hybrid Cloud."
description: "Create a free or standard Qdrant Cloud cluster on AWS, GCP, or Azure, with high availability, GPU acceleration, and Hybrid Cloud deployment options."
weight: 5
---

# Creating a Qdrant Cloud Cluster

Qdrant Cloud offers two types of clusters: **Free** and **Standard**. [Premium](/documentation/cloud-premium/) customers create Standard clusters with additional options.

## Free Clusters

Free tier clusters are for prototyping and testing. You don't need a credit card to join.

| Resource   | Value |
|------------|-------|
| RAM        | 1 GB  |
| vCPU       | 0.5   |
| Disk space | 4 GB  |
| Nodes      | 1     |

This configuration supports serving about 1 M vectors of 768 dimensions. The choice of cloud providers and regions is limited.

A free cluster includes:

- Standard support
- Basic monitoring, log access, and alerting
- Version upgrades with downtime
- Manual snapshots and restores through the API only
- No dedicated resources

If unused, free tier clusters are automatically suspended after 1 week, and deleted after 4 weeks of inactivity if not reactivated. You can upgrade to a standard cluster at any time.

## Standard Clusters

On top of the Free cluster features, Standard clusters offer:

- Response time and uptime SLAs
- Dedicated resources
- Backup and disaster recovery
- Multi-node clusters for high availability
- Horizontal and vertical scaling
- Monitoring and log management
- Audit logging
- Zero-downtime upgrades for multi-node clusters with replication
- Support for GPUs to optimize indexing (AWS only)

You have a broad choice of regions on AWS, Azure, and Google Cloud. For payment information, see [Billing & Payments](/documentation/cloud-pricing-payments/).

## Create a Cluster

![Create Cluster Page](/documentation/cloud/create-cluster.png)

> **Prerequisite:** Provide billing information before creating a standard cluster.

1. Start in the **Clusters** section of the [Cloud Dashboard](https://cloud.qdrant.io/).
2. Select **Clusters** and then click **+ Create**.
3. In the **Create a cluster** screen, select **Free** or **Standard**. Most of the remaining options are only available for standard clusters.
4. Select a provider and region, or a [Hybrid Cloud](/documentation/hybrid-cloud/) environment.
5. Choose the resources, using the table in [Cluster Options](#cluster-options).
6. Review your cluster configuration and pricing, then select **Create**. It takes some time to provision your cluster.

Once provisioned, you can access your cluster on ports 443 and 6333 (REST) and 6334 (gRPC). See [Connect to a Cluster](/documentation/cloud/cluster-access/).

![Cluster configured in the UI](/documentation/cloud/cluster-detail.png)

### Cluster Options

| Option | Choices and rules |
|---|---|
| Provider and region | AWS, GCP, Azure, or your own Hybrid Cloud environment. If you pay through a cloud marketplace, paid clusters are limited to that provider's regions. |
| RAM per node | Set from your [sizing estimate](#choose-the-resources). Each node gets a disk with enough space for Qdrant's default collection configuration. |
| vCPU per node | The available vCPU options depend on the RAM you choose. |
| GPU per node | AWS only, for higher RAM configurations. Speeds up indexing for write-heavy workloads. All GPU settings are configured automatically. See [GPUs for Indexing](/documentation/ops-configuration/running-with-gpu/). |
| Number of nodes | Every node has the same size. Use at least 3 for production. |
| High Availability | Sets up 3 or more nodes with replication, as described in [Creating a Production-Ready Cluster](#creating-a-production-ready-cluster). |
| Multi AZ (Premium) | Spreads nodes across availability zones. Chosen at creation only. Needs at least 3 nodes, and the node count must be a multiple of 3. Available in regions with at least 3 availability zones, at a higher rate to cover cross-zone traffic. |
| Additional disk | Add disk when your collection configuration needs more disk per GB of RAM, for example with the `cold` memory tier. You can add disk later, but you can't remove it. |
| Disk speed tier (AWS) | **Balanced** for disks of 32 GiB or more, **Performance** for disks of 256 GiB or more. Faster tiers help write-heavy workloads and configurations with a low RAM cache ratio. |

### Choose the Resources

Estimate the memory and disk for each collection and sum them. For dense vectors:

```text
dense_size = points * replication_factor * dimensions * bytes_per_dim
```

`bytes_per_dim` is 4 for `float32`, 2 for `float16`, 1 for `uint8`, and 0.5 for `turbo4`. For example, one million 768-dimension `float32` points with a replication factor of 2 need about 5.7 GB. On top of the vectors, budget for these:

- The HNSW index, which typically adds 20% to 30%.
- Payloads, payload indexes, and the ID tracker.
- About 20% headroom for the write-ahead log, snapshots, and temporary segments created by the optimizer.

Then size the nodes:

| Decision | Rule |
|---|---|
| RAM per node | Keep usage under 80% of the node's RAM. Above that, the operating system evicts cached pages and latency drops sharply. |
| Number of nodes | `ceil(total_ram_estimate / (node_ram * 0.8))`, and at least 3 for production. A single node typically tops out around 100 million vectors, fewer for high-dimensional `float32` data. |
| Shards per collection | At least 2 per node, so you can add nodes without resharding. 12 is a common choice because it divides evenly across 1, 2, 3, 4, 6, and 12 nodes. By default, a collection gets as many shards as the cluster has nodes. |
| Memory-saving options | [Quantization](/documentation/manage-data/quantization/) reduces vector memory by a factor of 4 to 32. The `cold` [memory tier](/documentation/ops-configuration/memory-tiers/) reads vectors from memory-mapped files on demand instead of pre-loading them into RAM, so plan more disk per GB of RAM. |

Migrations need more room than normal operation. When you restore a snapshot or use the Migration Tool, the target cluster needs twice the disk space that the source collection uses, and twice the RAM when you use the Migration Tool.

These numbers are estimates. For the full formulas for sparse vectors, payloads, and indexes, see [Capacity Planning](/documentation/capacity-planning/). For ingestion-heavy workloads, it also covers [CPU](/documentation/capacity-planning/#cpu) and [disk speed](/documentation/capacity-planning/#storage-focused-configuration). For an interactive estimate, use the [Sizing Calculator](https://sizing.qdrant.tech/estimate), and for cost, use the [Pricing Calculator](https://cloud.qdrant.io/calculator).

## Creating a Production-Ready Cluster

A production-ready cluster has at least 3 nodes, collections with a replication factor of at least 2, enough shards to grow, a backup schedule, and alerts that reach you. To get the **High Availability** setup, check the **High Availability** checkbox when you create the cluster. A cluster without these settings runs with a single replica of each shard, which gets none of the availability guarantees. See [Setting Up a Resilient Qdrant Cluster](/documentation/scaling/resilience/#setting-up-a-resilient-qdrant-cluster).

The [Cloud Production Checklist](/documentation/cloud/production-checklist/) lists every setting with its value, where to set it, and why. For the reasoning behind the checklist, see [Vector Search in Production](/documentation/production-operations/vector-search-in-production/).

## Deleting a Cluster

You can delete a Qdrant database cluster from the cluster's detail page.

![Delete Cluster](/documentation/cloud/delete-cluster.png)

## Next Steps

- [Create a Database API key](/documentation/cloud/authentication/) to connect.
- [Scale](/documentation/cloud/cluster-scaling/) the cluster horizontally or vertically.
- [Update](/documentation/cloud/cluster-upgrades/) the cluster when a new Qdrant version is available.
- [Back up](/documentation/cloud/backups/) the cluster on a schedule.
