---
title: Cluster Alerts
short_description: "Reference for the email alerts Qdrant Cloud sends for memory, disk, CPU, availability, version, key expiry, and uneven load, with the cause and fix for each."
description: "Look up each Qdrant Cloud cluster alert: the condition that triggers it, what it means for your cluster, and how to resolve it."
weight: 31
---

# Cluster Alerts

The account owner receives these alerts by email. Each row gives the condition that triggers the alert, what it means for your cluster, and how to resolve it. For the metrics behind them, see [Monitor Clusters](/documentation/cloud/cluster-monitoring/). To read firing and resolved alerts in your own automation, run `qcloud cluster alert list <CLUSTER_ID>` in the [Cloud CLI](/documentation/cloud-cli/) or call the `ListClusterAlerts` method of the [Cloud API](/documentation/cloud-api/).

## Capacity

| Alert | Triggers when | What it means | How to resolve |
|---|---|---|---|
| Memory Overutilized | Memory use is above 80% of the allocation for more than 5 minutes | If usage keeps growing past the allocation, the cluster fails from resource pressure and you see disruption | [Scale vertically](/documentation/cloud/cluster-scaling/#vertical-scaling) for more capacity per node, [scale horizontally](/documentation/cloud/cluster-scaling/#horizontal-scaling) to spread the load, or reduce memory with [quantization](/documentation/manage-data/quantization/) or the `cold` [memory tier](/documentation/ops-configuration/memory-tiers/) |
| Disk Space Overutilized | Disk use is above 80% of the allocation for more than 5 minutes | Same as memory: the cluster fails from resource pressure if usage keeps growing | [Scale vertically](/documentation/cloud/cluster-scaling/#vertical-scaling) for more disk per node, or [scale horizontally](/documentation/cloud/cluster-scaling/#horizontal-scaling) to spread the data. See [Capacity Planning](/documentation/capacity-planning/#scaling-disk-space-in-qdrant-cloud) |
| A Node Ran Out of Memory | A node tried to allocate more RAM than available and the operating system stopped the Qdrant process | A highly available cluster may avoid total downtime, but it is unstable. Without high availability, expect disruption until the cluster is scaled up | Scale vertically or horizontally, reduce memory with [quantization](/documentation/manage-data/quantization/), and make the cluster [highly available](/documentation/cloud/production-checklist/#availability) |
| A Node Ran Out of Disk Space | Disk use on a node is above 99% | The node cannot store new vectors | [Scale vertically](/documentation/cloud/cluster-scaling/#vertical-scaling) for more disk, or [scale horizontally](/documentation/cloud/cluster-scaling/#horizontal-scaling) and [reshard](/documentation/cloud/cluster-scaling/#resharding) if there are too few shards to use the new nodes. See [Capacity Planning](/documentation/capacity-planning/#scaling-disk-space-in-qdrant-cloud) |
| One or More Nodes Are in Recovery Mode | A node failed to start, usually because it ran out of memory, and restarted in [recovery mode](/documentation/ops-configuration/administration/#recovery-mode) | The node loads only collection metadata, so the only collection operation available is deleting a collection. The node does not serve search or writes | Scale the cluster [vertically](/documentation/cloud/cluster-scaling/#vertical-scaling) for more memory, or reduce memory with [quantization](/documentation/manage-data/quantization/). Delete a collection only on a proof-of-concept or toy cluster where the data does not matter |
| A Node is CPU Throttled | CPU throttling is above 25% for 30 minutes | CPU is saturated, so searches and writes respond much slower. The usual cause is a heavy write load while indexes are created or updated, or heavy search load with inefficient queries | Write in batches when search traffic is low, run fewer parallel writes, [index your data](/documentation/manage-data/indexing/), simplify heavy [hybrid and multi-stage queries](/documentation/search/hybrid-queries/), [tune the optimizers](/documentation/ops-optimization/optimizer/), or scale the cluster |

Deleting data is a last resort for these alerts. Use it only on a proof-of-concept or toy cluster where the data does not matter. On any other cluster, scale or reconfigure instead.

## Availability and Health

| Alert | Triggers when | What it means | How to resolve |
|---|---|---|---|
| Cluster is Unhealthy | One or more nodes have been unhealthy for more than 5 minutes | There is a serious issue that needs attention | Check the other alerts first. Then look at recent client code or configuration changes, and at increases in search or write requests |
| Cluster Has Too Many Collections | The cluster has more than 500 collections | Many collections add significant resource overhead and, left alone, degrade resilience and can cause outages | Use one collection with [payload-based partitioning](/documentation/manage-data/multitenancy/) in place of one collection per tenant. You can also split collections across clusters with the [Migration CLI](/documentation/migrate-to-qdrant/) |

## Versions and Keys

| Alert | Triggers when | What it means | How to resolve |
|---|---|---|---|
| Cluster Version is Not Covered by SLA | The cluster runs a version older than the latest and previous 3 minor versions | Support requests against the cluster are not covered by the SLA | [Update the cluster](/documentation/cloud/cluster-upgrades/) |
| Database API Key is About to Expire | A Database API key expires within 7 days | Requests with an expired key fail, which can break queries and applications | Create a new [Database API key](/documentation/cloud/authentication/) and update your application |

## Uneven Load

| Alert | Triggers when | What it means | How to resolve |
|---|---|---|---|
| Node CPU Usage is Not Distributed Equally | CPU usage differs across nodes | Some nodes carry more load than the rest, which slows search and can cause node failures. Uneven data distribution is the usual cause | Reshard and rebalance shards. See [Shard Rebalancing](/documentation/cloud/configure-cluster/#shard-rebalancing) |
| Node RAM or Disk Space Usage is Not Distributed Equally | RAM or disk usage differs across nodes | Same as CPU: hotspots slow search and can cause node failures | [Reshard](/documentation/cloud/cluster-scaling/#resharding) to split a collection across more nodes, and let [rebalancing](/documentation/cloud/configure-cluster/#shard-rebalancing) even out the shards |

Qdrant Cloud rebalances shards in the background by default. It balances the total shard count and size per node across all collections combined, so a single collection can look uneven while the cluster as a whole is balanced.
