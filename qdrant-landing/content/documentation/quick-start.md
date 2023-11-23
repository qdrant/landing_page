---
title: Quickstart
weight: 11
aliases:
  - quick_start
---
# Quickstart

In this short example, you will use the Python Client to create a Collection, load data into it and run a basic search query. 

<aside role="status">Before you start, please make sure Docker is installed and running on your system.</aside>

## Download and run

First, download the latest Qdrant image from Dockerhub:

```bash
docker pull qdrant/qdrant
```

Then, run the service:

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

Under the default configuration all data will be stored in the `./qdrant_storage` directory. This will also be the only directory that both the Container and the host machine can both see. 

Qdrant is now accessible:
- REST API: [localhost:6333](http://localhost:6333)
- Web UI: [localhost:6333/dashboard](http://localhost:6333/dashboard)
- GRPC API: [localhost:6334](http://localhost:6334)

## Initialize the client 

```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });
```

```rust
use qdrant_client::client::QdrantClient;

// The Rust client uses Qdrant's GRPC interface
let client = QdrantClient::from_url("http://localhost:6334").build()?;
```

<aside role="status">By default, Qdrant starts with no encryption or authentication . This means anyone with network access to your machine can access your Qdrant container instance. Please read <a href="https://qdrant.tech/documentation/security/">Security</a> carefully for details on how to secure your instance.</aside>

## Create a collection

You will be storing all of your vector data in a Qdrant collection. Let's call it `test_collection`. This collection will be using a dot product distance metric to compare vectors. 

```python
from qdrant_client.http.models import Distance, VectorParams

client.create_collection(
    collection_name="test_collection",
    vectors_config=VectorParams(size=4, distance=Distance.DOT),
)
```

```typescript
await client.createCollection("test_collection", {
  vectors: { size: 4, distance: "Dot" },
});
```

```rust
use qdrant_client::qdrant::{vectors_config::Config, VectorParams, VectorsConfig};

client
    .create_collection(&CreateCollection {
        collection_name: "test_collection".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 4,
                distance: Distance::Dot.into(),
                ..Default::default()
            })),
        }),
        ..Default::default()
    })
    .await?;
```
<aside role="status">TypeScript, Rust examples use async/await syntax, so should be used in an async block.</aside>

## Add vectors

Let's now add a few vectors with a payload. Payloads are other data you want to associate with the vector:

```python
from qdrant_client.http.models import PointStruct

operation_info = client.upsert(
    collection_name="test_collection",
    wait=True,
    points=[
        PointStruct(id=1, vector=[0.05, 0.61, 0.76, 0.74], payload={"city": "Berlin"}),
        PointStruct(id=2, vector=[0.19, 0.81, 0.75, 0.11], payload={"city": "London"}),
        PointStruct(id=3, vector=[0.36, 0.55, 0.47, 0.94], payload={"city": "Moscow"}),
        PointStruct(id=4, vector=[0.18, 0.01, 0.85, 0.80], payload={"city": "New York"}),
        PointStruct(id=5, vector=[0.24, 0.18, 0.22, 0.44], payload={"city": "Beijing"}),
        PointStruct(id=6, vector=[0.35, 0.08, 0.11, 0.44], payload={"city": "Mumbai"}),
    ],
)

print(operation_info)
```

```typescript
const operationInfo = await client.upsert("test_collection", {
  wait: true,
  points: [
    { id: 1, vector: [0.05, 0.61, 0.76, 0.74], payload: { city: "Berlin" } },
    { id: 2, vector: [0.19, 0.81, 0.75, 0.11], payload: { city: "London" } },
    { id: 3, vector: [0.36, 0.55, 0.47, 0.94], payload: { city: "Moscow" } },
    { id: 4, vector: [0.18, 0.01, 0.85, 0.80], payload: { city: "New York" } },
    { id: 5, vector: [0.24, 0.18, 0.22, 0.44], payload: { city: "Beijing" } },
    { id: 6, vector: [0.35, 0.08, 0.11, 0.44], payload: { city: "Mumbai" } },
  ],
});

console.debug(operationInfo);
```

```rust
use qdrant_client::qdrant::PointStruct;
use serde_json::json;

let points = vec![
    PointStruct::new(
        1,
        vec![0.05, 0.61, 0.76, 0.74],
        json!(
            {"city": "Berlin"}
        )
        .try_into()
        .unwrap(),
    ),
    PointStruct::new(
        2,
        vec![0.19, 0.81, 0.75, 0.11],
        json!(
            {"city": "London"}
        )
        .try_into()
        .unwrap(),
    ),
    // ..truncated
];
let operation_info = client
    .upsert_points_blocking("test_collection".to_string(), points, None)
    .await?;

dbg!(operation_info);
```
**Response:**

```python
operation_id=0 status=<UpdateStatus.COMPLETED: 'completed'>
```

```typescript
{ operation_id: 0, status: 'completed' }
```

```rust
PointsOperationResponse {
    result: Some(UpdateResult {
        operation_id: 0,
        status: Completed,
    }),
    time: 0.006347708,
}
```

## Run a query
Let's ask a basic question - Which of our stored vectors are most similar to the query vector `[0.2, 0.1, 0.9, 0.7]`?

```python
search_result = client.search(
    collection_name="test_collection", query_vector=[0.2, 0.1, 0.9, 0.7], limit=3
)

print(search_result)
```

```typescript
let searchResult = await client.search("test_collection", {
  vector: [0.2, 0.1, 0.9, 0.7],
  limit: 3,
});

console.debug(searchResult);
```

```rust
use qdrant_client::qdrant::SearchPoints;

let search_result = client
    .search_points(&SearchPoints {
        collection_name: "test_collection".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        limit: 3,
        with_payload: Some(true.into()),
        ..Default::default()
    })
    .await?;

dbg!(search_result);
```

**Response:**

```python
ScoredPoint(id=4, version=0, score=1.362, payload={"city": "New York"}, vector=None),
ScoredPoint(id=1, version=0, score=1.273, payload={"city": "Berlin"}, vector=None),
ScoredPoint(id=3, version=0, score=1.208, payload={"city": "Moscow"}, vector=None)
```

```typescript
[
  {
    id: 4,
    version: 0,
    score: 1.362,
    payload: null,
    vector: null,
  },
  {
    id: 1,
    version: 0,
    score: 1.273,
    payload: null,
    vector: null,
  },
  {
    id: 3,
    version: 0,
    score: 1.208,
    payload: null,
    vector: null,
  },
];
```

```rust
SearchResponse {
    result: [
        ScoredPoint {
            id: Some(PointId {
                point_id_options: Some(Num(4)),
            }),
            payload: {},
            score: 1.362,
            version: 0,
            vectors: None,
        },
        ScoredPoint {
            id: Some(PointId {
                point_id_options: Some(Num(1)),
            }),
            payload: {},
            score: 1.273,
            version: 0,
            vectors: None,
        },
        ScoredPoint {
            id: Some(PointId {
                point_id_options: Some(Num(3)),
            }),
            payload: {},
            score: 1.208,
            version: 0,
            vectors: None,
        },
    ],
    time: 0.003635125,
}
```

The results are returned in decreasing similarity order. Note that payload and vector data is missing in these results by default.
See [payload and vector in the result](../concepts/search#payload-and-vector-in-the-result) on how to enable it.

## Add a filter

We can narrow down the results further by filtering by payload. Let's find the closest results that include "London".

```python
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

search_result = client.search(
    collection_name="test_collection",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    query_filter=Filter(
        must=[FieldCondition(key="city", match=MatchValue(value="London"))]
    ),
    with_payload=True,
    limit=3,
)

print(search_result)
```

```typescript
searchResult = await client.search("test_collection", {
  vector: [0.2, 0.1, 0.9, 0.7],
  filter: {
    must: [{ key: "city", match: { value: "London" } }],
  },
  with_payload: true,
  limit: 3,
});

console.debug(searchResult);
```

```rust
use qdrant_client::qdrant::{Condition, Filter, SearchPoints};

let search_result = client
    .search_points(&SearchPoints {
        collection_name: "test_collection".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        filter: Some(Filter::all([Condition::matches(
            "city",
            "London".to_string(),
        )])),
        limit: 2,
        ..Default::default()
    })
    .await?;

dbg!(search_result);
```

**Response:**

```python
ScoredPoint(id=2, version=0, score=0.871, payload={"city": "London"}, vector=None)
```

```typescript
[
  {
    id: 2,
    version: 0,
    score: 0.871,
    payload: { city: "London" },
    vector: null,
  },
];
```

```rust
SearchResponse {
    result: [
        ScoredPoint {
            id: Some(
                PointId {
                    point_id_options: Some(
                        Num(
                            2,
                        ),
                    ),
                },
            ),
            payload: {
                "city": Value {
                    kind: Some(
                        StringValue(
                            "London",
                        ),
                    ),
                },
            },
            score: 0.871,
            version: 0,
            vectors: None,
        },
    ],
    time: 0.004001083,
}
```
You have just conducted vector search. You loaded vectors into a database and queried the database with a vector of your own. Qdrant found the closest results and presented you with a similarity score. 

## Next steps

Now you know how Qdrant works. Getting started with [Qdrant Cloud](../cloud/quickstart-cloud/) is just as easy. [Create an account](https://qdrant.to/cloud) and use our SaaS completely free. We will take care of infrastructure maintenance and software updates. 

To move onto some more complex examples of vector search, read our [Tutorials](../tutorials/) and create your own app with the help of our [Examples](../examples/). 

**Note:** There is another way of running Qdrant locally. If you are a Python developer, we recommend that you try Local Mode in [Qdrant Client](https://github.com/qdrant/qdrant-client), as it only takes a few moments to get setup.
