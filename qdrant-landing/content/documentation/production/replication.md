---
title: Replication
weight: 2
---

# Replication

Qdrant allows you to replicate shards between nodes in the cluster.

Shard replication increases the reliability of the cluster by keeping several copies of a shard spread across the cluster.
This ensures the availability of the data in case of node failures, except if all replicas are lost.

## Replication factor

When you create a collection, you can control how many shard replicas you'd like to store by changing the `replication_factor`. By default, `replication_factor` is set to "1", meaning no additional copy is maintained automatically. The default can be changed in the [Qdrant configuration](/documentation/guides/configuration/#configuration-options). You can change that by setting the `replication_factor` when you create a collection.

The `replication_factor` can be updated for an existing collection, but the effect of this depends on how you're running Qdrant. If you're hosting the open source version of Qdrant yourself, changing the replication factor after collection creation doesn't do anything. You can manually [create](#creating-new-shard-replicas) or drop shard replicas to achieve your desired replication factor. In Qdrant Cloud (including Hybrid Cloud, Private Cloud) your shards will automatically be replicated or dropped to match your configured replication factor.

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 300,
        "distance": "Cosine"
    },
    "shard_number": 6,
    "replication_factor": 2
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
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
            .shard_number(6)
            .replication_factor(2),
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
	ShardNumber:       qdrant.PtrOf(uint32(6)),
	ReplicationFactor: qdrant.PtrOf(uint32(2)),
})
```

This code sample creates a collection with a total of 6 logical shards backed by a total of 12 physical shards.

Since a replication factor of "2" would require twice as much storage space, it is advised to make sure the hardware can host the additional shard replicas beforehand.

## Creating new shard replicas

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

<aside role="status">You likely want to select a specific <a href="/documentation/guides/sharding/#shard-transfer-method">shard transfer method</a> to get desired performance and guarantees.</aside>

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

## Error handling

Replicas can be in different states:

- Active: healthy and ready to serve traffic
- Dead: unhealthy and not ready to serve traffic
- Partial: currently under resynchronization before activation

A replica is marked as dead if it does not respond to internal healthchecks or if it fails to serve traffic.

A dead replica will not receive traffic from other peers and might require a manual intervention if it does not recover automatically.

This mechanism ensures data consistency and availability if a subset of the replicas fail during an update operation.

## Node Failure Recovery

Sometimes hardware malfunctions might render some nodes of the Qdrant cluster unrecoverable.
No system is immune to this.

But several recovery scenarios allow qdrant to stay available for requests and even avoid performance degradation.
Let's walk through them from best to worst.

**Recover with replicated collection**

If the number of failed nodes is less than the replication factor of the collection, then your cluster should still be able to perform read, search and update queries.

Now, if the failed node restarts, consensus will trigger the replication process to update the recovering node with the newest updates it has missed.

If the failed node never restarts, you can recover the lost shards if you have a 3+ node cluster. You cannot recover lost shards in smaller clusters because recovery operations go through [Raft](/documentation/guides/distributed-deployment/#raft-overview) which requires >50% of the nodes to be healthy.

**Recreate node with replicated collections**

If a node fails and it is impossible to recover it, you should exclude the dead node from the consensus and create an empty node.

To exclude failed nodes from the consensus, use [remove peer](https://api.qdrant.tech/master/api-reference/distributed/remove-peer) API.
Apply the `force` flag if necessary.

When you create a new node, make sure to attach it to the existing cluster by specifying `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.

Once the new node is ready and synchronized with the cluster, you might want to ensure that the collection shards are replicated enough. Remember that Qdrant will not automatically balance shards since this is an expensive operation.
Use the [Replicate Shard Operation](https://api.qdrant.tech/master/api-reference/distributed/update-collection-cluster) to create another copy of the shard on the newly connected node.

It's worth mentioning that Qdrant only provides the necessary building blocks to create an automated failure recovery.
Building a completely automatic process of collection scaling would require control over the cluster machines themself.
Check out our [cloud solution](https://qdrant.to/cloud), where we made exactly that.


**Recover from snapshot**

If there are no copies of data in the cluster, it is still possible to recover from a snapshot.

Follow the same steps to detach failed node and create a new one in the cluster:

* To exclude failed nodes from the consensus, use [remove peer](https://api.qdrant.tech/master/api-reference/distributed/remove-peer) API. Apply the `force` flag if necessary.
* Create a new node, making sure to attach it to the existing cluster by specifying the `--bootstrap` CLI parameter with the URL of any of the running cluster nodes.

Snapshot recovery, used in single-node deployment, is different from cluster one.
Consensus manages all metadata about all collections and does not require snapshots to recover it.
But you can use snapshots to recover missing shards of the collections.

Use the [Collection Snapshot Recovery API](/documentation/concepts/snapshots/#recover-in-cluster-deployment) to do it.
The service will download the specified snapshot of the collection and recover shards with data from it.

Once all shards of the collection are recovered, the collection will become operational again.

## Temporary node failure

If properly configured, running Qdrant in distributed mode can make your cluster resistant to outages when one node fails temporarily.

Here is how differently-configured Qdrant clusters respond:

* 1-node clusters: All operations time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
* 2-node clusters where shards ARE NOT replicated: All operations will time out or fail for up to a few minutes. It depends on how long it takes to restart and load data from disk.
* 2-node clusters where all shards ARE replicated to both nodes: All requests except for operations on collections continue to work during the outage.
* 3+-node clusters where all shards are replicated to at least 2 nodes: All requests continue to work during the outage. 