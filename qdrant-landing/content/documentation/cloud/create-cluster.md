---
title: Create a Cluster
weight: 20
---

# Creating a Qdrant Cloud Cluster

Qdrant Cloud offers two types of clusters: **Free** and **Standard**.

## Free Clusters

Free tier clusters are perfect for prototyping and testing. You don't need a credit card to join.

A free tier cluster only includes 1 single node with the following resources:

| Resource   | Value |
|------------|-------|
| RAM        | 1 GB  |
| vCPU       | 0.5   |
| Disk space | 4 GB  |
| Nodes      | 1     |

This configuration supports serving about 1 M vectors of 768 dimensions. To calculate your needs, refer to our documentation on [Capacity Planning](/documentation/guides/capacity-planning/).

The choice of cloud providers and regions is limited.

It includes:

- Standard Support
- Basic monitoring
- Basic log access
- Basic alerting
- Version upgrades with downtime
- Only manual snapshots and restores via API
- No dedicated resources

If unused, free tier clusters are automatically suspended after 1 week, and deleted after 4 weeks of inactivity if not reactivated.

You can always upgrade to a standard cluster with more resources and features.

## Standard Clusters

On top of the Free cluster features, Standard clusters offer:

- Response time and uptime SLAs
- Dedicated resources
- Backup and disaster recovery
- Multi-node clusters for high availability
- Horizontal and vertical scaling
- Monitoring and log management
- Zero-downtime upgrades for multi-node clusters with replication

You have a broad choice of regions on AWS, Azure and Google Cloud.

For payment information see [**Pricing and Payments**](/documentation/cloud/pricing-payments/).

## Create a Cluster

![Create Cluster Page](/documentation/cloud/create-cluster.png)

This page shows you how to use the Qdrant Cloud Console to create a custom Qdrant Cloud cluster.

> **Prerequisite:** Please make sure you have provided billing information before creating a custom cluster. 

1. Start in the **Clusters** section of the [Cloud Dashboard](https://cloud.qdrant.io/). 
1. Select **Clusters** and then click **+ Create**.
1. In the **Create a cluster** screen select **Free** or **Standard**
   Most of the remaining configuration options are only available for standard clusters.
1. Select a provider. Currently, you can deploy to:

   - Amazon Web Services (AWS)
   - Google Cloud Platform (GCP)
   - Microsoft Azure 
   - Your own [Hybrid Cloud](/documentation/hybrid-cloud/) Infrastructure

1. Choose your data center region or Hybrid Cloud environment. 
1. Configure RAM for each node. 
   >  For more information, see our [Capacity Planning](/documentation/guides/capacity-planning/) guidance.
1. Choose the number of vCPUs per node. If you add more
   RAM, the menu provides different options for vCPUs.
1. Select the number of nodes you want the cluster to be deployed on.
   > Each node is automatically attached with a disk, that has enough space to store data with Qdrant's default collection configuration.
1. Select additional disk space for your deployment.
   > Depending on your collection configuration, you may need more disk space per RAM. For example, if you configure `on_disk: true` and only use RAM for caching. 
1. Review your cluster configuration and pricing.
1. When you're ready, select **Create**. It takes some time to provision your cluster.

Once provisioned, you can access your cluster on ports 443 and 6333 (REST) and 6334 (gRPC).

![Cluster configured in the UI](/documentation/cloud/cluster-detail.png)

You should now see the new cluster in the **Clusters** menu.

## Creating a Production-Ready Cluster

To create a production-ready cluster, you need to ensure the following:

**High Availability**

Your cluster should have at least 3 nodes, and each collection should have a replication factor of at least 2. This ensures that is one node fails, or is restarted due to maintenance, a version upgrade, or a scaling operation, that the cluster remains fully operational. You can ensure this by checking the **High Availability** checkbox when creating a cluster.

**Backup and Disaster Recovery**

You should create a backup schedule for your cluster. This ensures that you can restore your data in case of a disaster. You can configure backups in the **Backups** section of the cluster detail page. See [**Backups**](/documentation/cloud/backups/) for more information.

**Collection Sharding**

To allow your cluster to easily scale horizontally, you should configure at least twice as many shards per collection than the number of nodes in your cluster. You can configure the number of shards when creating a collection. See [**Sharding**](/documentation/guides/distributed_deployment/#sharding) for more information.

If you did not configure enough shards in a collection, you can use the [**Resharding**](/documentation/cloud/cluster-scaling/#resharding) feature to change the number of shards in an existing collection.

For more information on how to create a production-ready cluster, see our [**Vector Search in Production**](/articles/vector-search-production/) article.

## Deleting a Cluster

You can delete a Qdrant database cluster from the cluster's detail page.

![Delete Cluster](/documentation/cloud/delete-cluster.png)

## Next Steps

You will need to connect to your new Qdrant Cloud cluster. Follow [**Authentication**](/documentation/cloud/authentication/) to create one or more API keys. 

You can also scale your cluster both horizontally and vertically. Read more in [**Cluster Scaling**](/documentation/cloud/cluster-scaling/).

If a new Qdrant version becomes available, you can upgrade your cluster. See [**Cluster Upgrades**](/documentation/cloud/cluster-upgrades/).

For more information on creating and restoring backups of a cluster, see [**Backups**](/documentation/cloud/backups/).
