---
title: Distributed Deployment
weight: 100
aliases:
  - ../distributed_deployment
  - /guides/distributed_deployment
---

# Distributed deployment

Since version v0.8.0 Qdrant supports a distributed deployment mode.
In this mode, multiple Qdrant services communicate with each other to distribute the data across the peers to extend the storage capabilities and increase stability.

## How many Qdrant nodes should I run?

The ideal number of Qdrant nodes depends on how much you value cost-saving, resilience, and performance/scalability in relation to each other.

- **Prioritizing cost-saving**: If cost is most important to you, run a single Qdrant node. This is not recommended for production environments. Drawbacks:
  - Resilience: Users will experience downtime during node restarts, and recovery is not possible unless you have backups or snapshots.
  - Performance: Limited to the resources of a single server.

- **Prioritizing resilience**: If resilience is most important to you, run a Qdrant cluster with three or more nodes and two or more shard replicas. Clusters with three or more nodes and replication can perform all operations even while one node is down. Additionally, they gain performance benefits from load-balancing and they can recover from the permanent loss of one node without the need for backups or snapshots (but backups are still strongly recommended). This is most recommended for production environments. Drawbacks:
   - Cost: Larger clusters are more costly than smaller clusters, which is the only drawback of this configuration.

- **Balancing cost, resilience, and performance**: Running a two-node Qdrant cluster with replicated shards allows the cluster to respond to most read/write requests even when one node is down, such as during maintenance events. Having two nodes also means greater performance than a single-node cluster while still being cheaper than a three-node cluster. Drawbacks:
   - Resilience (uptime): The cluster cannot perform operations on collections when one node is down. Those operations require >50% of nodes to be running, so this is only possible in a 3+ node cluster. Since creating, editing, and deleting collections are usually rare operations, many users find this drawback to be negligible.
   - Resilience (data integrity): If the data on one of the two nodes is permanently lost or corrupted, it cannot be recovered aside from snapshots or backups. Only 3+ node clusters can recover from the permanent loss of a single node since recovery operations require >50% of the cluster to be healthy.
   - Cost: Replicating your shards requires storing two copies of your data.
   - Performance: The maximum performance of a Qdrant cluster increases as you add more nodes.

In summary, single-node clusters are best for non-production workloads, replicated 3+ node clusters are the gold standard, and replicated 2-node clusters strike a good balance.

## Enabling distributed mode in self-hosted Qdrant

To enable distributed deployment - enable the cluster mode in the [configuration](../configuration/) or using the ENV variable: `QDRANT__CLUSTER__ENABLED=true`.

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

After a successful synchronization you can observe the state of the cluster through the [REST API](https://qdrant.github.io/qdrant/redoc/index.html?v=master#tag/cluster):

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

## Enabling distributed mode in Qdrant Cloud

For best results, first ensure your cluster is running Qdrant v1.7.4 or higher. Older versions of Qdrant do support distributed mode, but improvements in v1.7.4 make distributed clusters more resilient during outages.

In the [Qdrant Cloud console](https://cloud.qdrant.io/), click "Scale Up" to increase your cluster size to >1. Qdrant Cloud configures the distributed mode settings automatically.

After the scale-up process completes, you will have a new empty node running alongside your existing node(s). To replicate data into this new empty node, see the next section.

## Making use of a new distributed Qdrant cluster

When you enable distributed mode and scale up to two or more nodes, your data does not move to the new node automatically; it starts out empty. To make use of your new empty node, do one of the following:

* Replicate your existing data to the new node by [creating new shard replicas](#creating-new-shard-replicas)
* Create a new replicated collection by setting the [replication_factor](#replication-factor) to 2 or more (can only be set at creation time)
* Move data (without replicating it) onto the new node by [moving shards](#moving-shards)

## Raft

Qdrant uses the [Raft](https://raft.github.io/) consensus protocol to maintain consistency regarding the cluster topology and the collections structure.

Operations on points, on the other hand, do not go through the consensus infrastructure.
Qdrant is not intended to have strong transaction guarantees, which allows it to perform point operations with low overhead.
In practice, it means that Qdrant does not guarantee atomic distributed updates but allows you to wait until the [operation is complete](../../concepts/points/#awaiting-result) to see the results of your writes.

Operations on collections, on the contrary, are part of the consensus which guarantees that all operations are durable and eventually executed by all nodes.
In practice it means that a majority of nodes agree on what operations should be applied before the service will perform them.

Practically, it means that if the cluster is in a transition state - either electing a new leader after a failure or starting up, the collection update operations will be denied.

You may use the cluster [REST API](https://qdrant.github.io/qdrant/redoc/index.html?v=master#tag/cluster) to check the state of the consensus.

## Sharding

A Collection in Qdrant is made of one or more shards.
A shard is an independent store of points which is able to perform all operations provided by collections.
There are two methods of distributing points across shards:

- **Automatic sharding**: Points are distributed among shards by using a [consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) algorithm, so that shards are managing non-intersecting subsets of points. This is the default behavior.

- **User-defined sharding**: _Available as of v1.7.0_ - Each point is uploaded to a specific shard, so that operations can hit only the shard or shards they need. Even with this distribution, shards still ensure having non-intersecting subsets of points. [See more...](#user-defined-sharding)

Each node knows where all parts of the collection are stored through the [consensus protocol](./#raft), so when you send a search request to one Qdrant node, it automatically queries all other nodes to obtain the full search result.

When you create a collection, Qdrant splits the collection into `shard_number` shards. If left unset, `shard_number` is set to the number of nodes in your cluster:

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    },
    "shard_number": 6
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=300, distance=models.Distance.COSINE),
    shard_number=6,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    vectors: {
        size: 300,
        distance: "Cosine",
    },
    shard_number: 6,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{vectors_config::Config, CreateCollection, Distance, VectorParams, VectorsConfig},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".into(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 300,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        shard_number: Some(6),
    })
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(300)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setShardNumber(6)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 300, Distance = Distance.Cosine },
	shardNumber: 6
);
```

We recommend setting the number of shards to be a multiple of the number of nodes you are currently running in your cluster.

For example, if you have 3 nodes, 6 shards could be a good option.

Shards are evenly distributed across all existing nodes when a collection is first created, but Qdrant does not automatically rebalance shards if your cluster size or replication factor changes (since this is an expensive operation on large clusters). See the next section for how to move shards after scaling operations.

### Moving shards

*Available as of v0.9.0*

Qdrant allows moving shards between nodes in the cluster and removing nodes from the cluster. This functionality unlocks the ability to dynamically scale the cluster size without downtime. It also allows you to upgrade or migrate nodes without downtime.

Qdrant provides the information regarding the current shard distribution in the cluster with the [Collection Cluster info API](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/collection_cluster_info).

Use the [Update collection cluster setup API](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/update_collection_cluster) to initiate the shard transfer:

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

In case you want to downscale the cluster, you can move all shards away from a peer and then remove the peer using the [remove peer API](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/remove_peer).

```http
DELETE /cluster/peer/{peer_id}
```

After that, Qdrant will exclude the node from the consensus, and the instance will be ready for shutdown.

### User-defined sharding

*Available as of v1.7.0*

Qdrant allows you to specify the shard for each point individually. This feature is useful if you want to control the shard placement of your data, so that operations can hit only the subset of shards they actually need. In big clusters, this can significantly improve the performance of operations that do not require the whole collection to be scanned.

A clear use-case for this feature is managing a multi-tenant collection, where each tenant (let it be a user or organization) is assumed to be segregated, so they can have their data stored in separate shards.

To enable user-defined sharding, set `sharding_method` to `custom` during collection creation:

```http
PUT /collections/{collection_name}
{
    "shard_number": 1,
    "sharding_method": "custom"
    // ... other collection parameters
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    shard_number=1,
    sharding_method=models.ShardingMethod.CUSTOM,
    # ... other collection parameters
)
client.create_shard_key("{collection_name}", "user_1")
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    shard_number: 1,
    sharding_method: "custom",
    // ... other collection parameters
});
```

```rust

use qdrant_client::{
    client::QdrantClient,
    qdrant::{CreateCollection, ShardingMethod},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".into(),
        shard_number: Some(1),
        sharding_method: Some(ShardingMethod::Custom),
        // ... other collection parameters
        ..Default::default()
    })
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.ShardingMethod;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            // ... other collection parameters
            .setShardNumber(1)
            .setShardingMethod(ShardingMethod.Custom)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	// ... other collection parameters
	shardNumber: 1,
	shardingMethod: ShardingMethod.Custom
);
```

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

To specify the shard for each point, you need to provide the `shard_key` field in the upsert request:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1111,
            "vector": [0.1, 0.2, 0.3]
        },
    ]
    "shard_key": "user_1"
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1111,
            vector=[0.1, 0.2, 0.3],
        ),
    ],
    shard_key_selector="user_1",
)
```

```typescript

client.upsertPoints("{collection_name}", {
    points: [
        {
            id: 1111,
            vector: [0.1, 0.2, 0.3],
        },
    ],
    shard_key: "user_1",
});
```

```rust

use qdrant_client::qdrant::{PointStruct, WriteOrdering, WriteOrderingType};

client
    .upsert_points_blocking(
        "{collection_name}",
        Some(vec![shard_key::Key::String("user_1".into())]),
        vec![
            PointStruct::new(
                1111,
                vec![0.1, 0.2, 0.3],
                Default::default(),
            ),
        ],
        None,
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ShardKeySelectorFactory.shardKeySelector;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.UpsertPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .upsertAsync(
        UpsertPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllPoints(
                List.of(
                    PointStruct.newBuilder()
                        .setId(id(111))
                        .setVectors(vectors(0.1f, 0.2f, 0.3f))
                        .build()))
            .setShardKeySelector(shardKeySelector("user_1"))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
	collectionName: "{collection_name}",
	points: new List<PointStruct>
	{
		new() { Id = 111, Vectors = new[] { 0.1f, 0.2f, 0.3f } }
	},
	shardKeySelector: new ShardKeySelector { ShardKeys = { new List<ShardKey> { "user_id" } } }
);
```

<aside role="alert">
Using the same point ID across multiple shard keys is <strong>not supported<sup>*</sup></strong> and should be avoided.
</aside>
<sup>
<strong>*</strong> When using custom sharding, IDs are only enforced to be unique within a shard key. This means that you can have multiple points with the same ID, if they have different shard keys.
This is a limitation of the current implementation, and is an anti-pattern that should be avoided because it can create scenarios of points with the same ID to have different contents. In the future, we plan to add a global ID uniqueness check.
</sup>

Now you can target the operations to specific shard(s) by specifying the `shard_key` on any operation you do. Operations that do not specify the shard key will be executed on __all__ shards.

Another use-case would be to have shards that track the data chronologically, so that you can do more complex itineraries like uploading live data in one shard and archiving it once a certain age has passed.

<img src="/docs/sharding-per-day.png" alt="Sharding per day" width="500" height="600">

### Shard transfer method

*Available as of v1.7.0*

There are different methods for transferring, such as moving or replicating, a
shard to another node. Depending on what performance and guarantees you'd like
to have and how you'd like to manage your cluster, you likely want to choose a
specific method. Each method has its own pros and cons. Which is fastest depends
on the size and state of a shard.

Available shard transfer methods are:

- `stream_records`: _(default)_ transfer shard by streaming just its records to the target node in batches.
- `snapshot`: transfer shard including its index and quantized data by utilizing a [snapshot](../../concepts/snapshots/) automatically.

Each has pros, cons and specific requirements, which are:

| Method: | Stream records | Snapshot |
|:---|:---|:---|
| **Connection** | <ul><li>Requires internal gRPC API <small>(port 6335)</small></li></ul> | <ul><li>Requires internal gRPC API <small>(port 6335)</small></li><li>Requires REST API <small>(port 6333)</small></li></ul> |
| **HNSW index** | <ul><li>Doesn't transfer index</li><li>Will reindex on target node</li></ul> | <ul><li>Index is transferred with a snapshot</li><li>Immediately ready on target node</li></ul> |
| **Quantization** | <ul><li>Doesn't transfer quantized data</li><li>Will re-quantize on target node</li></ul> | <ul><li>Quantized data is transferred with a snapshot</li><li>Immediately ready on target node</li></ul> |
| **Ordering** | <ul><li>Unordered updates on target node[^unordered]</li></ul> | <ul><li>Ordered updates on target node[^ordered]</li></ul> |
| **Disk space** | <ul><li>No extra disk space required</li></ul> | <ul><li>Extra disk space required for snapshot on both nodes</li></ul> |

[^unordered]: Weak ordering for updates: All records are streamed to the target node in order.
    New updates are received on the target node in parallel, while the transfer
    of records is still happening. We therefore have `weak` ordering, regardless
    of what [ordering](#write-ordering) is used for updates.
[^ordered]: Strong ordering for updates: A snapshot of the shard
    is created, it is transferred and recovered on the target node. That ensures
    the state of the shard is kept consistent. New updates are queued on the
    source node, and transferred in order to the target node. Updates therefore
    have the same [ordering](#write-ordering) as the user selects, making
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

The `snapshot` transfer method utilizes [snapshots](../../concepts/snapshots/)
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

The `stream_records` method is currently used as default. This may change in the
future.

## Replication

*Available as of v0.11.0*

Qdrant allows you to replicate shards between nodes in the cluster.

Shard replication increases the reliability of the cluster by keeping several copies of a shard spread across the cluster.
This ensures the availability of the data in case of node failures, except if all replicas are lost.

### Replication factor

When you create a collection, you can control how many shard replicas you'd like to store by changing the `replication_factor`. By default, `replication_factor` is set to "1", meaning no additional copy is maintained automatically. You can change that by setting the `replication_factor` when you create a collection.

Currently, the replication factor of a collection can only be configured at creation time.

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 300,
        "distance": "Cosine"
    },
    "shard_number": 6,
    "replication_factor": 2,
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=300, distance=models.Distance.COSINE),
    shard_number=6,
    replication_factor=2,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 300,
    distance: "Cosine",
  },
  shard_number: 6,
  replication_factor: 2,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{vectors_config::Config, CreateCollection, Distance, VectorParams, VectorsConfig},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".into(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 300,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        shard_number: Some(6),
        replication_factor: Some(2),
        ..Default::default()
    })
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(300)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setShardNumber(6)
            .setReplicationFactor(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 300, Distance = Distance.Cosine },
	shardNumber: 6,
	replicationFactor: 2
);
```

This code sample creates a collection with a total of 6 logical shards backed by a total of 12 physical shards.

Since a replication factor of "2" would require twice as much storage space, it is advised to make sure the hardware can host the additional shard replicas beforehand.

### Creating new shard replicas

It is possible to create or delete replicas manually on an existing collection using the [Update collection cluster setup API](https://qdrant.github.io/qdrant/redoc/index.html?v=v0.11.0#tag/cluster/operation/update_collection_cluster).

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

### Error handling

Replicas can be in different states:

- Active: healthy and ready to serve traffic
- Dead: unhealthy and not ready to serve traffic
- Partial: currently under resynchronization before activation

A replica is marked as dead if it does not respond to internal healthchecks or if it fails to serve traffic.

A dead replica will not receive traffic from other peers and might require a manual intervention if it does not recover automatically.

This mechanism ensures data consistency and availability if a subset of the replicas fail during an update operation.

### Node Failure Recovery

Sometimes hardware malfunctions might render some nodes of the Qdrant cluster unrecoverable.
No system is immune to this.

But several recovery scenarios allow qdrant to stay available for requests and even avoid performance degradation.
Let's walk through them from best to worst.

**Recover with replicated collection**

If the number of failed nodes is less than the replication factor of the collection, then your cluster should still be able to perform read, search and update queries.

Now, if the failed node restarts, consensus will trigger the replication process to update the recovering node with the newest updates it has missed.

If the failed node never restarts, you can recover the lost shards if you have a 3+ node cluster. You cannot recover lost shards in smaller clusters because recovery operations go through [raft](#raft) which requires >50% of the nodes to be healthy.

**Recreate node with replicated collections**

If a node fails and it is impossible to recover it, you should exclude the dead node from the consensus and create an empty node.

To exclude failed nodes from the consensus, use [remove peer](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/remove_peer) API.
Apply the `force` flag if necessary.

When you create a new node, make sure to attach it to the existing cluster by specifying `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.

Once the new node is ready and synchronized with the cluster, you might want to ensure that the collection shards are replicated enough. Remember that Qdrant will not automatically balance shards since this is an expensive operation.
Use the [Replicate Shard Operation](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/update_collection_cluster) to create another copy of the shard on the newly connected node.

It's worth mentioning that Qdrant only provides the necessary building blocks to create an automated failure recovery.
Building a completely automatic process of collection scaling would require control over the cluster machines themself.
Check out our [cloud solution](https://qdrant.to/cloud), where we made exactly that.


**Recover from snapshot**

If there are no copies of data in the cluster, it is still possible to recover from a snapshot.

Follow the same steps to detach failed node and create a new one in the cluster:

* To exclude failed nodes from the consensus, use [remove peer](https://qdrant.github.io/qdrant/redoc/index.html#tag/cluster/operation/remove_peer) API. Apply the `force` flag if necessary.
* Create a new node, making sure to attach it to the existing cluster by specifying the `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.

Snapshot recovery, used in single-node deployment, is different from cluster one.
Consensus manages all metadata about all collections and does not require snapshots to recover it.
But you can use snapshots to recover missing shards of the collections.

Use the [Collection Snapshot Recovery API](../../concepts/snapshots/#recover-in-cluster-deployment) to do it.
The service will download the specified snapshot of the collection and recover shards with data from it.

Once all shards of the collection are recovered, the collection will become operational again.

### Temporary node failure

If properly configured, running Qdrant in distributed mode can make your cluster resistant to outages when one node fails temporarily.

Here is how differently-configured Qdrant clusters respond:

* 1-node clusters: All operations time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
* 2-node clusters where shards ARE NOT replicated: All operations will time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
* 2-node clusters where all shards ARE replicated to both nodes: All requests except for operations on collections continue to work during the outage.
* 3+-node clusters where all shards are replicated to at least 2 nodes: All requests continue to work during the outage.

## Consistency guarantees

By default, Qdrant focuses on availability and maximum throughput of search operations.
For the majority of use cases, this is a preferable trade-off.

During the normal state of operation, it is possible to search and modify data from any peers in the cluster.

Before responding to the client, the peer handling the request dispatches all operations according to the current topology in order to keep the data synchronized across the cluster.

- reads are using a partial fan-out strategy to optimize latency and availability
- writes are executed in parallel on all active sharded replicas

![Embeddings](/docs/concurrent-operations-replicas.png)

However, in some cases, it is necessary to ensure additional guarantees during possible hardware instabilities, mass concurrent updates of same documents, etc.

Qdrant provides a few options to control consistency guarantees:

- `write_consistency_factor` - defines the number of replicas that must acknowledge a write operation before responding to the client. Increasing this value will make write operations tolerant to network partitions in the cluster, but will require a higher number of replicas to be active to perform write operations.
- Read `consistency` param, can be used with search and retrieve operations to ensure that the results obtained from all replicas are the same. If this option is used, Qdrant will perform the read operation on multiple replicas and resolve the result according to the selected strategy. This option is useful to avoid data inconsistency in case of concurrent updates of the same documents. This options is preferred if the update operations are frequent and the number of replicas is low.
- Write `ordering` param, can be used with update and delete operations to ensure that the operations are executed in the same order on all replicas. If this option is used, Qdrant will route the operation to the leader replica of the shard and wait for the response before responding to the client. This option is useful to avoid data inconsistency in case of concurrent updates of the same documents. This options is preferred if read operations are more frequent than update and if search performance is critical.


### Write consistency factor

The `write_consistency_factor` represents the number of replicas that must acknowledge a write operation before responding to the client. It is set to one by default.
It can be configured at the collection's creation time.

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 300,
        "distance": "Cosine"
    },
    "shard_number": 6,
    "replication_factor": 2,
    "write_consistency_factor": 2,
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=300, distance=models.Distance.COSINE),
    shard_number=6,
    replication_factor=2,
    write_consistency_factor=2,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 300,
    distance: "Cosine",
  },
  shard_number: 6,
  replication_factor: 2,
  write_consistency_factor: 2,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{vectors_config::Config, CreateCollection, Distance, VectorParams, VectorsConfig},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".into(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 300,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        shard_number: Some(6),
        replication_factor: Some(2),
        write_consistency_factor: Some(2),
        ..Default::default()
    })
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(300)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setShardNumber(6)
            .setReplicationFactor(2)
            .setWriteConsistencyFactor(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 300, Distance = Distance.Cosine },
	shardNumber: 6,
	replicationFactor: 2,
	writeConsistencyFactor: 2
);
```

Write operations will fail if the number of active replicas is less than the `write_consistency_factor`.

### Read consistency

Read `consistency` can be specified for most read requests and will ensure that the returned result
is consistent across cluster nodes.

- `all` will query all nodes and return points, which present on all of them
- `majority` will query all nodes and return points, which present on the majority of them
- `quorum` will query randomly selected majority of nodes and return points, which present on all of them
- `1`/`2`/`3`/etc - will query specified number of randomly selected nodes and return points which present on all of them
- default `consistency` is `1`

```http
POST /collections/{collection_name}/points/search?consistency=majority
{
    "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "value": "London"
                }
            }
        ]
    },
    "params": {
        "hnsw_ef": 128,
        "exact": false
    },
    "vector": [0.2, 0.1, 0.9, 0.7],
    "limit": 3
}
```

```python
client.search(
    collection_name="{collection_name}",
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="city",
                match=models.MatchValue(
                    value="London",
                ),
            )
        ]
    ),
    search_params=models.SearchParams(hnsw_ef=128, exact=False),
    query_vector=[0.2, 0.1, 0.9, 0.7],
    limit=3,
    consistency="majority",
)
```

```typescript
client.search("{collection_name}", {
  filter: {
    must: [{ key: "city", match: { value: "London" } }],
  },
  params: {
    hnsw_ef: 128,
    exact: false,
  },
  vector: [0.2, 0.1, 0.9, 0.7],
  limit: 3,
  consistency: "majority",
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        read_consistency::Value, Condition, Filter, ReadConsistency, ReadConsistencyType,
        SearchParams, SearchPoints,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".into(),
        filter: Some(Filter::must([Condition::matches(
            "city",
            "London".into(),
        )])),
        params: Some(SearchParams {
            hnsw_ef: Some(128),
            exact: Some(false),
            ..Default::default()
        }),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        limit: 3,
        read_consistency: Some(ReadConsistency {
            value: Some(Value::Type(ReadConsistencyType::Majority.into())),
        }),
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ReadConsistency;
import io.qdrant.client.grpc.Points.ReadConsistencyType;
import io.qdrant.client.grpc.Points.SearchParams;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")).build())
            .setParams(SearchParams.newBuilder().setHnswEf(128).setExact(true).build())
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setLimit(3)
            .setReadConsistency(
                ReadConsistency.newBuilder().setType(ReadConsistencyType.Majority).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	filter: MatchKeyword("city", "London"),
	searchParams: new SearchParams { HnswEf = 128, Exact = true },
	limit: 3,
	readConsistency: new ReadConsistency { Type = ReadConsistencyType.Majority }
);
```

### Write ordering

Write `ordering` can be specified for any write request to serialize it through a single "leader" node,
which ensures that all write operations (issued with the same `ordering`) are performed and observed
sequentially.

- `weak` _(default)_ ordering does not provide any additional guarantees, so write operations can be freely reordered.
- `medium` ordering serializes all write operations through a dynamically elected leader, which might cause minor inconsistencies in case of leader change.
- `strong` ordering serializes all write operations through the permanent leader, which provides strong consistency, but write operations may be unavailable if the leader is down.

```http
PUT /collections/{collection_name}/points?ordering=strong
{
    "batch": {
        "ids": [1, 2, 3],
        "payloads": [
            {"color": "red"},
            {"color": "green"},
            {"color": "blue"}
        ],
        "vectors": [
            [0.9, 0.1, 0.1],
            [0.1, 0.9, 0.1],
            [0.1, 0.1, 0.9]
        ]
    }
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=models.Batch(
        ids=[1, 2, 3],
        payloads=[
            {"color": "red"},
            {"color": "green"},
            {"color": "blue"},
        ],
        vectors=[
            [0.9, 0.1, 0.1],
            [0.1, 0.9, 0.1],
            [0.1, 0.1, 0.9],
        ],
    ),
    ordering=models.WriteOrdering.STRONG,
)
```

```typescript
client.upsert("{collection_name}", {
  batch: {
    ids: [1, 2, 3],
    payloads: [{ color: "red" }, { color: "green" }, { color: "blue" }],
    vectors: [
      [0.9, 0.1, 0.1],
      [0.1, 0.9, 0.1],
      [0.1, 0.1, 0.9],
    ],
  },
  ordering: "strong",
});
```

```rust
use qdrant_client::qdrant::{PointStruct, WriteOrdering, WriteOrderingType};
use serde_json::json;

client
    .upsert_points_blocking(
        "{collection_name}",
        None,
        vec![
            PointStruct::new(
                1,
                vec![0.9, 0.1, 0.1],
                json!({
                    "color": "red"
                })
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                2,
                vec![0.1, 0.9, 0.1],
                json!({
                    "color": "green"
                })
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                3,
                vec![0.1, 0.1, 0.9],
                json!({
                    "color": "blue"
                })
                .try_into()
                .unwrap(),
            ),
        ],
        Some(WriteOrdering {
            r#type: WriteOrderingType::Strong.into(),
        }),
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.UpsertPoints;
import io.qdrant.client.grpc.Points.WriteOrdering;
import io.qdrant.client.grpc.Points.WriteOrderingType;

client
    .upsertAsync(
        UpsertPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllPoints(
                List.of(
                    PointStruct.newBuilder()
                        .setId(id(1))
                        .setVectors(vectors(0.9f, 0.1f, 0.1f))
                        .putAllPayload(Map.of("color", value("red")))
                        .build(),
                    PointStruct.newBuilder()
                        .setId(id(2))
                        .setVectors(vectors(0.1f, 0.9f, 0.1f))
                        .putAllPayload(Map.of("color", value("green")))
                        .build(),
                    PointStruct.newBuilder()
                        .setId(id(3))
                        .setVectors(vectors(0.1f, 0.1f, 0.94f))
                        .putAllPayload(Map.of("color", value("blue")))
                        .build()))
            .setOrdering(WriteOrdering.newBuilder().setType(WriteOrderingType.Strong).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
	collectionName: "{collection_name}",
	points: new List<PointStruct>
	{
		new()
		{
			Id = 1,
			Vectors = new[] { 0.9f, 0.1f, 0.1f },
			Payload = { ["city"] = "red" }
		},
		new()
		{
			Id = 2,
			Vectors = new[] { 0.1f, 0.9f, 0.1f },
			Payload = { ["city"] = "green" }
		},
		new()
		{
			Id = 3,
			Vectors = new[] { 0.1f, 0.1f, 0.9f },
			Payload = { ["city"] = "blue" }
		}
	},
	ordering: WriteOrderingType.Strong
);
```

## Listener mode

<aside role="alert">This is an experimental feature, its behavior may change in the future.</aside>

In some cases it might be useful to have a Qdrant node that only accumulates data and does not participate in search operations.
There are several scenarios where this can be useful:

- Listener option can be used to store data in a separate node, which can be used for backup purposes or to store data for a long time.
- Listener node can be used to syncronize data into another region, while still performing search operations in the local region.


To enable listener mode, set `node_type` to `Listener` in the config file:


```yaml
storage:
  node_type: "Listener"
```

Listener node will not participate in search operations, but will still accept write operations and will store the data in the local storage.

All shards, stored on the listener node, will be converted to the `Listener` state.

Additionally, all write requests sent to the listener node will be processed with `wait=false` option, which means that the write oprations will be considered successful once they are written to WAL.
This mechanism should allow to minimize upsert latency in case of parallel snapshotting.

## Consensus Checkpointing

Consensus checkpointing is a technique used in Raft to improve performance and simplify log management by periodically creating a consistent snapshot of the system state.
This snapshot represents a point in time where all nodes in the cluster have reached agreement on the state, and it can be used to truncate the log, reducing the amount of data that needs to be stored and transferred between nodes.

For example, if you attach a new node to the cluster, it should replay all the log entries to catch up with the current state.
In long-running clusters, this can take a long time, and the log can grow very large.

To prevent this, one can use a special checkpointing mechanism, that will truncate the log and create a snapshot of the current state.

To use this feature, simply call the `/cluster/recover` API on required node:

```http
POST /cluster/recover
```

This API can be triggered on any non-leader node, it will send a request to the current consensus leader to create a snapshot. The leader will in turn send the snapshot back to the requesting node for application.

In some cases, this API can be used to recover from an inconsistent cluster state by forcing a snapshot creation.
