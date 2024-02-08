---
title: Create a cluster
weight: 20
---

# Create a cluster

This page shows you how to use the Qdrant Cloud Console to create a custom Qdrant Cloud cluster.

> **Prerequisite:** Please make sure you have provided billing information before creating a custom cluster. 

1. Start in the **Clusters** section of the [Cloud Dashboard](https://cloud.qdrant.io). 
1. Select **Clusters** and then click **+ Create**.
1. In the **Create a cluster** screen select **Free** or **Standard**
   For more information on a free cluster, see the [Cloud quickstart](/documentation/cloud/quickstart-cloud). The remaining steps assume you want a standard cluster.
1. Select a provider. Currently, you can deploy to:

   - Amazon Web Services (AWS)
   - Google Cloud Platform (GCP)
   - Microsoft Azure 

1. Choose your data center region. If you have latency concerns or other topology-related requirements, [**let us know**](mailto:cloud@qdrant.io).
1. Configure RAM for each node (2 GB to 64 GB). 
   >  For more informtion, see our [**Capacity and Sizing**](/documentation/cloud/capacity-sizing/) guidance. If you need more capacity per node, [**let us know**](mailto:cloud@qdrant.io).
1. Choose the number of vCPUs per node (0.5 core to 16 cores). If you add more
   RAM, the menu provides differnet options for vCPUs.
1. Select the number of nodes you want the cluster to be deployed on. 

   > Each node is automatically attached with a disk space offering enough space for your data if you decide to put the metadata or even the index on the disk storage.

1. Select the disk space for your deployment. You can choose from 8 GB to 2 TB.
1. Review your cluster configuration and pricing.
1. When you're ready, select **Create**. It takes some time to provision your cluster.

Once provisioned, you can access your cluster on ports 443 and 6333 (REST)
and 6334 (gRPC).

![Embeddings](/docs/cloud/create-cluster.png)

You should now see the new cluster in the **Clusters** menu.

A custom cluster includes the following resources. The values in the table are maximums.

| Resource   | Value (max) |
|------------|-------------|
| RAM        | 64 GB       |
| vCPU       | 16 vCPU     |
| Disk space | 2 TB        |
| Nodes      | 10          |  

### Included features

The features included with this paid cluster are:

- Dedicated resources
- Backup and disaster recovery
- Horizontal and vertical scaling
- Monitoring and log management

To learn more about this paid feature, contact us at <FILL IN BLANK>.

## Next steps

You will need to connect to your new Qdrant Cloud cluster. Follow [**Authentication**](/documentation/cloud/authentication/) to create one or more API keys. 

Your new cluster is highly available and responsive to your application requirements and resource load. Read more in [**Cluster Scaling**](/documentation/cloud/cluster-scaling/).

