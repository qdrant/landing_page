---
title: Configure, Scale & Update Clusters
weight: 3
---

# Configure, Scale & Update Qdrant Hybrid Cloud Clusters

## Configure Clusters

Next to the Hybrid Cloud specific scheduling options, you can change various advanced configuration options for your clusters. See [Configure Clusters](/documentation/cloud/configure-cluster/) for more details.

## Scale Clusters

Hybrid cloud clusters can be scaled up and down, horizontall and vertically, at any time. For more details see [Scale Clusters](/documentation/cloud/cluster-scaling/).

### Automatic Shard Rebalancing

Qdrant Cloud supports automatic shard rebalancing when you scale your cluster horizontally. This ensures that the data is evenly distributed across the nodes, optimizing performance and resource utilization. For more details see [Shard Rebalancing](/documentation/cloud/configure-cluster/#shard-rebalancing).

### Resharding

In Qdrant Cloud, you can change the number of shards in your existing collections without having to recreate the collection from scratch. This feature is called resharding and allows you to scale your collections up or down as needed. For more details see [Resharding](/documentation/cloud/cluster-scaling/#resharding).

## Update Clusters

You can update the version of your cluster at any time. For more details see [Update Clusters](/documentation/cloud/cluster-upgrades/).
