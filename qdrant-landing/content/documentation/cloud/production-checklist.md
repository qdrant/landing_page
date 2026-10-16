---
title: Cloud Production Checklist
short_description: "Settings to verify before running production traffic on Qdrant Managed Cloud: availability, data layout, capacity, recovery, access, monitoring, and upgrades."
description: "A checklist of the Qdrant Managed Cloud settings that make a cluster production-ready, with the value for each, where to set it, and what happens if you skip it."
weight: 7
---

# Production Checklist for Qdrant Managed Cloud

This checklist lists the Managed Cloud settings that decide whether a cluster survives failures, upgrades, and growth. Each row gives the value to use and where to set it. For query and ingestion tuning that applies to every deployment, see the general [Production Checklist](/documentation/production-checklist/).

## Availability

| Check | Value | Set in |
|---|---|---|
| Node count | At least 3 | **Number of nodes** at [cluster creation](/documentation/cloud/create-cluster/#cluster-options), or [scale horizontally](/documentation/cloud/cluster-scaling/#horizontal-scaling) |
| Replication factor | At least 2 on every collection | Per collection at creation, or the default under **Collection Defaults** in the [cluster configuration](/documentation/cloud/configure-cluster/#collection-defaults) |
| Zone outage protection (Premium) | **Multi AZ** enabled, with a replication factor of 2, or better 3 | Cluster creation only. It cannot be changed later |

With 3 or more nodes and a replication factor of at least 2, every operation keeps working while one node is down, and the cluster can recover from the permanent loss of a node. Qdrant Cloud detects and replaces a failed node automatically, as long as enough replicas remain. A cluster that runs one replica per shard, which is the default, has no failover, and restarts cause downtime. Replication alone does not spread replicas across availability zones, so a zone outage can take down every replica of a shard unless Multi AZ is on. See [Resilience](/documentation/scaling/resilience/).

## Data Layout

| Check | Value | Set in |
|---|---|---|
| Shards per collection | At least 2 per node. 12 is a common choice because it divides evenly across 1, 2, 3, 4, 6, and 12 nodes | Collection creation. A collection gets as many shards as the cluster has nodes by default |
| Collections per cluster | Far fewer than 500. The platform caps a cluster at 1000, and alerts above 500 | Partition tenants by payload inside one collection. See [Multitenancy](/documentation/manage-data/multitenancy/) |
| Payload indexes | One on every field you filter by. At most 100 per collection | Collection configuration. New collections use strict mode, which rejects retrieving or updating points by filtering on an unindexed payload key |

A shard cannot be split across nodes, so a shard count that is not a multiple of the node count leaves capacity unused. If a collection has too few shards, use [resharding](/documentation/cloud/cluster-scaling/#resharding) to change the count without recreating it.

## Capacity

| Check | Value | Set in |
|---|---|---|
| RAM usage | Under 80% of node RAM. An email alert fires above 80% for 5 minutes | Resize the nodes, or reduce memory with [quantization](/documentation/manage-data/quantization/) |
| Disk usage | Under 80% of node disk. An email alert fires above 80% for 5 minutes | Add disk. Disk can be increased but not reduced |
| Headroom | An extra 20% on top of your RAM and disk estimate, for the write-ahead log, snapshots, and optimizer segments | Sizing. See [Choose the Resources](/documentation/cloud/create-cluster/#choose-the-resources) |
| Migration target | Twice the disk that the source collection uses. With the Migration Tool, also twice the RAM | Sizing the target cluster before a snapshot restore or a migration |
| Disk speed (AWS) | **Balanced** for 32 GiB or more, **Performance** for 256 GiB or more | Cluster creation |
| Indexing speed (AWS) | A GPU on each node for write-heavy workloads | Cluster creation. See [GPUs for Indexing](/documentation/ops-configuration/running-with-gpu/) |

When the vectors no longer fit in RAM, move them to the `cold` [memory tier](/documentation/ops-configuration/memory-tiers/) and add disk to match. Only the vectors that queries read often stay in RAM, and the rest are read from disk. The more reads go to disk, the slower search gets. It gets much slower when RAM is almost full, because the operating system then evicts pages that queries need again right away. The same data is read from disk, loaded into RAM, and evicted over and over.

## Recovery

| Check | Value | Set in |
|---|---|---|
| Backup schedule | At least one, with a retention that fits your recovery point | **Backups** tab on the Cluster Detail page. See [Backups](/documentation/cloud/backups/) |
| Restore test | Restore a backup into a new cluster and check the data | **Backups** tab, **Restore** into a new cluster |
| Source of truth | Keep the original data in a system you can reindex from, for example a relational database or object storage that holds your documents. Reindexing is slower than a restore, so it is a fallback | An ingestion job that can reload every point into a new cluster |

Restoring a backup into the same cluster makes the cluster unavailable while it runs, and reverts its CPU, memory, node count, and Qdrant version to the values at backup time. Data written after the backup is lost. Replication does not replace backups: it protects against node loss, not against bad writes or deletes.

## Access

| Check | Value | Set in |
|---|---|---|
| Database API keys | An expiration on each key, one key per application, and the narrowest permission it needs. An email alert warns before a key expires | **API Keys** tab. See [Authentication](/documentation/cloud/authentication/) |
| Network access | Client IP ranges restricted to your own networks | **Client IP Restrictions** in the [cluster configuration](/documentation/cloud/configure-cluster/#client-ip-restrictions) |
| Console access | Users with the roles they need, and their keys revoked when they leave | [Cloud RBAC](/documentation/cloud-rbac/) and [When a User Leaves](/documentation/cloud/authentication/#when-a-user-leaves) |
| Premium isolation | Private network connectivity and customer-managed encryption keys, if you need them | See [Premium Tier](/documentation/cloud-premium/) |

## Monitoring

| Check | Value | Set in |
|---|---|---|
| Alert recipient | A monitored mailbox. Alerts are emailed to the account owner | Account owner's email address |
| Metrics | `/metrics` scraped from each node endpoint, and `/sys_metrics` scraped once from the cluster endpoint | Your Prometheus. See [Monitor Clusters](/documentation/cloud/cluster-monitoring/) |
| Dashboard | The Qdrant Cloud Grafana dashboard | See [Monitor Clusters](/documentation/cloud/cluster-monitoring/#grafana-dashboard) |
| Audit logging | On, with a rotation and retention that fit your disk. Available on paid clusters running v1.17.0 or later | [Cluster configuration](/documentation/cloud/configure-cluster/#audit-logging) |

## Upgrades

| Check | Value | Set in |
|---|---|---|
| Supported version | The latest minor version, or one of the 3 minor versions before it | Version dropdown on the Cluster Detail page. See [Update Clusters](/documentation/cloud/cluster-upgrades/) |
| Upgrade order | Take a backup, update the cluster, then update the client SDKs. Keep each SDK within one minor version of the cluster | Cluster Detail page, then your application dependencies. See [Update Clusters](/documentation/cloud/cluster-upgrades/) and [Backups](/documentation/cloud/backups/) |
| Zero-downtime upgrades | Multiple nodes and a replication factor of at least 2 | See [Restarts and Downtime](/documentation/cloud/configure-cluster/#restarts-and-downtime) |

On an older version, you get an email alert, and support requests are not covered by the SLA.
