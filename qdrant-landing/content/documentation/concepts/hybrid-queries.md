---
title: Hybrid Queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases: 
  - ../hybrid-queries
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and Multi-Stage Queries

*Available as of v1.10.0*

With the introduction of [many named vectors per point](../vectors/#named-vectors), there are use-cases when the best search is obtained by combining multiple queries, 
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter, which enables making sub-requests.

Specifically, whenever a query has at least one prefetch, Qdrant will:
1. Perform the prefetch query (or queries),
2. Apply the main query over the results of its prefetch(es).

Additionally, prefetches can have prefetches themselves, so you can have nested prefetches.

## Hybrid Search

One of the most common problems when you have different representations of the same data is to combine the queried points for each representation into a single result.

{{< figure  src="/docs/fusion-idea.png" caption="Fusing results from multiple queries" width="80%" >}}

For example, in text search, it is often useful to combine dense and sparse vectors get the best of semantics,
plus the best of matching specific words.

Qdrant currently has two ways of combining the results from different queries:

- `rrf` - 
<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">
Reciprocal Rank Fusion
</a>

  Considers the positions of results within each query, and boosts the ones that appear closer to the top in multiple of them.
  
- `dbsf` - 
<a href=https://medium.com/plain-simple-software/distribution-based-score-fusion-dbsf-a-new-approach-to-vector-search-ranking-f87c37488b18 target="_blank">
Distribution-Based Score Fusion
</a> *(available as of v1.11.0)*

  Normalizes the scores of the points in each query, using the mean +/- the 3rd standard deviation as limits, and then sums the scores of the same point across different queries.
  
  <aside role="status"><code>dbsf</code> is stateless and calculates the normalization limits only based on the results of each query, not on all the scores that it has seen.</aside>

Here is an example of Reciprocal Rank Fusion for a query containing two prefetches against different named vectors configured to respectively hold sparse and dense vectors. 

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { 
                "indices": [1, 42],    // <┐
                "values": [0.22, 0.8]  // <┴─sparse vector
             },
            "using": "sparse",
            "limit": 20
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "using": "dense",
            "limit": 20
        }
    ],
    "query": { "fusion": "rrf" }, // <--- reciprocal rank fusion
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=models.SparseVector(indices=[1, 42], values=[0.22, 0.8]),
            using="sparse",
            limit=20,
        ),
        models.Prefetch(
            query=[0.01, 0.45, 0.67, ...],  # <-- dense vector
            using="dense",
            limit=20,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                values: [0.22, 0.8],
                indices: [1, 42],
            },
            using: 'sparse',
            limit: 20,
        },
        {
            query: [0.01, 0.45, 0.67],
            using: 'dense',
            limit: 20,
        },
    ],
    query: {
        fusion: 'rrf',
    },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest([(1, 0.22), (42, 0.8)].as_slice()))
            .using("sparse")
            .limit(20u64)
        )
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .using("dense")
            .limit(20u64)
        )
        .query(Query::new_fusion(Fusion::Rrf))
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import java.util.List;

import static io.qdrant.client.QueryFactory.fusion;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
    QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
    .addPrefetch(PrefetchQuery.newBuilder()
      .setQuery(nearest(List.of(0.22f, 0.8f), List.of(1, 42)))
      .setUsing("sparse")
      .setLimit(20)
      .build())
    .addPrefetch(PrefetchQuery.newBuilder()
      .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f)))
      .setUsing("dense")
      .setLimit(20)
      .build())
    .setQuery(fusion(Fusion.RRF))
    .build())
  .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List < PrefetchQuery > {
    new() {
      Query = new(float, uint)[] {
          (0.22f, 1), (0.8f, 42),
        },
        Using = "sparse",
        Limit = 20
    },
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Using = "dense",
        Limit = 20
    }
  },
  query: Fusion.Rrf
);
```

## Multi-stage queries

In many cases, the usage of a larger vector representation gives more accurate search results, but it is also more expensive to compute.

Splitting the search into two stages is a known technique:

* First, use a smaller and cheaper representation to get a large list of candidates.
* Then, re-score the candidates using the larger and more accurate representation.

There are a few ways to build search architectures around this idea:

* The quantized vectors as a first stage, and the full-precision vectors as a second stage.
* Leverage Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>) to generate candidate vectors with a shorter vector, and then refine them with a longer one.
* Use regular dense vectors to pre-fetch the candidates, and then re-score them with a multi-vector model like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>.

To get the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later with larger vectors.

### Re-scoring examples

Fetch 1000 results using a shorter MRL byte vector, then re-score them using the full vector and get the top 10.

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [1, 23, 45, 67], // <------------- small byte vector
        "using": "mrl_byte"
        "limit": 1000
    },
    "query": [0.01, 0.299, 0.45, 0.67, ...], // <-- full vector
    "using": "full",
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[1, 23, 45, 67],  # <------------- small byte vector
        using="mrl_byte",
        limit=1000,
    ),
    query=[0.01, 0.299, 0.45, 0.67, ...],  # <-- full vector
    using="full",
    limit=10,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: [1, 23, 45, 67], // <------------- small byte vector
        using: 'mrl_byte',
        limit: 1000,
    },
    query: [0.01, 0.299, 0.45, 0.67, ...], // <-- full vector,
    using: 'full',
    limit: 10,
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![1.0, 23.0, 45.0, 67.0]))
            .using("mlr_byte")
            .limit(1000u64)
        )
        .query(Query::new_nearest(vec![0.01, 0.299, 0.45, 0.67]))
        .using("full")
        .limit(10u64)
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(1, 23, 45, 67))	// <------------- small byte vector
                    .setLimit(1000)
                    .setUsing("mrl_byte")
                    .build())
            .setQuery(nearest(0.01f, 0.299f, 0.45f, 0.67f))	 // <-- full vector
            .setUsing("full")
            .setLimit(10)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List<PrefetchQuery> {
    new() {
      Query = new float[] { 1,23, 45, 67 }, // <------------- small byte vector
        Using = "mrl_byte",
        Limit = 1000
    }
  },
  query: new float[] { 0.01f, 0.299f, 0.45f, 0.67f }, // <-- full vector
  usingVector: "full",
  limit: 10
);
```

Fetch 100 results using the default vector, then re-score them using a multi-vector to get the top 10.

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
        "limit": 100
    },
    "query": [           // <─┐
        [0.1, 0.2, ...], // < │
        [0.2, 0.1, ...], // < ├─ multi-vector
        [0.8, 0.9, ...]  // < │
    ],                   // <─┘       
    "using": "colbert",
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.01, 0.45, 0.67, ...],  # <-- dense vector
        limit=100,
    ),
    query=[
        [0.1, 0.2, ...],  # <─┐
        [0.2, 0.1, ...],  # < ├─ multi-vector
        [0.8, 0.9, ...],  # < ┘
    ],
    using="colbert",
    limit=10,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: [1, 23, 45, 67], // <------------- small byte vector
        limit: 100,
    },
    query: [
        [0.1, 0.2], // <─┐
        [0.2, 0.1], // < ├─ multi-vector
        [0.8, 0.9], // < ┘
    ],
    using: 'colbert',
    limit: 10,
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .limit(100u64)
        )
        .query(Query::new_nearest(vec![
            vec![0.1, 0.2],
            vec![0.2, 0.1],
            vec![0.8, 0.9],
        ]))
        .using("colbert")
        .limit(10u64)
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;


QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(0.01f, 0.45f, 0.67f)) // <-- dense vector
                    .setLimit(100)
                    .build())
            .setQuery(
                nearest(
                    new float[][] {
                      {0.1f, 0.2f},	// <─┐
                      {0.2f, 0.1f},	// < ├─ multi-vector
                      {0.8f, 0.9f}	// < ┘
                    }))
            .setUsing("colbert")
            .setLimit(10)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List <PrefetchQuery> {
    new() {
      Query = new float[] { 0.01f, 0.45f, 0.67f	},	// <-- dense vector****
        Limit = 100
    }
  },
  query: new float[][] {
    [0.1f, 0.2f], // <─┐
    [0.2f, 0.1f], // < ├─ multi-vector
    [0.8f, 0.9f]  // < ┘
  },
  usingVector: "colbert",
  limit: 10
);
```

It is possible to combine all the above techniques in a single query:

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "prefetch": {
            "query": [1, 23, 45, 67], // <------ small byte vector
            "using": "mrl_byte"
            "limit": 1000
        },
        "query": [0.01, 0.45, 0.67, ...], // <-- full dense vector
        "using": "full"
        "limit": 100
    },
    "query": [           // <─┐
        [0.1, 0.2, ...], // < │
        [0.2, 0.1, ...], // < ├─ multi-vector
        [0.8, 0.9, ...]  // < │
    ],                   // <─┘       
    "using": "colbert",
    "limit": 10
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        prefetch=models.Prefetch(
            query=[1, 23, 45, 67],  # <------ small byte vector
            using="mrl_byte",
            limit=1000,
        ),
        query=[0.01, 0.45, 0.67, ...],  # <-- full dense vector
        using="full",
        limit=100,
    ),
    query=[
        [0.1, 0.2, ...],  # <─┐
        [0.2, 0.1, ...],  # < ├─ multi-vector
        [0.8, 0.9, ...],  # < ┘
    ],
    using="colbert",
    limit=10,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        prefetch: {
            query: [1, 23, 45, 67, ...], // <------------- small byte vector
            using: 'mrl_byte',
            limit: 1000,
        },
        query: [0.01, 0.45, 0.67, ...],  // <-- full dense vector
        using: 'full',
        limit: 100,
    },
    query: [
        [0.1, 0.2], // <─┐
        [0.2, 0.1], // < ├─ multi-vector
        [0.8, 0.9], // < ┘
    ],
    using: 'colbert',
    limit: 10,
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .add_prefetch(PrefetchQueryBuilder::default()
                .query(Query::new_nearest(vec![1.0, 23.0, 45.0, 67.0]))
                .using("mlr_byte")
                .limit(1000u64)
            )
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .using("full")
            .limit(100u64)
        )
        .query(Query::new_nearest(vec![
            vec![0.1, 0.2],
            vec![0.2, 0.1],
            vec![0.8, 0.9],
        ]))
        .using("colbert")
        .limit(10u64)
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .addPrefetch(
                        PrefetchQuery.newBuilder()
                            .setQuery(nearest(1, 23, 45, 67))	// <------------- small byte vector
                            .setUsing("mrl_byte")
                            .setLimit(1000)
                            .build())
                    .setQuery(nearest(0.01f, 0.45f, 0.67f)) // <-- dense vector
                    .setUsing("full")
                    .setLimit(100)
                    .build())
            .setQuery(
                nearest(
                    new float[][] {
                      {0.1f, 0.2f},	// <─┐
                      {0.2f, 0.1f},	// < ├─ multi-vector
                      {0.8f, 0.9f}	// < ┘
                    }))
            .setUsing("colbert")
            .setLimit(10)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List <PrefetchQuery> {
    new() {
      Prefetch = {
          new List <PrefetchQuery> {
            new() {
              Query = new float[] { 1, 23, 45, 67 }, // <------------- small byte vector
                Using = "mrl_byte",
                Limit = 1000
            },
          }
        },
        Query = new float[] {0.01f, 0.45f, 0.67f}, // <-- dense vector
        Using = "full",
        Limit = 100
    }
  },
  query: new float[][] {
    [0.1f, 0.2f], // <─┐
    [0.2f, 0.1f], // < ├─ multi-vector
    [0.8f, 0.9f]  // < ┘
  },
  usingVector: "colbert",
  limit: 10
);
```

## Flexible interface

Other than the introduction of `prefetch`, the `Query API` has been designed to make querying simpler. Let's look at a few bonus features:

### Query by ID

Whenever you need to use a vector as an input, you can always use a [point ID](../points/#point-ids) instead.

```http
POST /collections/{collection_name}/points/query
{
    "query": "43cf51e2-8777-4f52-bc74-c2cbde0c8b04" // <--- point id
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query="43cf51e2-8777-4f52-bc74-c2cbde0c8b04",  # <--- point id
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
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.UUID;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(nearest(UUID.fromString("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: Guid.Parse("43cf51e2-8777-4f52-bc74-c2cbde0c8b04") // <--- point id
);
```

The above example will fetch the default vector from the point with this id, and use it as the query vector.

If the `using` parameter is also specified, Qdrant will use the vector with that name.

It is also possible to reference an ID from a different collection, by setting the `lookup_from` parameter.

```http
POST /collections/{collection_name}/points/query
{
    "query": "43cf51e2-8777-4f52-bc74-c2cbde0c8b04", // <--- point id
    "using": "512d-vector"
    "lookup_from": {
        "collection": "another_collection", // <--- other collection name
        "vector": "image-512" // <--- vector name in the other collection
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    query="43cf51e2-8777-4f52-bc74-c2cbde0c8b04",  # <--- point id
    using="512d-vector",
    lookup_from=models.LookupFrom(
        collection="another_collection",  # <--- other collection name
        vector="image-512",  # <--- vector name in the other collection
    )
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: '43cf51e2-8777-4f52-bc74-c2cbde0c8b04', // <--- point id
    using: '512d-vector',
    lookup_from: {
        collection: 'another_collection', // <--- other collection name
        vector: 'image-512', // <--- vector name in the other collection
    }
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{LookupLocationBuilder, PointId, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(Query::new_nearest(PointId::new("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
        .using("512d-vector")
        .lookup_from(
            LookupLocationBuilder::new("another_collection")
                .vector_name("image-512")
        )
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.LookupLocation;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.UUID;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(nearest(UUID.fromString("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
            .setUsing("512d-vector")
            .setLookupFrom(
                LookupLocation.newBuilder()
                    .setCollectionName("another_collection")
                    .setVectorName("image-512")
                    .build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: Guid.Parse("43cf51e2-8777-4f52-bc74-c2cbde0c8b04"), // <--- point id
  usingVector: "512d-vector",
  lookupFrom: new() {
    CollectionName = "another_collection", // <--- other collection name
      VectorName = "image-512" // <--- vector name in the other collection
  }
);
```

In the case above, Qdrant will fetch the `"image-512"` vector from the specified point id in the 
collection `another_collection`.

<aside role="status">
 The fetched vector(s) must match the characteristics of the <code>using</code> vector, otherwise, an error will be returned.
</aside>


## Re-ranking with payload values

The Query API can retrieve points not only by vector similarity but also by the content of the payload.

There are two ways to make use of the payload in the query:

* Apply filters to the payload fields, to only get the points that match the filter.
* Order the results by the payload field.

Let's see an example of when this might be useful:

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "filter": {
                "must": {
                    "key": "color",
                    "match": {
                        "value": "red"
                    }
                }
            },
            "limit": 10
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "filter": {
                "must": {
                    "key": "color",
                    "match": {
                        "value": "green"
                    }
                }
            },
            "limit": 10
        }
    ],
    "query": { "order_by": "price" }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=[0.01, 0.45, 0.67, ...],  # <-- dense vector
            filter=models.Filter(
                must=models.FieldCondition(
                    key="color",
                    match=models.Match(value="red"),
                ),
            ),
            limit=10,
        ),
        models.Prefetch(
            query=[0.01, 0.45, 0.67, ...],  # <-- dense vector
            filter=models.Filter(
                must=models.FieldCondition(
                    key="color",
                    match=models.Match(value="green"),
                ),
            ),
            limit=10,
        ),
    ],
    query=models.OrderByQuery(order_by="price"),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        {
            query: [0.01, 0.45, 0.67], // <-- dense vector
            filter: {
                must: {
                    key: 'color',
                    match: {
                        value: 'red',
                    },
                }
            },
            limit: 10,
        },
        {
            query: [0.01, 0.45, 0.67], // <-- dense vector
            filter: {
                must: {
                    key: 'color',
                    match: {
                        value: 'green',
                    },
                }
            },
            limit: 10,
        },
    ],
    query: {
        order_by: 'price',
    },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .filter(Filter::must([Condition::matches(
                "color",
                "red".to_string(),
            )]))
            .limit(10u64)
        )
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .filter(Filter::must([Condition::matches(
                "color",
                "green".to_string(),
            )]))
            .limit(10u64)
        )
        .query(Query::new_order_by("price"))
).await?;
```

```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.orderBy;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(0.01f, 0.45f, 0.67f))
                    .setFilter(
                        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
                    .setLimit(10)
                    .build())
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(0.01f, 0.45f, 0.67f))
                    .setFilter(
                        Filter.newBuilder().addMust(matchKeyword("color", "green")).build())
                    .setLimit(10)
                    .build())
            .setQuery(orderBy("price"))
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
  prefetch: new List <PrefetchQuery> {
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Filter = MatchKeyword("color", "red"),
        Limit = 10
    },
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Filter = MatchKeyword("color", "green"),
        Limit = 10
    }
  },
  query: (OrderBy) "price",
  limit: 10
);
```

In this example, we first fetch 10 points with the color `"red"` and then 10 points with the color `"green"`.
Then, we order the results by the price field.

This is how we can guarantee even sampling of both colors in the results and also get the cheapest ones first.

## Grouping

*Available as of v1.11.0*

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

REST API ([Schema](https://api.qdrant.tech/master/api-reference/search/query-points-groups)):

```http
POST /collections/{collection_name}/points/query/groups
{
    "query": [0.01, 0.45, 0.67],
    group_by="document_id",  # Path of the field to group by
    limit=4,  # Max amount of groups
    group_size=2,  # Max amount of points per group
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points_groups(
    collection_name="{collection_name}",
    query=[0.01, 0.45, 0.67],
    group_by="document_id",
    limit=4,
    group_size=2,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.queryGroups("{collection_name}", {
    query: [0.01, 0.45, 0.67],
    group_by: "document_id",
    limit: 4,
    group_size: 2,
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query_groups(
    QueryPointGroupsBuilder::new("{collection_name}", "document_id")
        .query(Query::from(vec![0.01, 0.45, 0.67]))
        .limit(4u64)
        .group_size(2u64)
).await?;
```

```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPointGroups;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryGroupsAsync(
        QueryPointGroups.newBuilder()
            .setCollectionName("{collection_name}")
            .setGroupBy("document_id")
            .setQuery(nearest(0.01f, 0.45f, 0.67f))
            .setLimit(4)
            .setGroupSize(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryGroupsAsync(
  collectionName: "{collection_name}",
  groupBy: "document_id",
  query: new float[] {
    0.01f, 0.45f, 0.67f
  },
  limit: 4,
  groupSize: 2
);
```

For more information on the `grouping` capabilities refer to the reference documentation for search with [grouping](./search/#search-groups) and [lookup](./search/#lookup-in-groups).
