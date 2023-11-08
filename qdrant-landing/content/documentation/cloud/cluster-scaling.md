---
title: Cluster scaling
weight: 50
---

# Cluster scaling

The amount of data is always growing and at some point you might need to upgrade the capacity of your cluster.
There are different options for how it can be done.

## Vertical scaling

Vertical scaling, also known as vertical expansion, is the process of increasing the capacity of a cluster by adding more resources, such as memory, storage, or processing power.

You can start with a minimal cluster configuration of 2GB of RAM and resize it up to 64GB of RAM (or even more if desired) over the time step by step with the growing amount of data in your application.
If your cluster consists of several nodes each node will need to be scaled to the same size.
Please note that vertical cluster scaling will require a short downtime period to restart your cluster.
In order to avoid a downtime you can make use of data replication, which can be configured on the collection level.
Vertical scaling can be initiated on the cluster detail page via the button "scale up".

## Horizontal scaling

Vertical scaling can be an effective way to improve the performance of a cluster and extend the capacity, but it has some limitations.
The main disadvantage of vertical scaling is that there are limits to how much a cluster can be expanded.
At some point, adding more resources to a cluster can become impractical or cost-prohibitive.
In such cases, horizontal scaling may be a more effective solution.
Horizontal scaling, also known as horizontal expansion, is the process of increasing the capacity of a cluster by adding more nodes and distributing the load and data among them. 
The horizontal scaling at Qdrant starts on the collection level.
You have to choose the number of shards you want to distribute your collection around while creating the collection.
Please refer to the [sharding documentation](../../guides/distributed_deployment/#sharding) section for details.


Important: The number of shards means the maximum amount of nodes you can add to your cluster. In the beginning, all the shards can reside on one node.
With the growing amount of data you can add nodes to your cluster and move shards to the dedicated nodes using the [cluster setup API](../../guides/distributed_deployment/#cluster-scaling). 

We will be glad to consult you on an optimal strategy for scaling.
[Let us know](mailto:cloud@qdrant.io) your needs and decide together on a proper solution. We plan to introduce an auto-scaling functionality. Since it is one of most desired features, it has a high priority on our Cloud roadmap.

### Guide: Moving shards to a new node after adding nodes

After scaling a cluster horizontally, you can move shards from your original nodes to the new ones to balance memory and storage utilization.

NOTE: NOTE: this guide is an example of moving shards from node 0, if you want to move shards from another 
node you would need to change your cluster URL to `https://node-{source_node}-xyz-example.eu-central.aws.cloud.qdrant.io`

Firstly, after adding nodes confirm that new peers are present by running:

```bash
curl \
  -X GET 'https://node-0-xyz-example.eu-central.aws.cloud.qdrant.io:6333/cluster' \
  --header 'api-key: <paste-your-api-key-here>'
```

Note the `peer_ids` of the peers as they are needed for the last step of moving shards

Afterwards you need to check the target collection cluster info. This gives insights of how many shards are on the node and its size. Note the `local_shards` from the return result and note a `shard_id` of the shard you want to move to another node.

```bash
curl \
  -X GET 'https://node-0-xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections/{collection_name}/cluster' \
  --header 'api-key: <paste-your-api-key-here>'
```

The last step is to initiate a move shard operation, for it you will need the ID of the peer that stores the target shard, the shard ID itself and the target peer ID to which the shard will be moved:

```bash
curl \
  -X POST 'https://node-0-xyz-example.eu-central.aws.cloud.qdrant.io:6333/collections/{collection_name}/cluster' \
  --header 'api-key: <paste-your-api-key-here>' -d '{
    "move_shard": {
    "shard_id": SHARD_ID,
    "from_peer_id": SOURCE_PEER_ID,
    "to_peer_id": TARGET_PEER_ID
  }
}' -H "Content-Type: application/json"
```

This initiates a background shard move operation. After the shard is moved you can confirm it by once again running the command from step two (querying collection cluster info), and you will notice that the shard has moved to another peer.

