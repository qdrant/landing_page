---
title: Search
weight: 50
aliases:
  - ../search
---

# Similarity search

Searching for the nearest vectors is at the core of many representational learning applications.
Modern neural networks are trained to transform objects into vectors so that objects close in the real world appear close in vector space.
It could be, for example, texts with similar meanings, visually similar pictures, or songs of the same genre.


{{< figure src="/docs/encoders.png" caption="This is how vector similarity works" width="70%" >}}

## Query API

*Available as of v1.10.0*

Qdrant provides a single interface for all kinds of search and exploration requests - the `Query API`.
Here is a reference list of what kind of queries you can perform with the `Query API` in Qdrant:

Depending on the `query` parameter, Qdrant might prefer different strategies for the search.

|  | |
| --- | --- |
| Nearest Neighbors Search | Vector Similarity Search, also known as k-NN |
| Search By Id | Search by an already stored vector - skip embedding model inference |
| [Recommendations](../explore/#recommendation-api) | Provide positive and negative examples |
| [Discovery Search](../explore/#discovery-api) | Guide the search using context as a one-shot training set |
| [Scroll](../points/#scroll-points) | Get all points with optional filtering |
| [Order By](../hybrid-queries/#re-ranking-with-stored-values) | Order points by payload key |
| [Hybrid Search](../hybrid-queries/#hybrid-search) | Combine multiple queries to get better results |
| [Multi-Stage Search](../hybrid-queries/#multi-stage-queries) | Optimize performance for large embeddings |


**Nearest Neighbors Search**

```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7] // <--- Dense vector
}
```

```python
client.query_points(
    collection_name="{collection_name}",
    query=[0.2, 0.1, 0.9, 0.7], # <--- Dense vector
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7], // <--- Dense vector
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(vec![0.2, 0.1, 0.9, 0.7]))
    )
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
  .setCollectionName("{collectionName}")
  .setQuery(nearest(List.of(0.2f, 0.1f, 0.9f, 0.7f)))
  .build()).get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f }
);
```

**Search By Id**

```http
POST /collections/{collection_name}/points/query
{
    "query": "43cf51e2-8777-4f52-bc74-c2cbde0c8b04" // <--- point id
}
```

```python
client.query_points(
    collection_name="{collection_name}",
    query="43cf51e2-8777-4f52-bc74-c2cbde0c8b04", # <--- point id
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: '43cf51e2-8777-4f52-bc74-c2cbde0c8b04', // <--- point id
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, PointId, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(PointId::new("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
    )
    .await?;
```

```java
import java.util.UUID;

import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
  .setCollectionName("{collectionName}")
  .setQuery(nearest(UUID.fromString("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
  .build()).get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: Guid.Parse("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")
);
```

## Metrics

There are many ways to estimate the similarity of vectors with each other.
In Qdrant terms, these ways are called metrics.
The choice of metric depends on the vectors obtained and, in particular, on the neural network encoder training method.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - https://en.wikipedia.org/wiki/Dot_product
* Cosine similarity: `Cosine`  - https://en.wikipedia.org/wiki/Cosine_similarity
* Euclidean distance: `Euclid` - https://en.wikipedia.org/wiki/Euclidean_distance
* Manhattan distance: `Manhattan`* - https://en.wikipedia.org/wiki/Taxicab_geometry <i><sup>*Available as of v1.7</sup></i>

The most typical metric used in similarity learning models is the cosine metric.

![Embeddings](/docs/cos.png)

Qdrant counts this metric in 2 steps, due to which a higher search speed is achieved.
The first step is to normalize the vector when adding it to the collection.
It happens only once for each vector.

The second step is the comparison of vectors.
In this case, it becomes equivalent to dot production - a very fast operation due to SIMD.

Depending on the query configuration, Qdrant might prefer different strategies for the search.
Read more about it in the [query planning](#query-planning) section.

## Search API

Let's look at an example of a search query.

REST API - API Schema definition is available [here](https://api.qdrant.tech/master/api-reference/search/points)

```http
POST /collections/{collection_name}/points/search
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
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

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
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  filter: {
    must: [
      {
        key: "city",
        match: {
          value: "London",
        },
      },
    ],
  },
  params: {
    hnsw_ef: 128,
    exact: false,
  },
  vector: [0.2, 0.1, 0.9, 0.7],
  limit: 3,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, SearchParams, SearchPoints},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        filter: Some(Filter::must([Condition::matches(
            "city",
            "London".to_string(),
        )])),
        params: Some(SearchParams {
            hnsw_ef: Some(128),
            exact: Some(false),
            ..Default::default()
        }),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        limit: 3,
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
import io.qdrant.client.grpc.Points.SearchParams;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")).build())
            .setParams(SearchParams.newBuilder().setExact(false).setHnswEf(128).build())
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setLimit(3)
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
	searchParams: new SearchParams { Exact = false, HnswEf = 128 },
	limit: 3
);
```

In this example, we are looking for vectors similar to vector `[0.2, 0.1, 0.9, 0.7]`.
Parameter `limit` (or its alias - `top`) specifies the amount of most similar results we would like to retrieve.

Values under the key `params` specify custom parameters for the search.
Currently, it could be:

* `hnsw_ef` - value that specifies `ef` parameter of the HNSW algorithm.
* `exact` - option to not use the approximate search (ANN). If set to true, the search may run for a long as it performs a full scan to retrieve exact results.
* `indexed_only` - With this option you can disable the search in those segments where vector index is not built yet. This may be useful if you want to minimize the impact to the search performance whilst the collection is also being updated. Using this option may lead to a partial result if the collection is not fully indexed yet, consider using it only if eventual consistency is acceptable for your use case.

Since the `filter` parameter is specified, the search is performed only among those points that satisfy the filter condition.
See details of possible filters and their work in the [filtering](../filtering/) section.

Example result of this API would be

```json
{
  "result": [
    { "id": 10, "score": 0.81 },
    { "id": 14, "score": 0.75 },
    { "id": 11, "score": 0.73 }
  ],
  "status": "ok",
  "time": 0.001
}
```

The `result` contains ordered by `score` list of found point ids.

Note that payload and vector data is missing in these results by default.
See [payload and vector in the result](#payload-and-vector-in-the-result) on how
to include it.

*Available as of v0.10.0*

If the collection was created with multiple vectors, the name of the vector to use for searching should be provided:

```http
POST /collections/{collection_name}/points/search
{
    "vector": {
        "name": "image",
        "vector": [0.2, 0.1, 0.9, 0.7]
    },
    "limit": 3
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.search(
    collection_name="{collection_name}",
    query_vector=("image", [0.2, 0.1, 0.9, 0.7]),
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  vector: {
    name: "image",
    vector: [0.2, 0.1, 0.9, 0.7],
  },
  limit: 3,
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::SearchPoints};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        vector_name: Some("image".to_string()),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorName("image")
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setLimit(3)
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	vectorName: "image",
	limit: 3
);
```

Search is processing only among vectors with the same name.

*Available as of v1.7.0*

If the collection was created with sparse vectors, the name of the sparse vector to use for searching should be provided:

You can still use payload filtering and other features of the search API with sparse vectors.

There are however important differences between dense and sparse vector search:

| Index| Sparse Query | Dense Query |
| --- | --- | --- | 
| Scoring Metric | Default is `Dot product`, no need to specify it | `Distance` has supported metrics e.g. Dot, Cosine |
| Search Type | Always exact in Qdrant | HNSW is an approximate NN |
| Return Behaviour | Returns only vectors with non-zero values in the same indices as the query vector | Returns `limit` vectors |

In general, the speed of the search is proportional to the number of non-zero values in the query vector.

```http
POST /collections/{collection_name}/points/search
{
    "vector": {
        "name": "text",
        "vector": {
            "indices": [6, 7],
            "values": [1.0, 2.0]
        }    
    },
    "limit": 3
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.search(
    collection_name="{collection_name}",
    query_vector=models.NamedSparseVector(
        name="text",
        vector=models.SparseVector(
            indices=[1, 7],
            values=[2.0, 1.0],
        ),
    ),
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  vector: {
    name: "text",
    vector: {
        indices: [1, 7],
        values: [2.0, 1.0]
    },
  },
  limit: 3,
});
```

```rust
use qdrant_client::{client::QdrantClient, client::Vector, qdrant::SearchPoints};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

let sparse_vector: Vector = vec![(1, 2.0), (7, 1.0)].into();

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector_name: Some("text".to_string()),
        sparse_indices: sparse_vector.indices,
        vector: sparse_vector.data,
        limit: 3,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.SparseIndices;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
.searchAsync(
    SearchPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setVectorName("text")
        .addAllVector(List.of(2.0f, 1.0f))
        .setSparseIndices(SparseIndices.newBuilder().addAllData(List.of(1, 7)).build())
        .setLimit(3)
        .build())
.get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 2.0f, 1.0f },
	vectorName: "text",
	limit: 3,
	sparseIndices: new uint[] { 1, 7 }
);
```

### Filtering results by score

In addition to payload filtering, it might be useful to filter out results with a low similarity score.
For example, if you know the minimal acceptance score for your model and do not want any results which are less similar than the threshold.
In this case, you can use `score_threshold` parameter of the search query.
It will exclude all results with a score worse than the given.

<aside role="status">This parameter may exclude lower or higher scores depending on the used metric. For example, higher scores of Euclidean metric are considered more distant and, therefore, will be excluded.</aside>

### Payload and vector in the result

By default, retrieval methods do not return any stored information such as
payload and vectors. Additional parameters `with_vectors` and `with_payload`
alter this behavior.

Example:

```http
POST /collections/{collection_name}/points/search
{
    "vector": [0.2, 0.1, 0.9, 0.7],
    "with_vectors": true,
    "with_payload": true
}
```

```python
client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    with_vectors=True,
    with_payload=True,
)
```

```typescript
client.search("{collection_name}", {
  vector: [0.2, 0.1, 0.9, 0.7],
  with_vector: true,
  with_payload: true,
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::SearchPoints};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        with_payload: Some(true.into()),
        with_vectors: Some(true.into()),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.WithVectorsSelectorFactory;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setWithPayload(enable(true))
            .setWithVectors(WithVectorsSelectorFactory.enable(true))
            .setLimit(3)
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	payloadSelector: true,
	vectorsSelector: true,
	limit: 3
);
```

You can use `with_payload` to scope to or filter a specific payload subset. 
You can even specify an array of items to include, such as `city`, 
`village`, and `town`:

```http
POST /collections/{collection_name}/points/search
{
    "vector": [0.2, 0.1, 0.9, 0.7],
    "with_payload": ["city", "village", "town"]
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    with_payload=["city", "village", "town"],
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  vector: [0.2, 0.1, 0.9, 0.7],
  with_payload: ["city", "village", "town"],
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::SearchPoints};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        with_payload: Some(vec!["city", "village", "town"].into()),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.WithPayloadSelectorFactory.include;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setWithPayload(include(List.of("city", "village", "town")))
            .setLimit(3)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	payloadSelector: new WithPayloadSelector
	{
		Include = new PayloadIncludeSelector
		{
			Fields = { new string[] { "city", "village", "town" } }
		}
	},
	limit: 3
);
```

Or use `include` or `exclude` explicitly. For example, to exclude `city`:

```http
POST /collections/{collection_name}/points/search
{
    "vector": [0.2, 0.1, 0.9, 0.7],
    "with_payload": {
      "exclude": ["city"]
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    with_payload=models.PayloadSelectorExclude(
        exclude=["city"],
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  vector: [0.2, 0.1, 0.9, 0.7],
  with_payload: {
    exclude: ["city"],
  },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        with_payload_selector::SelectorOptions, PayloadExcludeSelector, SearchPoints,
        WithPayloadSelector,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        with_payload: Some(WithPayloadSelector {
            selector_options: Some(SelectorOptions::Exclude(PayloadExcludeSelector {
                fields: vec!["city".to_string()],
            })),
        }),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.WithPayloadSelectorFactory.exclude;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setWithPayload(exclude(List.of("city")))
            .setLimit(3)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	payloadSelector: new WithPayloadSelector
	{
		Exclude = new PayloadExcludeSelector { Fields = { new string[] { "city" } } }
	},
	limit: 3
);
```

It is possible to target nested fields using a dot notation:
- `payload.nested_field` - for a nested field
- `payload.nested_array[].sub_field` - for projecting nested fields within an array

Accessing array elements by index is currently not supported.

## Batch search API

*Available as of v0.10.0*

The batch search API enables to perform multiple search requests via a single request.

Its semantic is straightforward, `n` batched search requests are equivalent to `n` singular search requests.

This approach has several advantages. Logically, fewer network connections are required which can be very beneficial on its own.

More importantly, batched requests will be efficiently processed via the query planner which can detect and optimize requests if they have the same `filter`.

This can have a great effect on latency for non trivial filters as the intermediary results can be shared among the request.

In order to use it, simply pack together your search requests. All the regular attributes of a search request are of course available.

```http
POST /collections/{collection_name}/points/search/batch
{
    "searches": [
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
            "vector": [0.2, 0.1, 0.9, 0.7],
            "limit": 3
        },
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
            "vector": [0.5, 0.3, 0.2, 0.3],
            "limit": 3
        }
    ]
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

filter_ = models.Filter(
    must=[
        models.FieldCondition(
            key="city",
            match=models.MatchValue(
                value="London",
            ),
        )
    ]
)

search_queries = [
    models.SearchRequest(vector=[0.2, 0.1, 0.9, 0.7], filter=filter_, limit=3),
    models.SearchRequest(vector=[0.5, 0.3, 0.2, 0.3], filter=filter_, limit=3),
]

client.search_batch(collection_name="{collection_name}", requests=search_queries)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const filter = {
  must: [
    {
      key: "city",
      match: {
        value: "London",
      },
    },
  ],
};

const searches = [
  {
    vector: [0.2, 0.1, 0.9, 0.7],
    filter,
    limit: 3,
  },
  {
    vector: [0.5, 0.3, 0.2, 0.3],
    filter,
    limit: 3,
  },
];

client.searchBatch("{collection_name}", {
  searches,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, SearchBatchPoints, SearchPoints},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("city", "London".to_string())]);

let searches = vec![
    SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        filter: Some(filter.clone()),
        limit: 3,
        ..Default::default()
    },
    SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.5, 0.3, 0.2, 0.3],
        filter: Some(filter),
        limit: 3,
        ..Default::default()
    },
];

client
    .search_batch_points(&SearchBatchPoints {
        collection_name: "{collection_name}".to_string(),
        search_points: searches,
        read_consistency: None,
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
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

Filter filter = Filter.newBuilder().addMust(matchKeyword("city", "London")).build();
List<SearchPoints> searches =
    List.of(
        SearchPoints.newBuilder()
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setFilter(filter)
            .setLimit(3)
            .build(),
        SearchPoints.newBuilder()
            .addAllVector(List.of(0.5f, 0.3f, 0.2f, 0.3f))
            .setFilter(filter)
            .setLimit(3)
            .build());
client.searchBatchAsync("{collection_name}", searches, null).get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

var filter = MatchKeyword("city", "London");

var searches = new List<SearchPoints>
{
	new()
	{
		Vector = { new float[] { 0.2f, 0.1f, 0.9f, 0.7f } },
		Filter = filter,
		Limit = 3
	},
	new()
	{
		Vector = { new float[] { 0.5f, 0.3f, 0.2f, 0.3f } },
		Filter = filter,
		Limit = 3
	}
};

await client.SearchBatchAsync(collectionName: "{collection_name}", searches: searches);
```

The result of this API contains one array per search requests.

```json
{
  "result": [
    [
        { "id": 10, "score": 0.81 },
        { "id": 14, "score": 0.75 },
        { "id": 11, "score": 0.73 }
    ],
    [
        { "id": 1, "score": 0.92 },
        { "id": 3, "score": 0.89 },
        { "id": 9, "score": 0.75 }
    ]
  ],
  "status": "ok",
  "time": 0.001
}
```

## Pagination

*Available as of v0.8.3*

Search and [recommendation](../explore/#recommendation-api) APIs allow to skip first results of the search and return only the result starting from some specified offset:

Example:

```http
POST /collections/{collection_name}/points/search
{
    "vector": [0.2, 0.1, 0.9, 0.7],
    "with_vectors": true,
    "with_payload": true,
    "limit": 10,
    "offset": 100
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.search(
    collection_name="{collection_name}",
    query_vector=[0.2, 0.1, 0.9, 0.7],
    with_vectors=True,
    with_payload=True,
    limit=10,
    offset=100,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.search("{collection_name}", {
  vector: [0.2, 0.1, 0.9, 0.7],
  with_vector: true,
  with_payload: true,
  limit: 10,
  offset: 100,
});
```

```rust
use qdrant_client::{client::QdrantClient, qdrant::SearchPoints};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        with_vectors: Some(true.into()),
        with_payload: Some(true.into()),
        limit: 10,
        offset: Some(100),
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.WithVectorsSelectorFactory;
import io.qdrant.client.grpc.Points.SearchPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .searchAsync(
        SearchPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(0.2f, 0.1f, 0.9f, 0.7f))
            .setWithPayload(enable(true))
            .setWithVectors(WithVectorsSelectorFactory.enable(true))
            .setLimit(10)
            .setOffset(100)
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchAsync(
	"{collection_name}",
	new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	payloadSelector: true,
	vectorsSelector: true,
	limit: 10,
	offset: 100
);
```

Is equivalent to retrieving the 11th page with 10 records per page.

<aside role="alert">Large offset values may cause performance issues</aside>

Vector-based retrieval in general and HNSW index in particular, are not designed to be paginated.
It is impossible to retrieve Nth closest vector without retrieving the first N vectors first.

However, using the offset parameter saves the resources by reducing network traffic and the number of times the storage is accessed.

Using an `offset` parameter, will require to internally retrieve `offset + limit` points, but only access payload and vector from the storage those points which are going to be actually returned.

## Grouping API

*Available as of v1.2.0*

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

For example, if you have a large document split into multiple chunks, and you want to search or [recommend](../explore/#recommendation-api) on a per-document basis, you can group the results by the document ID.

Consider having points with the following payloads:

```json
[
    {
        "id": 0,
        "payload": {
            "chunk_part": 0, 
            "document_id": "a"
        },
        "vector": [0.91]
    },
    {
        "id": 1,
        "payload": {
            "chunk_part": 1, 
            "document_id": ["a", "b"]
        },
        "vector": [0.8]
    },
    {
        "id": 2,
        "payload": {
            "chunk_part": 2, 
            "document_id": "a"
        },
        "vector": [0.2]
    },
    {
        "id": 3,
        "payload": {
            "chunk_part": 0, 
            "document_id": 123
        },
        "vector": [0.79]
    },
    {
        "id": 4,
        "payload": {
            "chunk_part": 1, 
            "document_id": 123
        },
        "vector": [0.75]
    },
    {
        "id": 5,
        "payload": {
            "chunk_part": 0, 
            "document_id": -10
        },
        "vector": [0.6]
    }
]
```

With the ***groups*** API, you will be able to get the best *N* points for each document, assuming that the payload of the points contains the document ID. Of course there will be times where the best *N* points cannot be fulfilled due to lack of points or a big distance with respect to the query. In every case, the `group_size` is a best-effort parameter, akin to the `limit` parameter.

### Search groups

REST API ([Schema](https://api.qdrant.tech/master/api-reference/search/point-groups)):

```http
POST /collections/{collection_name}/points/search/groups
{
    // Same as in the regular search API
    "vector": [1.1],

    // Grouping parameters
    "group_by": "document_id",  // Path of the field to group by
    "limit": 4,                 // Max amount of groups
    "group_size": 2,            // Max amount of points per group
}
```

```python
client.search_groups(
    collection_name="{collection_name}",
    # Same as in the regular search() API
    query_vector=[1.1],
    # Grouping parameters
    group_by="document_id",  # Path of the field to group by
    limit=4,  # Max amount of groups
    group_size=2,  # Max amount of points per group
)
```

```typescript
client.searchPointGroups("{collection_name}", {
  vector: [1.1],
  group_by: "document_id",
  limit: 4,
  group_size: 2,
});
```

```rust
use qdrant_client::qdrant::SearchPointGroups;

client
    .search_groups(&SearchPointGroups {
        collection_name: "{collection_name}".to_string(),
        vector: vec![1.1],
        group_by: "document_id".to_string(),
        limit: 4,
        group_size: 2,
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import io.qdrant.client.grpc.Points.SearchPointGroups;

client
    .searchGroupsAsync(
        SearchPointGroups.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(1.1f))
            .setGroupBy("document_id")
            .setLimit(4)
            .setGroupSize(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.SearchGroupsAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 1.1f },
	groupBy: "document_id",
	limit: 4,
	groupSize: 2
);
```

The output of a ***groups*** call looks like this:

```json
{
    "result": {
        "groups": [
            {
                "id": "a",
                "hits": [
                    { "id": 0, "score": 0.91 },
                    { "id": 1, "score": 0.85 }
                ]
            },
            {
                "id": "b",
                "hits": [
                    { "id": 1, "score": 0.85 }
                ]
            },
            {
                "id": 123,
                "hits": [
                    { "id": 3, "score": 0.79 },
                    { "id": 4, "score": 0.75 }
                ]
            },
            {
                "id": -10,
                "hits": [
                    { "id": 5, "score": 0.6 }
                ]
            }
        ]
    },
    "status": "ok",
    "time": 0.001
}
```

The groups are ordered by the score of the top point in the group. Inside each group the points are sorted too.

If the `group_by` field of a point is an array (e.g. `"document_id": ["a", "b"]`), the point can be included in multiple groups (e.g. `"document_id": "a"` and `document_id: "b"`).

<aside role="status">This feature relies heavily on the `group_by` key provided. To improve performance, make sure to create a dedicated index for it.</aside>

**Limitations**:

* Only [keyword](../payload/#keyword) and [integer](../payload/#integer) payload values are supported for the `group_by` parameter. Payload values with other types will be ignored.
* At the moment, pagination is not enabled when using **groups**, so the `offset` parameter is not allowed.

### Lookup in groups

*Available as of v1.3.0*

Having multiple points for parts of the same item often introduces redundancy in the stored data. Which may be fine if the information shared by the points is small, but it can become a problem if the payload is large, because it multiplies the storage space needed to store the points by a factor of the amount of points we have per group.

One way of optimizing storage when using groups is to store the information shared by the points with the same group id in a single point in another collection. Then, when using the [**groups** API](#grouping-api), add the `with_lookup` parameter to bring the information from those points into each group.

![Group id matches point id](/docs/lookup_id_linking.png)

This has the extra benefit of having a single point to update when the information shared by the points in a group changes.

For example, if you have a collection of documents, you may want to chunk them and store the points for the chunks in a separate collection, making sure that you store the point id from the document it belongs in the payload of the chunk point.

In this case, to bring the information from the documents into the chunks grouped by the document id, you can use the `with_lookup` parameter:

```http
POST /collections/chunks/points/search/groups
{
    // Same as in the regular search API
    "vector": [1.1],

    // Grouping parameters
    "group_by": "document_id",
    "limit": 2,
    "group_size": 2,

    // Lookup parameters
    "with_lookup": {
        // Name of the collection to look up points in
        "collection": "documents",

        // Options for specifying what to bring from the payload 
        // of the looked up point, true by default
        "with_payload": ["title", "text"],

        // Options for specifying what to bring from the vector(s) 
        // of the looked up point, true by default
        "with_vectors: false
    }
}
```

```python
client.search_groups(
    collection_name="chunks",
    # Same as in the regular search() API
    query_vector=[1.1],
    # Grouping parameters
    group_by="document_id",  # Path of the field to group by
    limit=2,  # Max amount of groups
    group_size=2,  # Max amount of points per group
    # Lookup parameters
    with_lookup=models.WithLookup(
        # Name of the collection to look up points in
        collection="documents",
        # Options for specifying what to bring from the payload
        # of the looked up point, True by default
        with_payload=["title", "text"],
        # Options for specifying what to bring from the vector(s)
        # of the looked up point, True by default
        with_vectors=False,
    ),
)
```

```typescript
client.searchPointGroups("{collection_name}", {
  vector: [1.1],
  group_by: "document_id",
  limit: 2,
  group_size: 2,
  with_lookup: {
    collection: w,
    with_payload: ["title", "text"],
    with_vectors: false,
  },
});
```

```rust
use qdrant_client::qdrant::{SearchPointGroups, WithLookup};

client
    .search_groups(&SearchPointGroups {
        collection_name: "{collection_name}".to_string(),
        vector: vec![1.1],
        group_by: "document_id".to_string(),
        limit: 2,
        group_size: 2,
        with_lookup: Some(WithLookup {
            collection: "documents".to_string(),
            with_payload: Some(vec!["title", "text"].into()),
            with_vectors: Some(false.into()),
        }),
        ..Default::default()
    })
    .await?;
```

```java
import java.util.List;

import static io.qdrant.client.WithPayloadSelectorFactory.include;
import static io.qdrant.client.WithVectorsSelectorFactory.enable;

import io.qdrant.client.grpc.Points.SearchPointGroups;
import io.qdrant.client.grpc.Points.WithLookup;

client
    .searchGroupsAsync(
        SearchPointGroups.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllVector(List.of(1.0f))
            .setGroupBy("document_id")
            .setLimit(2)
            .setGroupSize(2)
            .setWithLookup(
                WithLookup.newBuilder()
                    .setCollection("documents")
                    .setWithPayload(include(List.of("title", "text")))
                    .setWithVectors(enable(false))
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SearchGroupsAsync(
	collectionName: "{collection_name}",
	vector: new float[] { 1.0f },
	groupBy: "document_id",
	limit: 2,
	groupSize: 2,
	withLookup: new WithLookup
	{
		Collection = "documents",
		WithPayload = new WithPayloadSelector
		{
			Include = new PayloadIncludeSelector { Fields = { new string[] { "title", "text" } } }
		},
		WithVectors = false
	}
);
```

For the `with_lookup` parameter, you can also use the shorthand `with_lookup="documents"` to bring the whole payload and vector(s) without explicitly specifying it.

The looked up result will show up under `lookup` in each group.

```json
{
    "result": {
        "groups": [
            {
                "id": 1,
                "hits": [
                    { "id": 0, "score": 0.91 },
                    { "id": 1, "score": 0.85 }
                ],
                "lookup": {
                    "id": 1,
                    "payload": {
                        "title": "Document A",
                        "text": "This is document A"
                    }
                }
            },
            {
                "id": 2,
                "hits": [
                    { "id": 1, "score": 0.85 }
                ],
                "lookup": {
                    "id": 2,
                    "payload": {
                        "title": "Document B",
                        "text": "This is document B"
                    }
                }
            }
        ]
    },
    "status": "ok",
    "time": 0.001
}
```

Since the lookup is done by matching directly with the point id, any group id that is not an existing (and valid) point id in the lookup collection will be ignored, and the `lookup` field will be empty.


## Query planning

Depending on the filter used in the search - there are several possible scenarios for query execution.
Qdrant chooses one of the query execution options depending on the available indexes, the complexity of the conditions and the cardinality of the filtering result.
This process is called query planning.

The strategy selection process relies heavily on heuristics and can vary from release to release.
However, the general principles are:

* planning is performed for each segment independently (see [storage](../storage/) for more information about segments)
* prefer a full scan if the amount of points is below a threshold
* estimate the cardinality of a filtered result before selecting a strategy
* retrieve points using payload index (see [indexing](../indexing/)) if cardinality is below threshold
* use filterable vector index if the cardinality is above a threshold

You can adjust the threshold using a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), as well as independently for each collection.
