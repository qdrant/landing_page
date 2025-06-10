---
title: Sharding
weight: 3
--- 

# Sharding

A Collection in Qdrant is made of one or more shards.
A shard is an independent store of points which is able to perform all operations provided by collections.
There are two methods of distributing points across shards:

- **Automatic sharding**: Points are distributed among shards by using a [consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) algorithm, so that shards are managing non-intersecting subsets of points. This is the default behavior.

- **User-defined sharding**: _Available as of v1.7.0_ - Each point is uploaded to a specific shard, so that operations can hit only the shard or shards they need. Even with this distribution, shards still ensure having non-intersecting subsets of points. [See more...](#user-defined-sharding)

Each node knows where all parts of the collection are stored through the [consensus protocol](/documentation/guides/distributed-deployment/#raft-overview), so when you send a search request to one Qdrant node, it automatically queries all other nodes to obtain the full search result.

## Choosing the right number of shards

When you create a collection, Qdrant splits the collection into `shard_number` shards. If left unset, `shard_number` is set to the number of nodes in your cluster when the collection was created. The `shard_number` cannot be changed without recreating the collection.

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
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
            .shard_number(6),
    )
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

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     300,
		Distance: qdrant.Distance_Cosine,
	}),
	ShardNumber: qdrant.PtrOf(uint32(6)),
})
```

To ensure all nodes in your cluster are evenly utilized, the number of shards must be a multiple of the number of nodes you are currently running in your cluster.

> Aside: Advanced use cases such as multitenancy may require an uneven distribution of shards. See [Multitenancy](/articles/multitenancy/).

We recommend creating at least 2 shards per node to allow future expansion without having to re-shard. [Resharding](#resharding) is possible when using our cloud offering, but should be avoided if hosting elsewhere as it would require creating a new collection.

If you anticipate a lot of growth, we recommend 12 shards since you can expand from 1 node up to 2, 3, 6, and 12 nodes without having to re-shard. Having more than 12 shards in a small cluster may not be worth the performance overhead.

Shards are evenly distributed across all existing nodes when a collection is first created, but Qdrant does not automatically rebalance shards if your cluster size or replication factor changes (since this is an expensive operation on large clusters). See the next section for how to move shards after scaling operations.

## Resharding

*Available as of v1.13.0 in Cloud*

Resharding allows you to change the number of shards in your existing collections if you're hosting with our [Cloud](/documentation/cloud-intro/) offering.

Resharding can change the number of shards both up and down, without having to recreate the collection from scratch.

Please refer to the [Resharding](/documentation/cloud/cluster-scaling/#resharding) section in our cloud documentation for more details.

## Moving shards

*Available as of v0.9.0*

Qdrant allows moving shards between nodes in the cluster and removing nodes from the cluster. This functionality unlocks the ability to dynamically scale the cluster size without downtime. It also allows you to upgrade or migrate nodes without downtime.

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

## User-defined sharding

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
client.create_shard_key("{collection_name}", "{shard_key}")
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    shard_number: 1,
    sharding_method: "custom",
    // ... other collection parameters
});

client.createShardKey("{collection_name}", {
    shard_key: "{shard_key}"
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateShardKeyBuilder, CreateShardKeyRequestBuilder, Distance,
    ShardingMethod, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
            .shard_number(1)
            .sharding_method(ShardingMethod::Custom.into()),
    )
    .await?;

client
    .create_shard_key(
        CreateShardKeyRequestBuilder::new("{collection_name}")
            .request(CreateShardKeyBuilder::default().shard_key("{shard_key".to_string())),
    )
    .await?;
```

```java
import static io.qdrant.client.ShardKeyFactory.shardKey;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.ShardingMethod;
import io.qdrant.client.grpc.Collections.CreateShardKey;
import io.qdrant.client.grpc.Collections.CreateShardKeyRequest;

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

client.createShardKeyAsync(CreateShardKeyRequest.newBuilder()
                .setCollectionName("{collection_name}")
                .setRequest(CreateShardKey.newBuilder()
                                .setShardKey(shardKey("{shard_key}"))
                                .build())
                .build()).get();
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

await client.CreateShardKeyAsync(
    "{collection_name}",
    new CreateShardKey { ShardKey = new ShardKey { Keyword = "{shard_key}", } }
    );
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	// ... other collection parameters
	ShardNumber:    qdrant.PtrOf(uint32(1)),
	ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
})

client.CreateShardKey(context.Background(), "{collection_name}", &qdrant.CreateShardKey{
	ShardKey: qdrant.NewShardKey("{shard_key}"),
})
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

For large cardinality keys, it is recommended to use [partition by payload](/documentation/guides/multiple-partitions/#partition-by-payload) instead.

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
client.upsert("{collection_name}", {
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
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                111,
                vec![0.1, 0.2, 0.3],
                Payload::default(),
            )],
        )
        .shard_key_selector("user_1".to_string()),
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
	shardKeySelector: new ShardKeySelector { ShardKeys = { new List<ShardKey> { "user_1" } } }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(111),
			Vectors: qdrant.NewVectors(0.1, 0.2, 0.3),
		},
	},
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{
			qdrant.NewShardKey("user_1"),
		},
	},
})
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

## Shard transfer method

*Available as of v1.7.0*

There are different methods for transferring a shard, such as moving or
replicating, to another node. Depending on what performance and guarantees you'd
like to have and how you'd like to manage your cluster, you likely want to
choose a specific method. Each method has its own pros and cons. Which is
fastest depends on the size and state of a shard.

Available shard transfer methods are:

- `stream_records`: _(default)_ transfer by streaming just its records to the target node in batches.
- `snapshot`: transfer including its index and quantized data by utilizing a [snapshot](/documentation/concepts/snapshots/) automatically.
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
    of what [ordering](/documentation/guides/consistency/#write-ordering) is used for updates.
[^ordered]: Strong ordering for updates: A snapshot of the shard
    is created, it is transferred and recovered on the target node. That ensures
    the state of the shard is kept consistent. New updates are queued on the
    source node, and transferred in order to the target node. Updates therefore
    have the same [ordering](/documentation/guides/consistency/#write-ordering) as the user selects, making
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

The `snapshot` transfer method utilizes [snapshots](/documentation/concepts/snapshots/)
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

[WAL]: /documentation/concepts/storage/#versioning 