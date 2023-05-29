---
title: Serve Multiple Partitions
weight: 20
---

# Serve multiple partitions

This is a common use case when you want to provide vector search for multiple independent partitions.
These partitions may be divided by users, organizations, or other criteria.
However, for simplicity, we will refer to them as users.

Each user should have only access to their own vectors and should not be able to view the vectors of other users.

There are several ways to achieve this in Qdrant:

- Use multiple collections, one for each user. This approach is the most flexible, but creating numerous collections may result in resource overhead. It is only recommended to separate users into multiple collections if you have a limited number of users and need to ensure that they do not affect each other in any way, including performance-wise.

- Use a single collection with payload-based partitioning. This approach is more efficient for a large number of users but requires some additional preparations.

In a simple case, it is sufficient to add a `group_id` field to each vector in the collection and use a filter along with `group_id` to filter vectors for each user.

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
    ]
)
```

And search with `group_id` filter:

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

However, the speed of indexation may become a bottleneck in this case, as each user's vector will be indexed into the same collection. To avoid this bottleneck, consider _bypassing the construction of a global vector index_ for the entire collection and building it only for individual groups instead.

By adopting this strategy, Qdrant will index vectors for each user independently, significantly accelerating the process.

One downside to this approach is that global requests (without the `group_id` filter) will be slower since they will necessitate scanning all groups to identify the nearest neighbors.

To implement this approach, you should:

- Set `payload_m` in the HNSW configuration to a non-zero value, such as 16.
- set `m` in hnsw config to 0. This will disable building global index for the whole collection
- Create keyword payload index for `group_id` field.

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

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HNSWConfigDiff(
        payload_m=16,
        m=0,
    ),
)
```

Create payload index for `group_id` field:

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
  field_schema=models.PayloadSchemaType.KEYWORD
)
```