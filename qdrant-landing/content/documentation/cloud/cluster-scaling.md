---
title: Scale Clusters
weight: 50
---

# Scaling Qdrant Cloud Clusters

The amount of data is always growing and at some point you might need to upgrade or downgrade the capacity of your cluster.

![Cluster Scaling](/documentation/cloud/cluster-scaling.png)

There are different options for how it can be done.

## Vertical scaling

Vertical scaling is the process of increasing the capacity of a cluster by adding or removing CPU, storage and memory resources on each database node.

You can start with a minimal cluster configuration of 2GB of RAM and resize it up to 64GB of RAM (or even more if desired) over the time step by step with the growing amount of data in your application. If your cluster consists of several nodes each node will need to be scaled to the same size. Please note that vertical cluster scaling will require a short downtime period to restart your cluster.  In order to avoid a downtime you can make use of data replication, which can be configured on the collection level.  Vertical scaling can be initiated on the cluster detail page via the button "scale".

If you want to scale your cluster down, the new, smaller memory size must be still sufficient to store all the data in the cluster. Otherwise, the database cluster could run out of memory and crash. Therefore, the new memory size must be at least as large as the current memory usage of the database cluster including a bit of buffer. Qdrant Cloud will automatically prevent you from scaling down the Qdrant database cluster with a too small memory size.

Note, that it is not possible to scale down the disk space of the cluster due to technical limitations of the underlying cloud providers.

## Horizontal scaling

Vertical scaling can be an effective way to improve the performance of a cluster and extend the capacity, but it has some limitations. The main disadvantage of vertical scaling is that there are limits to how much a cluster can be expanded. At some point, adding more resources to a cluster can become impractical or cost-prohibitive.

In such cases, horizontal scaling may be a more effective solution.

Horizontal scaling, also known as horizontal expansion, is the process of increasing the capacity of a cluster by adding more nodes and distributing the load and data among them. The horizontal scaling at Qdrant starts on the collection level. You have to choose the number of shards you want to distribute your collection around while creating the collection.  Please refer to the [sharding documentation](/documentation/guides/distributed_deployment/#sharding) section for details.

After that, you can configure, or change the amount of Qdrant database nodes within a cluster during cluster creation, or on the cluster detail page via "Scale" button.

Important: The number of shards means the maximum amount of nodes you can add to your cluster. In the beginning, all the shards can reside on one node. With the growing amount of data you can add nodes to your cluster and move shards to the dedicated nodes using the [cluster setup API](/documentation/guides/distributed_deployment/#cluster-scaling).

When scaling down horizontally, the cloud platform will automatically ensure that any shards that are present on the nodes to be deleted, are moved to the remaining nodes.

We will be glad to consult you on an optimal strategy for scaling.

[Let us know](/documentation/support/) your needs and decide together on a proper solution.

## Resharding

*Available as of Qdrant v1.13.0*

<aside role="status">Resharding is exclusively available on multi-node clusters across our <a href="/documentation/cloud-intro/">cloud</a> offering, including <a href="/documentation/hybrid-cloud/">Hybrid</a> and <a href="/documentation/private-cloud/">Private</a> Cloud.</aside>

When creating a collection, it has a specific number of shards. The ideal number of shards might change as your cluster evolves.

Resharding allows you to change the number of shards in your existing collections, both up and down, without having to recreate the collection from scratch.

Resharding is a transparent process, meaning that the collection is still available while resharding is going on without having downtime. This allows you to scale from one node to any number of nodes and back, keeping your data perfectly distributed without compromise.

To increase the number of shards (reshard up), use the [Update collection cluster setup API](https://api.qdrant.tech/master/api-reference/distributed/update-collection-cluster) to initiate the resharding process:

```http
POST /collections/{collection_name}/cluster
{
    "start_resharding": {
        "direction": "up",
        "shard_key": null
    }
}
```

To decrease the number of shards (reshard down), you may specify the `"down"` direction.

The current status of resharding is listed in the [collection cluster info](https://api.qdrant.tech/v-1-12-x/api-reference/distributed/collection-cluster-info) which can be fetched with:

```http
GET /collections/{collection_name}/cluster
```

We always recommend to run an ongoing resharding operation till the end. But, if at any point the resharding operation needs to be aborted, you can use:

```http
POST /collections/{collection_name}/cluster
{
    "abort_resharding": {}
}
```

A few things to be aware of with regards to resharding:

- during resharding, performance of your cluster may be slightly reduced
- during resharding, reported point counts will not be accurate
- resharding may be a long running operation on huge collections
- you can only run one resharding operation per collection at a time
