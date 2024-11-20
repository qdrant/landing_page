---
title: Consistency
weight: 5
---
# Consistency guarantees

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
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
            .shard_number(6)
            .replication_factor(2)
            .write_consistency_factor(2),
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
    ShardNumber:            qdrant.PtrOf(uint32(6)),
    ReplicationFactor:      qdrant.PtrOf(uint32(2)),
    WriteConsistencyFactor: qdrant.PtrOf(uint32(2)),
})
```

Write operations will fail if the number of active replicas is less than the `write_consistency_factor`.

The configuration of the `write_consistency_factor` is important for adjusting the cluster's behavior when some nodes go offline due to restarts, upgrades, or failures.

By default, the cluster continues to accept updates as long as at least one replica of each shard is online. However, this behavior means that once an offline replica is restored, it will require additional synchronization with the rest of the cluster. In some cases, this synchronization can be resource-intensive and undesirable.

Setting the `write_consistency_factor` to match the replication factor modifies the cluster's behavior so that unreplicated updates are rejected, preventing the need for extra synchronization.

If the update is applied to enough replicas - according to the `write_consistency_factor` - the update will return a successful status. Any replicas that failed to apply the update will be temporarily disabled and are automatically recovered to keep data consistency. If the update could not be applied to enough replicas, it'll return an error and may be partially applied. The user must submit the operation again to ensure data consistency.

For asynchronous updates and injection pipelines capable of handling errors and retries, this strategy might be preferable.


### Read consistency

Read `consistency` can be specified for most read requests and will ensure that the returned result
is consistent across cluster nodes.

- `all` will query all nodes and return points, which present on all of them
- `majority` will query all nodes and return points, which present on the majority of them
- `quorum` will query randomly selected majority of nodes and return points, which present on all of them
- `1`/`2`/`3`/etc - will query specified number of randomly selected nodes and return points which present on all of them
- default `consistency` is `1`

```http
POST /collections/{collection_name}/points/query?consistency=majority
{
    "query": [0.2, 0.1, 0.9, 0.7],
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
    "limit": 3
}
```

```python
client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7],
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
    limit=3,
    consistency="majority",
)
```

```typescript
client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7],
    filter: {
        must: [{ key: "city", match: { value: "London" } }],
    },
    params: {
        hnsw_ef: 128,
        exact: false,
    },
    limit: 3,
    consistency: "majority",
});
```

```rust
use qdrant_client::qdrant::{
    read_consistency::Value, Condition, Filter, QueryPointsBuilder, ReadConsistencyType,
    SearchParamsBuilder,
};
use qdrant_client::{Qdrant, QdrantError};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .filter(Filter::must([Condition::matches(
                "city",
                "London".to_string(),
            )]))
            .params(SearchParamsBuilder::default().hnsw_ef(128).exact(false))
            .read_consistency(Value::Type(ReadConsistencyType::Majority.into())),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ReadConsistency;
import io.qdrant.client.grpc.Points.ReadConsistencyType;
import io.qdrant.client.grpc.Points.SearchParams;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ConditionFactory.matchKeyword;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")).build())
                .setQuery(nearest(.2f, 0.1f, 0.9f, 0.7f))
                .setParams(SearchParams.newBuilder().setHnswEf(128).setExact(false).build())
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

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
    filter: MatchKeyword("city", "London"),
    searchParams: new SearchParams { HnswEf = 128, Exact = false },
    limit: 3,
    readConsistency: new ReadConsistency { Type = ReadConsistencyType.Majority }
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

client.Query(context.Background(), &qdrant.QueryPoints{
    CollectionName: "{collection_name}",
    Query:          qdrant.NewQuery(0.2, 0.1, 0.9, 0.7),
    Filter: &qdrant.Filter{
        Must: []*qdrant.Condition{
            qdrant.NewMatch("city", "London"),
        },
    },
    Params: &qdrant.SearchParams{
        HnswEf: qdrant.PtrOf(uint64(128)),
    },
    Limit:           qdrant.PtrOf(uint64(3)),
    ReadConsistency: qdrant.NewReadConsistencyType(qdrant.ReadConsistencyType_Majority),
})
```

### Write ordering

Write `ordering` can be specified for any write request to serialize it through a single "leader" node,
which ensures that all write operations (issued with the same `ordering`) are performed and observed
sequentially.

- `weak` _(default)_ ordering does not provide any additional guarantees, so write operations can be freely reordered.
- `medium` ordering serializes all write operations through a dynamically elected leader, which might cause minor inconsistencies in case of leader change.
- `strong` ordering serializes all write operations through the permanent leader, which provides strong consistency, but write operations may be unavailable if the leader is down.

<aside role="status">Some <a href="#shard-transfer-method">shard transfer methods</a> may affect ordering guarantees.</aside>

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
use qdrant_client::qdrant::{
    PointStruct, UpsertPointsBuilder, WriteOrdering, WriteOrderingType
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![
                PointStruct::new(1, vec![0.9, 0.1, 0.1], [("color", "red".into())]),
                PointStruct::new(2, vec![0.1, 0.9, 0.1], [("color", "green".into())]),
                PointStruct::new(3, vec![0.1, 0.1, 0.9], [("color", "blue".into())]),
            ],
        )
        .ordering(WriteOrdering {
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
            Payload = { ["color"] = "red" }
        },
        new()
        {
            Id = 2,
            Vectors = new[] { 0.1f, 0.9f, 0.1f },
            Payload = { ["color"] = "green" }
        },
        new()
        {
            Id = 3,
            Vectors = new[] { 0.1f, 0.1f, 0.9f },
            Payload = { ["color"] = "blue" }
        }
    },
    ordering: WriteOrderingType.Strong
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
            Id:      qdrant.NewIDNum(1),
            Vectors: qdrant.NewVectors(0.9, 0.1, 0.1),
            Payload: qdrant.NewValueMap(map[string]any{"color": "red"}),
        },
        {
            Id:      qdrant.NewIDNum(2),
            Vectors: qdrant.NewVectors(0.1, 0.9, 0.1),
            Payload: qdrant.NewValueMap(map[string]any{"color": "green"}),
        },
        {
            Id:      qdrant.NewIDNum(3),
            Vectors: qdrant.NewVectors(0.1, 0.1, 0.9),
            Payload: qdrant.NewValueMap(map[string]any{"color": "blue"}),
        },
    },
    Ordering: &qdrant.WriteOrdering{
        Type: qdrant.WriteOrderingType_Strong,
    },
})
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
