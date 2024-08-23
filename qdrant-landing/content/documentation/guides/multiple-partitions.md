---
title: Multitenancy
weight: 12
aliases:
  - ../tutorials/multiple-partitions
  - /tutorials/multiple-partitions/
---
# Configure Multitenancy

**How many collections should you create?** In most cases, you should only use a single collection with payload-based partitioning. This approach is called multitenancy. It is efficient for most of users, but it requires additional configuration. This document will show you how to set it up.

**When should you create multiple collections?** When you have a limited number of users and you need isolation. This approach is flexible, but it may be more costly, since creating numerous collections may result in resource overhead. Also, you need to ensure that they do not affect each other in any way, including performance-wise. 

## Partition by payload

When an instance is shared between multiple users, you may need to partition vectors by user. This is done so that each user can only access their own vectors and can't see the vectors of other users.

> ### NOTE
>
> The key doesn't necessarily need to be named `group_id`. You can choose a name that best suits your data structure and naming conventions.

1. Add a `group_id` field to each vector in the collection.

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "payload": {"group_id": "user_1"},
            "vector": [0.9, 0.1, 0.1]
        },
        {
            "id": 2,
            "payload": {"group_id": "user_1"},
            "vector": [0.1, 0.9, 0.1]
        },
        {
            "id": 3,
            "payload": {"group_id": "user_2"},
            "vector": [0.1, 0.1, 0.9]
        },
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={"group_id": "user_1"},
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={"group_id": "user_1"},
            vector=[0.1, 0.9, 0.1],
        ),
        models.PointStruct(
            id=3,
            payload={"group_id": "user_2"},
            vector=[0.1, 0.1, 0.9],
        ),
    ],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: { group_id: "user_1" },
      vector: [0.9, 0.1, 0.1],
    },
    {
      id: 2,
      payload: { group_id: "user_1" },
      vector: [0.1, 0.9, 0.1],
    },
    {
      id: 3,
      payload: { group_id: "user_2" },
      vector: [0.1, 0.1, 0.9],
    },
  ],
});
```

```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "{collection_name}",
        vec![
            PointStruct::new(1, vec![0.9, 0.1, 0.1], [("group_id", "user_1".into())]),
            PointStruct::new(2, vec![0.1, 0.9, 0.1], [("group_id", "user_1".into())]),
            PointStruct::new(3, vec![0.1, 0.1, 0.9], [("group_id", "user_2".into())]),
        ],
    ))
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(vectors(0.9f, 0.1f, 0.1f))
                .putAllPayload(Map.of("group_id", value("user_1")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.1f, 0.9f, 0.1f))
                .putAllPayload(Map.of("group_id", value("user_1")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(3))
                .setVectors(vectors(0.1f, 0.1f, 0.9f))
                .putAllPayload(Map.of("group_id", value("user_2")))
                .build()))
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
			Payload = { ["group_id"] = "user_1" }
		},
		new()
		{
			Id = 2,
			Vectors = new[] { 0.1f, 0.9f, 0.1f },
			Payload = { ["group_id"] = "user_1" }
		},
		new()
		{
			Id = 3,
			Vectors = new[] { 0.1f, 0.1f, 0.9f },
			Payload = { ["group_id"] = "user_2" }
		}
	}
);
```

2. Use a filter along with `group_id` to filter vectors for each user.

```http
POST /collections/{collection_name}/points/query
{
    "query": [0.1, 0.1, 0.9],
    "filter": {
        "must": [
            {
                "key": "group_id",
                "match": {
                    "value": "user_1"
                }
            }
        ]
    },
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query=[0.1, 0.1, 0.9],
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="group_id",
                match=models.MatchValue(
                    value="user_1",
                ),
            )
        ]
    ),
    limit=10,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: [0.1, 0.1, 0.9],
    filter: {
        must: [{ key: "group_id", match: { value: "user_1" } }],
    },
    limit: 10,
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.1, 0.1, 0.9])
            .limit(10)
            .filter(Filter::must([Condition::matches(
                "group_id",
                "user_1".to_string(),
            )])),
    )
    .await?;
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ConditionFactory.matchKeyword;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setFilter(
                        Filter.newBuilder().addMust(matchKeyword("group_id", "user_1")).build())
                .setQuery(nearest(0.1f, 0.1f, 0.9f))
                .setLimit(10)
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
	query: new float[] { 0.1f, 0.1f, 0.9f },
	filter: MatchKeyword("group_id", "user_1"),
	limit: 10
);
```

## Calibrate performance

The speed of indexation may become a bottleneck in this case, as each user's vector will be indexed into the same collection. To avoid this bottleneck, consider _bypassing the construction of a global vector index_ for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

To implement this approach, you should:

1. Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
2. Set `m` in hnsw config to 0. This will disable building global index for the whole collection.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {
        "payload_m": 16,
        "m": 0
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        payload_m=16,
        m=0,
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  hnsw_config: {
    payload_m: 16,
    m: 0,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .hnsw_config(HnswConfigDiffBuilder::default().payload_m(16).m(0)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
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
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setPayloadM(16).setM(0).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	hnswConfig: new HnswConfigDiff { PayloadM = 16, M = 0 }
);
```

3. Create keyword payload index for `group_id` field.

<aside role="alert">
    <code>is_tenant</code> parameter is available as of v1.11.0. Previous versions should use default options for keyword index creation.
</aside>


```http
PUT /collections/{collection_name}/index
{
    "field_name": "group_id",
    "field_schema": {
        "type": "keyword",
        "is_tenant": true
    }
}
```

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="group_id",
    field_schema=models.KeywordIndexParams(
        type="keywprd",
        is_tenant=True,
    ),
)
```

```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "group_id",
  field_schema: {
    type: "keyword",
    is_tenant: true,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    FieldType
};
use qdrant_client::{Qdrant, QdrantError};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "group_id",
            FieldType::Keyword,
        ).field_index_params(
            KeywordIndexParamsBuilder::default()
                .is_tenant(true)
        )
    ).await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.KeywordIndexParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "group_id",
        PayloadSchemaType.Keyword,
        PayloadIndexParams.newBuilder()
            .setKeywordIndexParams(
                KeywordIndexParams.newBuilder()
                    .setIsTenant(true)
                    .build())
            .build(),
        null,
        null,
        null)
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.CreatePayloadIndexAsync(
	collectionName: "{collection_name}",
	fieldName: "group_id",
	schemaType: PayloadSchemaType.Keyword,
	indexParams: new PayloadIndexParams
	{
		KeywordIndexParams = new KeywordIndexParams
		{
			IsTenant = true
		}
	}
);

```

`is_tenant=true` parameter is optional, but specifying it provides storage with additional inforamtion about the usage patterns the collection is going to use.
When specified, storage structure will be organized in a way to co-locate vectors of the same tenant together, which can significantly improve performance in some cases. 


## Limitations

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.
