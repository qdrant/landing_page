---
title: Multitenancy
weight: 12
aliases:
  - ../tutorials/multiple-partitions
---
# Configure Multitenancy

**How many collections should you create?** In most cases, you should only use a single collection with payload-based partitioning. This approach is called multitenancy. It is efficient for most of users, but it requires additional configuration. This document will show you how to set it up.

**When should you create multiple collections?** When you have a limited number of users and you need isolation. This approach is flexible, but it may be more costly, since creating numerous collections may result in resource overhead. Also, you need to ensure that they do not affect each other in any way, including performance-wise. 

## Partition by payload

When an instance is shared between multiple users, you may need to partition vectors by user. This is done so that each user can only access their own vectors and can't see the vectors of other users.

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
use qdrant_client::{client::QdrantClient, qdrant::PointStruct};
use serde_json::json;

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .upsert_points_blocking(
        "{collection_name}".to_string(),
        vec![
            PointStruct::new(
                1,
                vec![0.9, 0.1, 0.1],
                json!(
                    {"group_id": "user_1"}
                )
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                2,
                vec![0.1, 0.9, 0.1],
                json!(
                    {"group_id": "user_1"}
                )
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                3,
                vec![0.1, 0.1, 0.9],
                json!(
                    {"group_id": "user_2"}
                )
                .try_into()
                .unwrap(),
            ),
        ],
        None,
    )
    .await?;
```

2. Use a filter along with `group_id` to filter vectors for each user.

```http
POST /collections/{collection_name}/points/search

{
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
    "vector": [0.1, 0.1, 0.9],
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

client.search(
    collection_name="{collection_name}",
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
    query_vector=[0.1, 0.1, 0.9],
    limit=10,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  filter: {
    must: [{ key: "group_id", match: { value: "user_1" } }],
  },
  vector: [0.1, 0.1, 0.9],
  limit: 10,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, SearchPoints},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        filter: Some(Filter::must([Condition::matches(
            "group_id",
            "user_1".to_string(),
        )])),
        vector: vec![0.1, 0.1, 0.9],
        limit: 10,
        ..Default::default()
    })
    .await?;
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

client = QdrantClient("localhost", port=6333)

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
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        vectors_config::Config, CreateCollection, Distance, HnswConfigDiff, VectorParams,
        VectorsConfig,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 768,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        hnsw_config: Some(HnswConfigDiff {
            payload_m: Some(16),
            m: Some(0),
            ..Default::default()
        }),
        ..Default::default()
    })
    .await?;
```

3. Create keyword payload index for `group_id` field.

```http
PUT /collections/{collection_name}/index

{
    "field_name": "group_id",
    "field_schema": "keyword"
}
```

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="group_id",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

```typescript
client.createPayloadIndex("{collection_name}", {
  field_name: "group_id",
  field_schema: "keyword",
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::FieldType};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        "{collection_name}",
        "group_id",
        FieldType::Keyword,
        None,
        None,
    )
    .await?;
```

## Limitations

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.
