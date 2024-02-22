---
title: Points
weight: 40
aliases:
  - ../points
---

# Points

The points are the central entity that Qdrant operates with.
A point is a record consisting of a vector and an optional [payload](../payload).

You can search among the points grouped in one [collection](../collections) based on vector similarity.
This procedure is described in more detail in the [search](../search) and [filtering](../filtering) sections.

This section explains how to create and manage vectors.

Any point modification operation is asynchronous and takes place in 2 steps.
At the first stage, the operation is written to the Write-ahead-log.

After this moment, the service will not lose the data, even if the machine loses power supply.

## Awaiting result

If the API is called with the `&wait=false` parameter, or if it is not explicitly specified, the client will receive an acknowledgment of receiving data:

```json
{
  "result": {
    "operation_id": 123,
    "status": "acknowledged"
  },
  "status": "ok",
  "time": 0.000206061
}
```

This response does not mean that the data is available for retrieval yet. This
uses a form of eventual consistency. It may take a short amount of time before it
is actually processed as updating the collection happens in the background. In
fact, it is possible that such request eventually fails.
If inserting a lot of vectors, we also recommend using asynchronous requests to take advantage of pipelining.

If the logic of your application requires a guarantee that the vector will be available for searching immediately after the API responds, then use the flag `?wait=true`.
In this case, the API will return the result only after the operation is finished:

```json
{
  "result": {
    "operation_id": 0,
    "status": "completed"
  },
  "status": "ok",
  "time": 0.000206061
}
```

## Point IDs

Qdrant supports using both `64-bit unsigned integers` and `UUID` as identifiers for points.

Examples of UUID string representations:

- simple: `936DA01F9ABD4d9d80C702AF85C822A8`
- hyphenated: `550e8400-e29b-41d4-a716-446655440000`
- urn: `urn:uuid:F9168C5E-CEB2-4faa-B6BF-329BF39FA1E4`

That means that in every request UUID string could be used instead of numerical id.
Example:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": "5c56c793-69f3-4fbf-87e6-c4bf54c28c26",
            "payload": {"color": "red"},
            "vector": [0.9, 0.1, 0.1]
        }
    ]
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id="5c56c793-69f3-4fbf-87e6-c4bf54c28c26",
            payload={
                "color": "red",
            },
            vector=[0.9, 0.1, 0.1],
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
      id: "5c56c793-69f3-4fbf-87e6-c4bf54c28c26",
      payload: {
        color: "red",
      },
      vector: [0.9, 0.1, 0.1],
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
        None,
        vec![PointStruct::new(
            "5c56c793-69f3-4fbf-87e6-c4bf54c28c26".to_string(),
            vec![0.05, 0.61, 0.76, 0.74],
            json!(
                {"color": "Red"}
            )
            .try_into()
            .unwrap(),
        )],
        None,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

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
                .setId(id(UUID.fromString("5c56c793-69f3-4fbf-87e6-c4bf54c28c26")))
                .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                .putAllPayload(Map.of("color", value("Red")))
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
			Id = Guid.Parse("5c56c793-69f3-4fbf-87e6-c4bf54c28c26"),
			Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
			Payload = { ["city"] = "red" }
		}
	}
);
```

and

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "payload": {"color": "red"},
            "vector": [0.9, 0.1, 0.1]
        }
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={
                "color": "red",
            },
            vector=[0.9, 0.1, 0.1],
        ),
    ],
)
```

```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: {
        color: "red",
      },
      vector: [0.9, 0.1, 0.1],
    },
  ],
});
```

```rust
use qdrant_client::qdrant::PointStruct;
use serde_json::json;

client
    .upsert_points_blocking(
        1,
        None,
        vec![PointStruct::new(
            "5c56c793-69f3-4fbf-87e6-c4bf54c28c26".to_string(),
            vec![0.05, 0.61, 0.76, 0.74],
            json!(
                {"color": "Red"}
            )
            .try_into()
            .unwrap(),
        )],
        None,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

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
                .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                .putAllPayload(Map.of("color", value("Red")))
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
			Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
			Payload = { ["city"] = "red" }
		}
	}
);

```

are both possible.

## Upload points

To optimize performance, Qdrant supports batch loading of points. I.e., you can load several points into the service in one API call.
Batching allows you to minimize the overhead of creating a network connection.

The Qdrant API supports two ways of creating batches - record-oriented and column-oriented.
Internally, these options do not differ and are made only for the convenience of interaction.

Create points with batch:

```http
PUT /collections/{collection_name}/points
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
});
```

or record-oriented equivalent:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "payload": {"color": "red"},
            "vector": [0.9, 0.1, 0.1]
        },
        {
            "id": 2,
            "payload": {"color": "green"},
            "vector": [0.1, 0.9, 0.1]
        },
        {
            "id": 3,
            "payload": {"color": "blue"},
            "vector": [0.1, 0.1, 0.9]
        }
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={
                "color": "red",
            },
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={
                "color": "green",
            },
            vector=[0.1, 0.9, 0.1],
        ),
        models.PointStruct(
            id=3,
            payload={
                "color": "blue",
            },
            vector=[0.1, 0.1, 0.9],
        ),
    ],
)
```

```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: { color: "red" },
      vector: [0.9, 0.1, 0.1],
    },
    {
      id: 2,
      payload: { color: "green" },
      vector: [0.1, 0.9, 0.1],
    },
    {
      id: 3,
      payload: { color: "blue" },
      vector: [0.1, 0.1, 0.9],
    },
  ],
});
```

```rust
use qdrant_client::qdrant::PointStruct;
use serde_json::json;

client
    .upsert_points_batch_blocking(
        "{collection_name}".to_string(),
        None,
        vec![
            PointStruct::new(
                1,
                vec![0.9, 0.1, 0.1],
                json!(
                    {"color": "red"}
                )
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                2,
                vec![0.1, 0.9, 0.1],
                json!(
                    {"color": "green"}
                )
                .try_into()
                .unwrap(),
            ),
            PointStruct::new(
                3,
                vec![0.1, 0.1, 0.9],
                json!(
                    {"color": "blue"}
                )
                .try_into()
                .unwrap(),
            ),
        ],
        None,
        100,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

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
                .putAllPayload(Map.of("color", value("red")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.1f, 0.9f, 0.1f))
                .putAllPayload(Map.of("color", value("green")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(3))
                .setVectors(vectors(0.1f, 0.1f, 0.9f))
                .putAllPayload(Map.of("color", value("blue")))
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
	}
);
```

The Python client has additional features for loading points, which include:

- Parallelization
- A retry mechanism
- Lazy batching support

For example, you can read your data directly from hard drives, to avoid storing all data in RAM. You can use these
features with the `upload_collection` and `upload_points` methods.
Similar to the basic upsert API, these methods support both record-oriented and column-oriented formats.

<aside role="status">
<code>upload_points</code> is available as of v1.7.1. It has replaced <code>upload_records</code> which is now deprecated.
</aside>

Column-oriented format:

```python
client.upload_collection(
    collection_name="{collection_name}",
    ids=[1, 2],
    payload=[
        {"color": "red"},
        {"color": "green"},
    ],
    vectors=[
        [0.9, 0.1, 0.1],
        [0.1, 0.9, 0.1],
    ],
    parallel=4,
    max_retries=3,
)
```

<aside role="status">
If <code>ids</code> are not provided, they will be generated automatically as UUIDs.
</aside>

Record-oriented format:

```python
client.upload_points(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            payload={
                "color": "red",
            },
            vector=[0.9, 0.1, 0.1],
        ),
        models.PointStruct(
            id=2,
            payload={
                "color": "green",
            },
            vector=[0.1, 0.9, 0.1],
        ),
    ],
    parallel=4,
    max_retries=3,
)
```

All APIs in Qdrant, including point loading, are idempotent.
It means that executing the same method several times in a row is equivalent to a single execution.

In this case, it means that points with the same id will be overwritten when re-uploaded.

Idempotence property is useful if you use, for example, a message queue that doesn't provide an exactly-ones guarantee.
Even with such a system, Qdrant ensures data consistency.

[_Available as of v0.10.0_](#create-vector-name)

If the collection was created with multiple vectors, each vector data can be provided using the vector's name:

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": {
                "image": [0.9, 0.1, 0.1, 0.2],
                "text": [0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2]
            }
        },
        {
            "id": 2,
            "vector": {
                "image": [0.2, 0.1, 0.3, 0.9],
                "text": [0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9]
            }
        }
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "image": [0.9, 0.1, 0.1, 0.2],
                "text": [0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2],
            },
        ),
        models.PointStruct(
            id=2,
            vector={
                "image": [0.2, 0.1, 0.3, 0.9],
                "text": [0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9],
            },
        ),
    ],
)
```

```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        image: [0.9, 0.1, 0.1, 0.2],
        text: [0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2],
      },
    },
    {
      id: 2,
      vector: {
        image: [0.2, 0.1, 0.3, 0.9],
        text: [0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9],
      },
    },
  ],
});
```

```rust
use qdrant_client::qdrant::PointStruct;
use std::collections::HashMap;

client
    .upsert_points_blocking(
        "{collection_name}".to_string(),
        None,
        vec![
            PointStruct::new(
                1,
                HashMap::from([
                    ("image".to_string(), vec![0.9, 0.1, 0.1, 0.2]),
                    (
                        "text".to_string(),
                        vec![0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2],
                    ),
                ]),
                HashMap::new().into(),
            ),
            PointStruct::new(
                2,
                HashMap::from([
                    ("image".to_string(), vec![0.2, 0.1, 0.3, 0.9]),
                    (
                        "text".to_string(),
                        vec![0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9],
                    ),
                ]),
                HashMap::new().into(),
            ),
        ],
        None,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.grpc.Points.PointStruct;

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "image",
                            vector(List.of(0.9f, 0.1f, 0.1f, 0.2f)),
                            "text",
                            vector(List.of(0.4f, 0.7f, 0.1f, 0.8f, 0.1f, 0.1f, 0.9f, 0.2f)))))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "image",
                            List.of(0.2f, 0.1f, 0.3f, 0.9f),
                            "text",
                            List.of(0.5f, 0.2f, 0.7f, 0.4f, 0.7f, 0.2f, 0.3f, 0.9f))))
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
			Vectors = new Dictionary<string, float[]>
			{
				["image"] = [0.9f, 0.1f, 0.1f, 0.2f],
				["text"] = [0.4f, 0.7f, 0.1f, 0.8f, 0.1f, 0.1f, 0.9f, 0.2f]
			}
		},
		new()
		{
			Id = 2,
			Vectors = new Dictionary<string, float[]>
			{
				["image"] = [0.2f, 0.1f, 0.3f, 0.9f],
				["text"] = [0.5f, 0.2f, 0.7f, 0.4f, 0.7f, 0.2f, 0.3f, 0.9f]
			}
		}
	}
);
```

_Available as of v1.2.0_

Named vectors are optional. When uploading points, some vectors may be omitted.
For example, you can upload one point with only the `image` vector and a second
one with only the `text` vector.

When uploading a point with an existing ID, the existing point is deleted first,
then it is inserted with just the specified vectors. In other words, the entire
point is replaced, and any unspecified vectors are set to null. To keep existing
vectors unchanged and only update specified vectors, see [update vectors](#update-vectors).

_Available as of v1.7.0_

Points can contain dense and sparse vectors.

A sparse vector is an array in which most of the elements have a value of zero.

It is possible to take advantage of this property to have an optimized representation, for this reason they have a different shape than dense vectors.

They are represented as a list of `(index, value)` pairs, where `index` is an integer and `value` is a floating point number. The `index` is the position of the non-zero value in the vector. The `values` is the value of the non-zero element.

For example, the following vector:

```
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 0.0, 0.0]
```

can be represented as a sparse vector:

```
[(6, 1.0), (7, 2.0)]
```

Qdrant uses the following JSON representation throughout its APIs.

```json
{
  "indices": [6, 7],
  "values": [1.0, 2.0]
}
```

The `indices` and `values` arrays must have the same length.
And the `indices` must be unique.

If the `indices` are not sorted, Qdrant will sort them internally so you may not rely on the order of the elements.

Sparse vectors must be named and can be uploaded in the same way as dense vectors.

```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": {
                "text": {
                    "indices": [6, 7],
                    "values": [1.0, 2.0]
                }
            }
        },
        {
            "id": 2,
            "vector": {
                "text": {
                    "indices": [1, 1, 2, 3, 4, 5],
                    "values": [0.1, 0.2, 0.3, 0.4, 0.5]
                }
            }
        }
    ]
}
```

```python
client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=1,
            vector={
                "text": models.SparseVector(
                    indices=[6, 7],
                    values=[1.0, 2.0],
                )
            },
        ),
        models.PointStruct(
            id=2,
            vector={
                "text": models.SparseVector(
                    indices=[1, 2, 3, 4, 5],
                    values=[0.1, 0.2, 0.3, 0.4, 0.5],
                )
            },
        ),
    ],
)
```

```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        text: {
          indices: [6, 7],
          values: [1.0, 2.0],
        },
      },
    },
    {
      id: 2,
      vector: {
        text: {
          indices: [1, 2, 3, 4, 5],
          values: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
      },
    },
  ],
});
```

```rust
use qdrant_client::qdrant::{PointStruct, Vector};
use std::collections::HashMap;

client
    .upsert_points_blocking(
        "{collection_name}".to_string(),
        vec![
            PointStruct::new(
                1,
                HashMap::from([
                    (
                        "text".to_string(),
                        Vector::from(
                            (vec![6, 7], vec![1.0, 2.0])
                        ),
                    ),
                ]),
                HashMap::new().into(),
            ),
            PointStruct::new(
                2,
                HashMap::from([
                    (
                        "text".to_string(),
                        Vector::from(
                            (vec![1, 2, 3, 4, 5], vec![0.1, 0.2, 0.3, 0.4, 0.5])
                        ),
                    ),
                ]),
                HashMap::new().into(),
            ),
        ],
        None,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.grpc.Points.NamedVectors;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.Vectors;

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    Vectors.newBuilder()
                        .setVectors(
                            NamedVectors.newBuilder()
                                .putAllVectors(
                                    Map.of(
                                        "text", vector(List.of(1.0f, 2.0f), List.of(6, 7))))
                                .build())
                        .build())
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(
                    Vectors.newBuilder()
                        .setVectors(
                            NamedVectors.newBuilder()
                                .putAllVectors(
                                    Map.of(
                                        "text",
                                        vector(
                                            List.of(0.1f, 0.2f, 0.3f, 0.4f, 0.5f),
                                            List.of(1, 2, 3, 4, 5))))
                                .build())
                        .build())
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
			Vectors = new Dictionary<string, Vector> { ["text"] = ([1.0f, 2.0f], [6, 7]) }
		},
		new()
		{
			Id = 2,
			Vectors = new Dictionary<string, Vector>
			{
				["text"] = ([0.1f, 0.2f, 0.3f, 0.4f, 0.5f], [1, 2, 3, 4, 5])
			}
		}
	}
);
```

## Modify points

To change a point, you can modify its vectors or its payload. There are several
ways to do this.

### Update vectors

_Available as of v1.2.0_

This method updates the specified vectors on the given points. Unspecified
vectors are kept unchanged. All given points must exist.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/update_vectors)):

```http
PUT /collections/{collection_name}/points/vectors
{
    "points": [
        {
            "id": 1,
            "vector": {
                "image": [0.1, 0.2, 0.3, 0.4]
            }
        },
        {
            "id": 2,
            "vector": {
                "text": [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]
            }
        }
    ]
}
```

```python
client.update_vectors(
    collection_name="{collection_name}",
    points=[
        models.PointVectors(
            id=1,
            vector={
                "image": [0.1, 0.2, 0.3, 0.4],
            },
        ),
        models.PointVectors(
            id=2,
            vector={
                "text": [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
            },
        ),
    ],
)
```

```typescript
client.updateVectors("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        image: [0.1, 0.2, 0.3, 0.4],
      },
    },
    {
      id: 2,
      vector: {
        text: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
      },
    },
  ],
});
```

```rust
use qdrant_client::qdrant::PointVectors;
use std::collections::HashMap;

client
    .update_vectors_blocking(
        "{collection_name}",
        None,
        &[
            PointVectors {
                id: Some(1.into()),
                vectors: Some(
                    HashMap::from([("image".to_string(), vec![0.1, 0.2, 0.3, 0.4])]).into(),
                ),
            },
            PointVectors {
                id: Some(2.into()),
                vectors: Some(
                    HashMap::from([(
                        "text".to_string(),
                        vec![0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
                    )])
                    .into(),
                ),
            },
        ],
        None,
    )
    .await?;
```

```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

client
    .updateVectorsAsync(
        "{collection_name}",
        List.of(
            PointVectors.newBuilder()
                .setId(id(1))
                .setVectors(namedVectors(Map.of("image", vector(List.of(0.1f, 0.2f, 0.3f, 0.4f)))))
                .build(),
            PointVectors.newBuilder()
                .setId(id(2))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "text", vector(List.of(0.9f, 0.8f, 0.7f, 0.6f, 0.5f, 0.4f, 0.3f, 0.2f)))))
                .build()))
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateVectorsAsync(
	collectionName: "{collection_name}",
	points: new List<PointVectors>
	{
		new() { Id = 1, Vectors = ("image", new float[] { 0.1f, 0.2f, 0.3f, 0.4f }) },
		new()
		{
			Id = 2,
			Vectors = ("text", new float[] { 0.9f, 0.8f, 0.7f, 0.6f, 0.5f, 0.4f, 0.3f, 0.2f })
		}
	}
);
```

To update points and replace all of its vectors, see [uploading
points](#upload-points).

### Delete vectors

_Available as of v1.2.0_

This method deletes just the specified vectors from the given points. Other
vectors are kept unchanged. Points are never deleted.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/deleted_vectors)):

```http
POST /collections/{collection_name}/points/vectors/delete
{
    "points": [0, 3, 100],
    "vectors": ["text", "image"]
}
```

```python
client.delete_vectors(
    collection_name="{collection_name}",
    points_selector=models.PointIdsList(
        points=[0, 3, 100],
    ),
    vectors=["text", "image"],
)
```

```typescript
client.deleteVectors("{collection_name}", {
  points: [0, 3, 10],
  vectors: ["text", "image"],
});
```

```rust
use qdrant_client::qdrant::{
    points_selector::PointsSelectorOneOf, PointsIdsList, PointsSelector, VectorsSelector,
};

client
    .delete_vectors_blocking(
        "{collection_name}",
        None,
        &PointsSelector {
            points_selector_one_of: Some(PointsSelectorOneOf::Points(PointsIdsList {
                ids: vec![0.into(), 3.into(), 10.into()],
            })),
        },
        &VectorsSelector {
            names: vec!["text".into(), "image".into()],
        },
        None,
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .deleteVectorsAsync(
        "{collection_name}", List.of("text", "image"), List.of(id(0), id(3), id(10)))
    .get();
```

To delete entire points, see [deleting points](#delete-points).

### Update payload

Learn how to modify the payload of a point in the [Payload](../payload/#update-payload) section.

## Delete points

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/delete_points)):

```http
POST /collections/{collection_name}/points/delete
{
    "points": [0, 3, 100]
}
```

```python
client.delete(
    collection_name="{collection_name}",
    points_selector=models.PointIdsList(
        points=[0, 3, 100],
    ),
)
```

```typescript
client.delete("{collection_name}", {
  points: [0, 3, 100],
});
```

```rust
use qdrant_client::qdrant::{
    points_selector::PointsSelectorOneOf, PointsIdsList, PointsSelector,
};

client
    .delete_points_blocking(
        "{collection_name}",
        None,
        &PointsSelector {
            points_selector_one_of: Some(PointsSelectorOneOf::Points(PointsIdsList {
                ids: vec![0.into(), 3.into(), 100.into()],
            })),
        },
        None,
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client.deleteAsync("{collection_name}", List.of(id(0), id(3), id(100)));
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.DeleteAsync(collectionName: "{collection_name}", ids: [0, 3, 100]);
```

Alternative way to specify which points to remove is to use filter.

```http
POST /collections/{collection_name}/points/delete
{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    }
}
```

```python
client.delete(
    collection_name="{collection_name}",
    points_selector=models.FilterSelector(
        filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="color",
                    match=models.MatchValue(value="red"),
                ),
            ],
        )
    ),
)
```

```typescript
client.delete("{collection_name}", {
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
});
```

```rust
use qdrant_client::qdrant::{
    points_selector::PointsSelectorOneOf, Condition, Filter, PointsSelector,
};

client
    .delete_points_blocking(
        "{collection_name}",
        None,
        &PointsSelector {
            points_selector_one_of: Some(PointsSelectorOneOf::Filter(Filter::must([
                Condition::matches("color", "red".to_string()),
            ]))),
        },
        None,
    )
    .await?;
```

```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Points.Filter;

client
    .deleteAsync(
        "{collection_name}",
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.DeleteAsync(collectionName: "{collection_name}", filter: MatchKeyword("color", "red"));
```

This example removes all points with `{ "color": "red" }` from the collection.

## Retrieve points

There is a method for retrieving points by their ids.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/get_points)):

```http
POST /collections/{collection_name}/points
{
    "ids": [0, 3, 100]
}
```

```python
client.retrieve(
    collection_name="{collection_name}",
    ids=[0, 3, 100],
)
```

```typescript
client.retrieve("{collection_name}", {
  ids: [0, 3, 100],
});
```

```rust
client
    .get_points(
        "{collection_name}",
        None,
        &[0.into(), 30.into(), 100.into()],
        Some(false),
        Some(false),
        None,
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .retrieveAsync("{collection_name}", List.of(id(0), id(30), id(100)), false, false, null)
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.RetrieveAsync(
	collectionName: "{collection_name}",
	ids: [0, 30, 100],
	withPayload: false,
	withVectors: false
);
```

This method has additional parameters `with_vectors` and `with_payload`.
Using these parameters, you can select parts of the point you want as a result.
Excluding helps you not to waste traffic transmitting useless data.

The single point can also be retrieved via the API:

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/get_point)):

```http
GET /collections/{collection_name}/points/{point_id}
```

<!--
Python client:

```python
```
 -->

## Scroll points

Sometimes it might be necessary to get all stored points without knowing ids, or iterate over points that correspond to a filter.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#operation/scroll_points)):

```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    },
    "limit": 1,
    "with_payload": true,
    "with_vector": false
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(key="color", match=models.MatchValue(value="red")),
        ]
    ),
    limit=1,
    with_payload=True,
    with_vectors=False,
)
```

```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
  limit: 1,
  with_payload: true,
  with_vector: false,
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPoints};

client
    .scroll(&ScrollPoints {
        collection_name: "{collection_name}".to_string(),
        filter: Some(Filter::must([Condition::matches(
            "color",
            "red".to_string(),
        )])),
        limit: Some(1),
        with_payload: Some(true.into()),
        with_vectors: Some(false.into()),
        ..Default::default()
    })
    .await?;
```

```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
            .setLimit(1)
            .setWithPayload(enable(true))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("color", "red"),
	limit: 1,
	payloadSelector: true
);
```

Returns all point with `color` = `red`.

```json
{
  "result": {
    "next_page_offset": 1,
    "points": [
      {
        "id": 0,
        "payload": {
          "color": "red"
        }
      }
    ]
  },
  "status": "ok",
  "time": 0.0001
}
```

The Scroll API will return all points that match the filter in a page-by-page manner.

All resulting points are sorted by ID. To query the next page it is necessary to specify the largest seen ID in the `offset` field.
For convenience, this ID is also returned in the field `next_page_offset`.
If the value of the `next_page_offset` field is `null` - the last page is reached.

### Order points by a payload key

_Available as of v1.8_

When using the [`scroll`](#scroll-points) API, you can sort the results by a payload key. For example, you can retrieve points in chronological order if your payloads have a `"timestamp"` field, like it is shown in the following code:

<aside role="status">Without an appropriate index, custom ordering would create costly queries. Qdrant therefore requires a payload index which supports <a href=/documentation/concepts/indexing/#payload-index target="_blank">Range filtering conditions</a> on the field used for <code>order_by</code></aside>

```http
POST /collections/{collection_name}/points/scroll
{
    "limit": 15,
    "order_by": "timestamp", // <-- this!
}
```

```python
client.scroll(
    collection_name="{collection_name}",
    limit=15,
    order_by="timestamp", # <-- this!
)
```

```typescript
client.scroll("{collection_name}", {
  limit: 15,
  order_by: "timestamp", // <-- this!
});
```

```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPoints, OrderBy};

client
    .scroll(&ScrollPoints {
        collection_name: "{collection_name}".to_string(),
        limit: Some(15),
        order_by: Some(OrderBy {
            key: "timestamp".to_string(),  // <-- this!
            ..Default::default(),
        }),
        ..Default::default()
    })
    .await?;
```

The `order_by` `key` parameter specifies the payload key to order the results by, but there are also other fields that can be set to control the ordering, like `direction` and `start_from`:

```http
"order_by": {
    "key": "timestamp",
    "direction": "desc" // default is "asc"
    "start_from": 123, // start from this value
}
```

```python
order_by=models.OrderBy(
    key="timestamp",
    direction="desc",  # default is "asc"
    start_from=123,  # start from this value
)
```

```typescript
order_by: {
    key: "timestamp",
    direction: "desc", // default is "asc"
    start_from: 123, // start from this value
}
```

```rust
order_by: Some(OrderBy {
    key: "timestamp".to_string(),
    direction: Some(Direction::Desc) // default is Direction::Asc
    start_from: Some(123),
})
```

Note: for payloads with more than one value (like arrays), the same point may pop up more than once. Each point can appear as many times as the number of elements in the array. For example, if you have a point payload with a `timestamp` key, and the value for the key is an array of 3 elements, the same point will appear 3 times in the results, one for each timestamp.

<aside role="alert">When you use the <code>order_by</code> parameter, pagination is disabled.</aside>

An ID offset does not work when the order is based on a non-unique value. Since pagination is not explicitly enabled when using `order_by`, you will not see the `next_page_offset` field in the response. However, you can use the following steps to set up pagination:

1. For each page, store the last value of the `order_by` field.  
1. Accumulate all IDs with the same "last value" in their `order_by` `key`.  
1. Create a `has_id` filter with accumulated IDs.  
1. Use this filter and the "last value" as the `start_from` in the next request.  

## Counting points

_Available as of v0.8.4_

Sometimes it can be useful to know how many points fit the filter conditions without doing a real search.

Among others, for example, we can highlight the following scenarios:

- Evaluation of results size for faceted search
- Determining the number of pages for pagination
- Debugging the query execution speed

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/count_points)):

```http
POST /collections/{collection_name}/points/count
{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    },
    "exact": true
}
```

```python
client.count(
    collection_name="{collection_name}",
    count_filter=models.Filter(
        must=[
            models.FieldCondition(key="color", match=models.MatchValue(value="red")),
        ]
    ),
    exact=True,
)
```

```typescript
client.count("{collection_name}", {
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
  exact: true,
});
```

```rust
use qdrant_client::qdrant::{Condition, CountPoints, Filter};

client
    .count(&CountPoints {
        collection_name: "{collection_name}".to_string(),
        filter: Some(Filter::must([Condition::matches(
            "color",
            "red".to_string(),
        )])),
        exact: Some(true),
    })
    .await?;
```

```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Points.Filter;

client
    .countAsync(
        "{collection_name}",
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
        true)
    .get();
```

```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.CountAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("color", "red"),
	exact: true
);
```

Returns number of counts matching given filtering conditions:

```json
{
  "count": 3811
}
```

## Batch update

_Available as of v1.5.0_

You can batch multiple point update operations. This includes inserting,
updating and deleting points, vectors and payload.

A batch update request consists of a list of operations. These are executed in
order. These operations can be batched:

- [Upsert points](#upload-points): `upsert` or `UpsertOperation`
- [Delete points](#delete-points): `delete_points` or `DeleteOperation`
- [Update vectors](#update-vectors): `update_vectors` or `UpdateVectorsOperation`
- [Delete vectors](#delete-vectors): `delete_vectors` or `DeleteVectorsOperation`
- [Set payload](#set-payload): `set_payload` or `SetPayloadOperation`
- [Overwrite payload](#overwrite-payload): `overwrite_payload` or `OverwritePayload`
- [Delete payload](#delete-payload-keys): `delete_payload` or `DeletePayloadOperation`
- [Clear payload](#clear-payload): `clear_payload` or `ClearPayloadOperation`

The following example snippet makes use of all operations.

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/batch_update)):

```http
POST /collections/{collection_name}/points/batch
{
    "operations": [
        {
            "upsert": {
                "points": [
                    {
                        "id": 1,
                        "vector": [1.0, 2.0, 3.0, 4.0],
                        "payload": {}
                    }
                ]
            }
        },
        {
            "update_vectors": {
                "points": [
                    {
                        "id": 1,
                        "vector": [1.0, 2.0, 3.0, 4.0]
                    }
                ]
            }
        },
        {
            "delete_vectors": {
                "points": [1],
                "vector": [""]
            }
        },
        {
            "overwrite_payload": {
                "payload": {
                    "test_payload": "1"
                },
                "points": [1]
            }
        },
        {
            "set_payload": {
                "payload": {
                    "test_payload_2": "2",
                    "test_payload_3": "3"
                },
                "points": [1]
            }
        },
        {
            "delete_payload": {
                "keys": ["test_payload_2"],
                "points": [1]
            }
        },
        {
            "clear_payload": {
                "points": [1]
            }
        },
        {"delete": {"points": [1]}}
    ]
}
```

```python
client.batch_update_points(
    collection_name=collection_name,
    update_operations=[
        models.UpsertOperation(
            upsert=models.PointsList(
                points=[
                    models.PointStruct(
                        id=1,
                        vector=[1.0, 2.0, 3.0, 4.0],
                        payload={},
                    ),
                ]
            )
        ),
        models.UpdateVectorsOperation(
            update_vectors=models.UpdateVectors(
                points=[
                    models.PointVectors(
                        id=1,
                        vector=[1.0, 2.0, 3.0, 4.0],
                    )
                ]
            )
        ),
        models.DeleteVectorsOperation(
            delete_vectors=models.DeleteVectors(points=[1], vector=[""])
        ),
        models.OverwritePayloadOperation(
            overwrite_payload=models.SetPayload(
                payload={"test_payload": 1},
                points=[1],
            )
        ),
        models.SetPayloadOperation(
            set_payload=models.SetPayload(
                payload={
                    "test_payload_2": 2,
                    "test_payload_3": 3,
                },
                points=[1],
            )
        ),
        models.DeletePayloadOperation(
            delete_payload=models.DeletePayload(keys=["test_payload_2"], points=[1])
        ),
        models.ClearPayloadOperation(clear_payload=models.PointIdsList(points=[1])),
        models.DeleteOperation(delete=models.PointIdsList(points=[1])),
    ],
)
```

```typescript
client.batchUpdate("{collection_name}", {
  operations: [
    {
      upsert: {
        points: [
          {
            id: 1,
            vector: [1.0, 2.0, 3.0, 4.0],
            payload: {},
          },
        ],
      },
    },
    {
      update_vectors: {
        points: [
          {
            id: 1,
            vector: [1.0, 2.0, 3.0, 4.0],
          },
        ],
      },
    },
    {
      delete_vectors: {
        points: [1],
        vector: [""],
      },
    },
    {
      overwrite_payload: {
        payload: {
          test_payload: 1,
        },
        points: [1],
      },
    },
    {
      set_payload: {
        payload: {
          test_payload_2: 2,
          test_payload_3: 3,
        },
        points: [1],
      },
    },
    {
      delete_payload: {
        keys: ["test_payload_2"],
        points: [1],
      },
    },
    {
      clear_payload: {
        points: [1],
      },
    },
    {
      delete: {
        points: [1],
      },
    },
  ],
});
```

```rust
use qdrant_client::qdrant::{
    points_selector::PointsSelectorOneOf,
    points_update_operation::{
        DeletePayload, DeleteVectors, Operation, PointStructList, SetPayload, UpdateVectors,
    },
    PointStruct, PointVectors, PointsIdsList, PointsSelector, PointsUpdateOperation,
    VectorsSelector,
};
use serde_json::json;
use std::collections::HashMap;

client
    .batch_updates_blocking(
        "{collection_name}",
        &[
            PointsUpdateOperation {
                operation: Some(Operation::Upsert(PointStructList {
                    points: vec![PointStruct::new(
                        1,
                        vec![1.0, 2.0, 3.0, 4.0],
                        json!({}).try_into().unwrap(),
                    )],
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::UpdateVectors(UpdateVectors {
                    points: vec![PointVectors {
                        id: Some(1.into()),
                        vectors: Some(vec![1.0, 2.0, 3.0, 4.0].into()),
                    }],
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::DeleteVectors(DeleteVectors {
                    points_selector: Some(PointsSelector {
                        points_selector_one_of: Some(PointsSelectorOneOf::Points(
                            PointsIdsList {
                                ids: vec![1.into()],
                            },
                        )),
                    }),
                    vectors: Some(VectorsSelector {
                        names: vec!["".into()],
                    }),
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::OverwritePayload(SetPayload {
                    points_selector: Some(PointsSelector {
                        points_selector_one_of: Some(PointsSelectorOneOf::Points(
                            PointsIdsList {
                                ids: vec![1.into()],
                            },
                        )),
                    }),
                    payload: HashMap::from([("test_payload".to_string(), 1.into())]),
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::SetPayload(SetPayload {
                    points_selector: Some(PointsSelector {
                        points_selector_one_of: Some(PointsSelectorOneOf::Points(
                            PointsIdsList {
                                ids: vec![1.into()],
                            },
                        )),
                    }),
                    payload: HashMap::from([
                        ("test_payload_2".to_string(), 2.into()),
                        ("test_payload_3".to_string(), 3.into()),
                    ]),
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::DeletePayload(DeletePayload {
                    points_selector: Some(PointsSelector {
                        points_selector_one_of: Some(PointsSelectorOneOf::Points(
                            PointsIdsList {
                                ids: vec![1.into()],
                            },
                        )),
                    }),
                    keys: vec!["test_payload_2".to_string()],
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::ClearPayload(PointsSelector {
                    points_selector_one_of: Some(PointsSelectorOneOf::Points(PointsIdsList {
                        ids: vec![1.into()],
                    })),
                })),
            },
            PointsUpdateOperation {
                operation: Some(Operation::Delete(PointsSelector {
                    points_selector_one_of: Some(PointsSelectorOneOf::Points(PointsIdsList {
                        ids: vec![1.into()],
                    })),
                })),
            },
        ],
        None,
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
import io.qdrant.client.grpc.Points.PointVectors;
import io.qdrant.client.grpc.Points.PointsIdsList;
import io.qdrant.client.grpc.Points.PointsSelector;
import io.qdrant.client.grpc.Points.PointsUpdateOperation;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.ClearPayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeletePayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeletePoints;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.DeleteVectors;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.PointStructList;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.SetPayload;
import io.qdrant.client.grpc.Points.PointsUpdateOperation.UpdateVectors;
import io.qdrant.client.grpc.Points.VectorsSelector;

client
    .batchUpdateAsync(
        "{collection_name}",
        List.of(
            PointsUpdateOperation.newBuilder()
                .setUpsert(
                    PointStructList.newBuilder()
                        .addPoints(
                            PointStruct.newBuilder()
                                .setId(id(1))
                                .setVectors(vectors(1.0f, 2.0f, 3.0f, 4.0f))
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setUpdateVectors(
                    UpdateVectors.newBuilder()
                        .addPoints(
                            PointVectors.newBuilder()
                                .setId(id(1))
                                .setVectors(vectors(1.0f, 2.0f, 3.0f, 4.0f))
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeleteVectors(
                    DeleteVectors.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .setVectors(VectorsSelector.newBuilder().addNames("").build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setOverwritePayload(
                    SetPayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .putAllPayload(Map.of("test_payload", value(1)))
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setSetPayload(
                    SetPayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .putAllPayload(
                            Map.of("test_payload_2", value(2), "test_payload_3", value(3)))
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeletePayload(
                    DeletePayload.newBuilder()
                        .setPointsSelector(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .addKeys("test_payload_2")
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setClearPayload(
                    ClearPayload.newBuilder()
                        .setPoints(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .build())
                .build(),
            PointsUpdateOperation.newBuilder()
                .setDeletePoints(
                    DeletePoints.newBuilder()
                        .setPoints(
                            PointsSelector.newBuilder()
                                .setPoints(PointsIdsList.newBuilder().addIds(id(1)).build())
                                .build())
                        .build())
                .build()))
    .get();
```

To batch many points with a single operation type, please use batching
functionality in that operation directly.
