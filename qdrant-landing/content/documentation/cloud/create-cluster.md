---
title: Create a cluster
weight: 20
---

# Create a cluster

This page shows you how to use the Qdrant Cloud Console to create a custom Qdrant Cloud cluster.

> **Prerequisite:** Please make sure you have provided billing information before creating a custom cluster. 

1. Start in the **Clusters** section of the [Cloud Dashboard](https://cloud.qdrant.io). 
2. Select **Clusters** and then click **+ Create**.
3. A window will open. Enter a cluster **Name**.
4. Currently, you can deploy to AWS or GCP. We are developing support for Azure. 
5. Choose your data center region. If you have latency concerns or other topology-related requirements, [**let us know**](mailto:cloud@qdrant.io).
6. Configure RAM size for each node (1GB to 64GB). 
> Please read [**Capacity and Sizing**](../../cloud/capacity-sizing/) to make the right choice. If you need more capacity per node, [**let us know**](mailto:cloud@qdrant.io).
7. Choose the number of CPUs per node (0.5 core to 16 cores). The max/min number of CPUs is coupled to the chosen RAM size. 
8. Select the number of nodes you want the cluster to be deployed on. 
> Each node is automatically attached with a disk space offering enough space for your data if you decide to put the metadata or even the index on the disk storage.
9. Click **Create** and wait for your cluster to be provisioned.

Your cluster will be reachable on port 443 and 6333 (Rest) and 6334 (gRPC).

![Embeddings](/docs/cloud/create-cluster.png)

## Next steps

You will need to connect to your new Qdrant Cloud cluster. Follow [**Authentication**](../../cloud/authentication/) to create one or more API keys. 

Your new cluster is highly available and responsive to your application requirements and resource load. Read more in [**Cluster Scaling**](../../cloud/cluster-scaling/).

