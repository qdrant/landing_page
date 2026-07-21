---
title: Distributed Deployment
short_description: "Run Qdrant in distributed mode across multiple nodes for higher availability, scalable throughput, and fault-tolerant vector search."
description: "Configure distributed Qdrant deployments to scale storage, balance load, and tolerate node failures using sharding and replication across a cluster."
weight: 20
aliases:
  - /documentation/distributed_deployment
  - /guides/distributed_deployment
  - /documentation/operations/distributed_deployment
---

# Distributed Deployment

*Available since Qdrant v0.8.0*

Qdrant supports a distributed deployment mode.
In this mode, multiple Qdrant services communicate with each other to distribute the data across the peers to extend the storage capabilities and increase stability.

## Enabling Distributed Mode in Self-Hosted Qdrant

To enable distributed deployment - enable the cluster mode in the [configuration](/documentation/ops-configuration/configuration/) or using the ENV variable: `QDRANT__CLUSTER__ENABLED=true`.

```yaml
cluster:
  # Use `enabled: true` to run Qdrant in distributed deployment mode
  enabled: true
  # Configuration of the inter-cluster communication
  p2p:
    # Port for internal communication between peers
    port: 6335

  # Configuration related to distributed consensus algorithm
  consensus:
    # How frequently peers should ping each other.
    # Setting this parameter to lower value will allow consensus
    # to detect disconnected node earlier, but too frequent
    # tick period may create significant network and CPU overhead.
    # We encourage you NOT to change this parameter unless you know what you are doing.
    tick_period_ms: 100
```

By default, Qdrant will use port `6335` for its internal communication.
All peers should be accessible on this port from within the cluster, but make sure to isolate this port from outside access, as it might be used to perform write operations.

Additionally, you must provide the `--uri` flag to the first peer so it can tell other nodes how it should be reached:

```bash
./qdrant --uri 'http://qdrant_node_1:6335'
```

Subsequent peers in a cluster must know at least one node of the existing cluster to synchronize through it with the rest of the cluster.

To do this, they need to be provided with a bootstrap URL:

```bash
./qdrant --bootstrap 'http://qdrant_node_1:6335'
```

The URL of the new peers themselves will be calculated automatically from the IP address of their request.
But it is also possible to provide them individually using the `--uri` argument.

```text
USAGE:
    qdrant [OPTIONS]

OPTIONS:
        --bootstrap <URI>
            Uri of the peer to bootstrap from in case of multi-peer deployment. If not specified -
            this peer will be considered as a first in a new deployment

        --uri <URI>
            Uri of this peer. Other peers should be able to reach it by this uri.

            This value has to be supplied if this is the first peer in a new deployment.

            In case this is not the first peer and it bootstraps the value is optional. If not
            supplied then qdrant will take internal grpc port from config and derive the IP address
            of this peer on bootstrap peer (receiving side)

```

After a successful synchronization you can observe the state of the cluster through the [REST API](https://api.qdrant.tech/master/api-reference/distributed/cluster-status):

```http
GET /cluster
```

Example result:

```json
{
  "result": {
    "status": "enabled",
    "peer_id": 11532566549086892000,
    "peers": {
      "9834046559507417430": {
        "uri": "http://172.18.0.3:6335/"
      },
      "11532566549086892528": {
        "uri": "http://qdrant_node_1:6335/"
      }
    },
    "raft_info": {
      "term": 1,
      "commit": 4,
      "pending_operations": 1,
      "leader": 11532566549086892000,
      "role": "Leader"
    }
  },
  "status": "ok",
  "time": 5.731e-06
}
```

Note that enabling distributed mode does not automatically replicate your data. See the section on [making use of a new distributed Qdrant cluster](#making-use-of-a-new-distributed-qdrant-cluster) for the next steps.

## Enabling Distributed Mode in Qdrant Cloud

For best results, first ensure your cluster is running Qdrant v1.7.4 or higher. Older versions of Qdrant do support distributed mode, but improvements in v1.7.4 make distributed clusters more resilient during outages.

To enable distributed mode, in the [Qdrant Cloud console](https://cloud.qdrant.io/), click "Scale Cluster" and select the desired node count.

Additionally, Qdrant Cloud also offers the ability to automatically rebalance and to reshard your collections, which is not available in self-hosted Qdrant.  See the [Resharding](/documentation/cloud/cluster-scaling/#resharding) and [Shard Rebalancing](/documentation/cloud/configure-cluster/#shard-rebalancing) sections in for more details.

## Making Use of a New Distributed Qdrant Cluster

When you enable distributed mode and scale up to two or more nodes, your data does not move to the new node automatically; it starts out empty. To make use of your new empty node, do one of the following:

* Create a new replicated collection by setting the [replication_factor](#replication-factor) to 2 or more and setting the [number of shards](#choosing-the-right-number-of-shards) to a multiple of your number of nodes.
* If you have an existing collection which does not contain enough shards for each node, you must create a new collection as described in the previous bullet point.
* If you already have enough shards for each node, and you merely need to replicate your data, follow the directions for [creating new shard replicas](#creating-new-shard-replicas).
* If you already have enough shards for each node, and your data is already replicated, you can move data (without replicating it) onto the new node(s) by [moving shards](#moving-shards).

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to keep the cluster topology and collection structure consistent across nodes. For how consensus works and what it means for availability, see [Raft consensus](/documentation/scaling/horizontal-scaling/#raft-consensus) in Horizontal Scaling.

## Sharding

Qdrant distributes a collection's points across shards to scale horizontally. For how sharding works conceptually, see [Sharding](/documentation/scaling/horizontal-scaling/#sharding) in Horizontal Scaling.

### Choosing the Right Number of Shards

When you create a collection, Qdrant splits the collection into `shard_number` shards. If left unset, `shard_number` is set to the number of nodes in your cluster when the collection was created. The `shard_number` cannot be changed without recreating the collection.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-shard-number/" >}}

To ensure all nodes in your cluster are evenly utilized, the number of shards must be a multiple of the number of nodes you are currently running in your cluster.

> Aside: Advanced use cases such as multitenancy may require an uneven distribution of shards. See [Multitenancy](/articles/multitenancy/).

We recommend creating at least 2 shards per node to allow future expansion without having to re-shard. [Resharding](/documentation/cloud/cluster-scaling/#resharding) is possible on Qdrant Cloud, but should be avoided if hosting elsewhere as it would require creating a new collection.

If you anticipate a lot of growth, we recommend 12 shards since you can expand from 1 node up to 2, 3, 6, and 12 nodes without having to re-shard. Having more than 12 shards in a small cluster may not be worth the performance overhead.

### Rebalancing

Shards are evenly distributed across all existing nodes when a collection is first created.

When you add or remove nodes from the cluster, rebalancing of existing shards across the nodes depends on how you've deployed the cluster:

- In Qdrant Cloud, shards are [balanced across the nodes automatically](/documentation/cloud/configure-cluster/#shard-rebalancing).
- If your cluster is not running in Qdrant Cloud, you need to [manually balance shards](#moving-shards).

### Resharding

*Available as of v1.13.0 in Cloud*

<aside role="alert">Resharding a large collection can take a long time. It's better to set the desired shard count when <a href="#choosing-the-right-number-of-shards">creating a collection</a>.</aside>

Resharding allows you to change the number of shards in your existing collections if you're hosting with our [Cloud](/documentation/deploy-intro/) offering.

Resharding can change the number of shards both up and down, without having to recreate the collection from scratch.

Please refer to the [Resharding](/documentation/cloud/cluster-scaling/#resharding) section in our cloud documentation for more details.

### Moving Shards

*Available as of v0.9.0*

Qdrant allows moving shards between nodes in the cluster and removing nodes from the cluster. This functionality unlocks the ability to dynamically scale the cluster size without downtime. It also allows you to upgrade or migrate nodes without downtime.

If your cluster is running in Qdrant Cloud, shards are balanced across the cluster nodes automatically. For more information see the [Configuring Cloud Clusters](/documentation/cloud/configure-cluster/#shard-rebalancing) and [Cloud Cluster Scaling](/documentation/cloud/cluster-scaling/) documentation.

Qdrant provides the information regarding the current shard distribution in the cluster with the [Collection Cluster info API](https://api.qdrant.tech/master/api-reference/distributed/collection-cluster-info).

Use the [Update collection cluster setup API](https://api.qdrant.tech/master/api-reference/distributed/update-collection-cluster) to initiate the shard transfer:

```http
POST /collections/{collection_name}/cluster
{
    "move_shard": {
        "shard_id": 0,
        "from_peer_id": 381894127,
        "to_peer_id": 467122995
    }
}
```

<aside role="status">You likely want to select a specific <a href="#shard-transfer-method">shard transfer method</a> to get desired performance and guarantees.</aside>

After the transfer is initiated, the service will process it based on the used
[transfer method](#shard-transfer-method) keeping both shards in sync. Once the
transfer is completed, the old shard is deleted from the source node.

In case you want to downscale the cluster, you can move all shards away from a peer and then remove the peer using the [remove peer API](https://api.qdrant.tech/master/api-reference/distributed/remove-peer).

```http
DELETE /cluster/peer/{peer_id}
```

After that, Qdrant will exclude the node from the consensus, and the instance will be ready for shutdown.

### User-Defined Sharding

*Available as of v1.7.0*

Qdrant allows you to specify the shard for each point individually. This feature is useful if you want to control the shard placement of your data, so that operations can hit only the subset of shards they actually need. In big clusters, this can significantly improve the performance of operations that do not require the whole collection to be scanned.

#### Multitenancy

A use-case for this feature is managing a [multi-tenant collection](/documentation/manage-data/multitenancy/), where each tenant (let it be a user or organization) is assumed to be segregated, so they can have their data stored in separate shards.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-custom-sharding/" >}}

In this mode, the `shard_number` means the number of shards per shard key, where points will be distributed evenly. For example, if you have 10 shard keys and a collection config with these settings:

```json
{
    "shard_number": 1,
    "sharding_method": "custom",
    "replication_factor": 2
}
```

Then you will have `1 * 10 * 2 = 20` total physical shards in the collection.

Physical shards require a large amount of resources, so make sure your custom sharding key has a low cardinality.

For large cardinality keys, it is recommended to use [partition by payload](/documentation/manage-data/multitenancy/#partition-by-payload) instead.

Now you need to create custom shards ([API reference](https://api.qdrant.tech/api-reference/distributed/create-shard-key#request)):

{{< code-snippet path="/documentation/headless/snippets/create-shard/create-named-shard/" >}}

You can list all custom shard keys in a collection:

{{< code-snippet path="/documentation/headless/snippets/list-shard-keys/" >}}

To specify the shard for each point, you need to provide the `shard_key` field in the upsert request:

{{< code-snippet path="/documentation/headless/snippets/insert-points/with-custom-shard/" >}}

<aside role="alert">
Using the same point ID across multiple shard keys is <strong>not supported<sup>*</sup></strong> and should be avoided.
</aside>
<sup>
<strong>*</strong> When using custom sharding, IDs are only enforced to be unique within a shard key. This means that you can have multiple points with the same ID, if they have different shard keys.
This is a limitation of the current implementation, and is an anti-pattern that should be avoided because it can create scenarios of points with the same ID to have different contents. In the future, we plan to add a global ID uniqueness check.
</sup>

Now you can target the operations to specific shard(s) by specifying the `shard_key` on any operation you do. Operations that do not specify the shard key will be executed on __all__ shards.

#### Time-Based Sharding

Another use case for user-defined sharding is time-based sharding, where you route points to a specific shard (or shards) based on timestamp. This enables efficient querying of recent data and efficient data lifecycle management by deleting old shards once they pass a certain age. See the [Time-Based Sharding](/documentation/tutorials-operations/time-based-sharding/) tutorial for more details.

<img src="/documentation/tutorials/time-based-sharding/time-based-sharding.png" alt="Sharding per day">

### Shard Transfer Method

*Available as of v1.7.0*

There are different methods for transferring a shard, such as moving or
replicating, to another node. Depending on what performance and guarantees you'd
like to have and how you'd like to manage your cluster, you likely want to
choose a specific method. Each method has its own pros and cons. Which is
fastest depends on the size and state of a shard.

Available shard transfer methods are:

- `stream_records`: _(default)_ transfer by streaming just its records to the target node in batches.
- `snapshot`: transfer including its index and quantized data by utilizing a [snapshot](/documentation/snapshots/) automatically.
- `wal_delta`: _(auto recovery default)_ transfer by resolving [WAL] difference; the operations that were missed.

Each has pros, cons and specific requirements, some of which are:

| Method: | Stream records | Snapshot | WAL delta |
|:---|:---|:---|:---|
| **Version** | v0.8.0+ | v1.7.0+ | v1.8.0+ |
| **Target** | New/existing shard | New/existing shard | Existing shard |
| **Connectivity** | Internal gRPC API <small>(<abbr title="port">6335</abbr>)</small> | REST API <small>(<abbr title="port">6333</abbr>)</small><br>Internal gRPC API <small>(<abbr title="port">6335</abbr>)</small> | Internal gRPC API <small>(<abbr title="port">6335</abbr>)</small> |
| **HNSW index** | Doesn't transfer, will reindex on target. | Does transfer, immediately ready on target. | Doesn't transfer, may index on target. |
| **Quantization** | Doesn't  transfer, will requantize on target. | Does transfer, immediately ready on target. | Doesn't transfer, may quantize on target. |
| **Ordering** | Unordered updates on target[^unordered] | Ordered updates on target[^ordered] | Ordered updates on target[^ordered] |
| **Disk space** | No extra required | Extra required for snapshot on both nodes | No extra required |

[^unordered]: Weak ordering for updates: All records are streamed to the target node in order.
    New updates are received on the target node in parallel, while the transfer
    of records is still happening. We therefore have `weak` ordering, regardless
    of what [ordering](/documentation/scaling/consistency-guarantees/#write-ordering) is used for updates.
[^ordered]: Strong ordering for updates: A snapshot of the shard
    is created, it is transferred and recovered on the target node. That ensures
    the state of the shard is kept consistent. New updates are queued on the
    source node, and transferred in order to the target node. Updates therefore
    have the same [ordering](/documentation/scaling/consistency-guarantees/#write-ordering) as the user selects, making
    `strong` ordering possible.

To select a shard transfer method, specify the `method` like:

```http
POST /collections/{collection_name}/cluster
{
    "move_shard": {
        "shard_id": 0,
        "from_peer_id": 381894127,
        "to_peer_id": 467122995,
        "method": "snapshot"
    }
}
```

The `stream_records` transfer method is the simplest available. It simply
transfers all shard records in batches to the target node until it has
transferred all of them, keeping both shards in sync. It will also make sure the
transferred shard indexing process is keeping up before performing a final
switch. The method has two common disadvantages: 1. It does not transfer index
or quantization data, meaning that the shard has to be optimized again on the
new node, which can be very expensive. 2. The ordering guarantees are
`weak`[^unordered], which is not suitable for some applications. Because it is
so simple, it's also very robust, making it a reliable choice if the above cons
are acceptable in your use case. If your cluster is unstable and out of
resources, it's probably best to use the `stream_records` transfer method,
because it is unlikely to fail.

The `snapshot` transfer method utilizes [snapshots](/documentation/snapshots/)
to transfer a shard. A snapshot is created automatically. It is then transferred
and restored on the target node. After this is done, the snapshot is removed
from both nodes. While the snapshot/transfer/restore operation is happening, the
source node queues up all new operations. All queued updates are then sent in
order to the target shard to bring it into the same state as the source. There
are two important benefits: 1. It transfers index and quantization data, so that
the shard does not have to be optimized again on the target node, making them
immediately available. This way, Qdrant ensures that there will be no
degradation in performance at the end of the transfer. Especially on large
shards, this can give a huge performance improvement. 2. The ordering guarantees
can be `strong`[^ordered], required for some applications.

The `wal_delta` transfer method only transfers the difference between two
shards. More specifically, it transfers all operations that were missed to the
target shard. The [WAL] of both shards is used to resolve this. There are two
benefits: 1. It will be very fast because it only transfers the difference
rather than all data. 2. The ordering guarantees can be `strong`[^ordered],
required for some applications. Two disadvantages are: 1. It can only be used to
transfer to a shard that already exists on the other node. 2. Applicability is
limited because the WALs normally don't hold more than 64MB of recent
operations. But that should be enough for a node that quickly restarts, to
upgrade for example. If a delta cannot be resolved, this method automatically
falls back to `stream_records` which equals transferring the full shard.

The `stream_records` method is currently used as default. This may change in the
future. As of Qdrant 1.9.0 `wal_delta` is used for automatic shard replications
to recover dead shards.

[WAL]: /documentation/manage-data/storage/#versioning

## Replication

Shards can be [replicated](/documentation/scaling/horizontal-scaling/#replication) between nodes in the cluster, keeping several copies of a shard spread across the cluster. This enables you to scale your read throughput and tolerate node failures.

### Replication Factor

When you create a collection, you can control how many shard replicas you'd like to store by changing the `replication_factor`. By default, `replication_factor` is set to `1`, meaning no additional copy is maintained automatically. The default can be changed in the [Qdrant configuration](/documentation/ops-configuration/configuration/#configuration-options). You can change the default per-collection by setting the `replication_factor` when you create a collection.

The `replication_factor` can be updated for an existing collection, but the effect of this depends on how you're running Qdrant. If you're hosting the open source version of Qdrant yourself, changing the replication factor after collection creation doesn't do anything. You can manually [create](#creating-new-shard-replicas) or drop shard replicas to achieve your desired replication factor. In Qdrant Cloud (including Hybrid Cloud, Private Cloud) your shards will automatically be replicated or dropped to match your configured replication factor.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-replication-factor/" >}}

This code sample creates a collection with a total of 6 logical shards backed by a total of 12 physical shards.

Since a replication factor of "2" would require twice as much storage space, it is advised to make sure the hardware can host the additional shard replicas beforehand.

### Creating New Shard Replicas

It is possible to create or delete replicas manually on an existing collection using the [Update collection cluster setup API](https://api.qdrant.tech/master/api-reference/distributed/update-collection-cluster). This is usually only necessary if you run Qdrant open-source. In Qdrant Cloud shard replication is handled and updated automatically, matching the configured `replication_factor`.

A replica can be added on a specific peer by specifying the peer from which to replicate.

```http
POST /collections/{collection_name}/cluster
{
    "replicate_shard": {
        "shard_id": 0,
        "from_peer_id": 381894127,
        "to_peer_id": 467122995
    }
}
```

<aside role="status">You likely want to select a specific <a href="#shard-transfer-method">shard transfer method</a> to get desired performance and guarantees.</aside>

And a replica can be removed on a specific peer.

```http
POST /collections/{collection_name}/cluster
{
    "drop_replica": {
        "shard_id": 0,
        "peer_id": 381894127
    }
}
```

Keep in mind that a collection must contain at least one active replica of a shard.

## Deploy Behind a Load Balancer

In a multi-node Qdrant cluster, every node can accept requests and route them internally to the correct shards. To get the best performance and availability out of your cluster, distribute requests evenly across all nodes by routing requests through a load balancer.

Routing all traffic to a single node creates two problems:

- **Single point of failure:** If that node goes down, your application loses connectivity to the cluster even though the rest of it remains healthy. A load balancer automatically routes requests to any surviving node.
- **Idle replicas:** If the receiving node holds a local replica of every shard, it handles the entire query locally and the replicas on all other nodes sit idle. You pay the storage and write cost of replication without gaining any read throughput. A load balancer lets each node serve reads from its own local replicas.

Qdrant's clients don't distribute requests across nodes on their own. To take full advantage of replication, deploy Qdrant behind a load balancer. This:

- Eliminates the single point of failure at the entry point.
- Ensures replicas on all nodes serve reads.
- Distributes the coordinator role across nodes. Each node that receives a request fans out the query to the relevant shards, merges the partial results, and returns the final response so the CPU and memory cost of aggregation is shared rather than concentrated on one node.

On Qdrant Cloud, clusters are already behind a load balancer. Send all requests to the endpoint provided for each cluster, and Qdrant Cloud handles the load balancing. If you're self-hosting, you need to set up a load balancer yourself.

## Listener Mode

<aside role="alert">This is an experimental feature, its behavior may change in the future.</aside>

In some cases it might be useful to have a Qdrant node that only accumulates data and does not participate in search operations.
There are several scenarios where this can be useful:

- Listener option can be used to store data in a separate node, which can be used for backup purposes or to store data for a long time.
- Listener node can be used to synchronize data into another region, while still performing search operations in the local region.


To enable listener mode, set `node_type` to `Listener` in the config file:


```yaml
storage:
  node_type: "Listener"
```

Listener node will not participate in search operations, but will still accept write operations and will store the data in the local storage.

All shards, stored on the listener node, will be converted to the `Listener` state.

Additionally, all write requests sent to the listener node will be processed with `wait=false` option, which means that the write operations will be considered successful once they are written to WAL.
This mechanism should allow to minimize upsert latency in case of parallel snapshotting.