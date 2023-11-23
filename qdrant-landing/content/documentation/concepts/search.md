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

![Embeddings](/docs/encoders.png)

## Metrics

There are many ways to estimate the similarity of vectors with each other.
In Qdrant terms, these ways are called metrics.
The choice of metric depends on vectors obtaining and, in particular, on the method of neural network encoder training.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - https://en.wikipedia.org/wiki/Dot_product
* Cosine similarity: `Cosine`  - https://en.wikipedia.org/wiki/Cosine_similarity
* Euclidean distance: `Euclid` - https://en.wikipedia.org/wiki/Euclidean_distance

The most typical metric used in similarity learning models is the cosine metric.

![Embeddings](/docs/cos.png)

Qdrant counts this metric in 2 steps, due to which a higher search speed is achieved.
The first step is to normalize the vector when adding it to the collection.
It happens only once for each vector.

The second step is the comparison of vectors.
In this case, it becomes equivalent to dot production - a very fast operation due to SIMD.

## Query planning

Depending on the filter used in the search - there are several possible scenarios for query execution.
Qdrant chooses one of the query execution options depending on the available indexes, the complexity of the conditions and the cardinality of the filtering result.
This process is called query planning.

The strategy selection process relies heavily on heuristics and can vary from release to release.
However, the general principles are:

* planning is performed for each segment independently (see [storage](../storage) for more information about segments)
* prefer a full scan if the amount of points is below a threshold
* estimate the cardinality of a filtered result before selecting a strategy
* retrieve points using payload index (see [indexing](../indexing)) if cardinality is below threshold
* use filterable vector index if the cardinality is above a threshold

You can adjust the threshold using a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), as well as independently for each collection.

## Search API

Let's look at an example of a search query.

REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/search_points)

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
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

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

In this example, we are looking for vectors similar to vector `[0.2, 0.1, 0.9, 0.7]`.
Parameter `limit` (or its alias - `top`) specifies the amount of most similar results we would like to retrieve.

Values under the key `params` specify custom parameters for the search.
Currently, it could be:

* `hnsw_ef` - value that specifies `ef` parameter of the HNSW algorithm.
* `exact` - option to not use the approximate search (ANN). If set to true, the search may run for a long as it performs a full scan to retrieve exact results.
* `indexed_only` - With this option you can disable the search in those segments where vector index is not built yet. This may be useful if you want to minimize the impact to the search performance whilst the collection is also being updated. Using this option may lead to a partial result if the collection is not fully indexed yet, consider using it only if eventual consistency is acceptable for your use case.

Since the `filter` parameter is specified, the search is performed only among those points that satisfy the filter condition.
See details of possible filters and their work in the [filtering](../filtering) section.

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
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

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

Search is processing only among vectors with the same name.

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
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

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
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

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
        with_payload_selector::SelectorOptions, PayloadIncludeSelector, SearchPoints,
        WithPayloadSelector,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .search_points(&SearchPoints {
        collection_name: "{collection_name}".to_string(),
        vector: vec![0.2, 0.1, 0.9, 0.7],
        with_payload: Some(WithPayloadSelector {
            selector_options: Some(SelectorOptions::Include(PayloadIncludeSelector {
                fields: vec!["city".to_string()],
            })),
        }),
        limit: 3,
        ..Default::default()
    })
    .await?;
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
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

filter = models.Filter(
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
    models.SearchRequest(vector=[0.2, 0.1, 0.9, 0.7], filter=filter, limit=3),
    models.SearchRequest(vector=[0.5, 0.3, 0.2, 0.3], filter=filter, limit=3),
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
    })
    .await?;
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

## Recommendation API

In addition to the regular search, Qdrant also allows you to search based on multiple positive and negative examples. The API is called ***recommend***, and the examples can be point IDs, so that you can leverage the already encoded objects; and, as of v1.6, you can also use raw vectors as input, so that you can create your vectors on the fly without uploading them as points.

REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/recommend_points)

```http
POST /collections/{collection_name}/points/recommend
{
  "positive": [100, 231],
  "negative": [718, [0.2, 0.3, 0.4, 0.5]],
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
  "strategy": "average_vector",
  "limit": 3
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.recommend(
    collection_name="{collection_name}",
    positive=[100, 231],
    negative=[718, [0.2, 0.3, 0.4, 0.5]],
    strategy=models.RecommendStrategy.AVERAGE_VECTOR,
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
    limit=3,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.recommend("{collection_name}", {
  positive: [100, 231],
  negative: [718, [0.2, 0.3, 0.4, 0.5]],
  strategy: "average_vector",
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
  limit: 3,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, RecommendPoints, RecommendStrategy},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .recommend(&RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 200.into()],
        positive_vectors: vec![vec![100.0, 231.0].into()],
        negative: vec![718.into()],
        negative_vectors: vec![vec![0.2, 0.3, 0.4, 0.5].into()],
        strategy: Some(RecommendStrategy::AverageVector.into()),
        filter: Some(Filter::must([Condition::matches(
            "city",
            "London".to_string(),
        )])),
        limit: 3,
        ..Default::default()
    })
    .await?;
```

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

The algorithm used to get the recommendations is selected from the available `strategy` options. Each of them has its own strengths and weaknesses, so experiment and choose the one that works best for your case.

### Average vector strategy

The default and first strategy added to Qdrant is called `average_vector`. It preprocesses the input examples to create a single vector that is used for the search. Since the preprocessing step happens very fast, the performance of this strategy is on-par with regular search. The intuition behind this kind of recommendation is that each vector component represents an independent feature of the data, so, by averaging the examples, we should get a good recommendation.

The way to produce the searching vector is by first averaging all the positive and negative examples separately, and then combining them into a single vector using the following formula:

```rust
avg_positive + avg_positive - avg_negative
```

In the case of not having any negative examples, the search vector will simply be equal to `avg_positive`.

This is the default strategy that's going to be set implicitly, but you can explicitly define it by setting `"strategy": "average_vector"` in the recommendation request.

### Best score strategy

*Available as of v1.6.0*

A new strategy introduced in v1.6, is called `best_score`. It is based on the idea that the best way to find similar vectors is to find the ones that are closer to a positive example, while avoiding the ones that are closer to a negative one.
The way it works is that each candidate is measured against every example, then we select the best positive and best negative scores. The final score is chosen with this step formula:

```rust
let score = if best_positive_score > best_negative_score {
    best_positive_score;
} else {
    -(best_negative_score * best_negative_score);
};
```

<aside role="alert">The performance of `best_score` strategy will be linearly impacted by the amount of examples.</aside>

Since we are computing similarities to every example at each step of the search, the performance of this strategy will be linearly impacted by the amount of examples. This means that the more examples you provide, the slower the search will be. However, this strategy can be very powerful and should be more embedding-agnostic.

To use this algorithm, you need to set `"strategy": "best_score"` in the recommendation request.

#### Using only negative examples

A beneficial side-effect of `best_score` strategy is that you can use it with only negative examples. This will allow you to find the most dissimilar vectors to the ones you provide. This can be useful for finding outliers in your data, or for finding the most dissimilar vectors to a given one.

Combining negative-only examples with filtering can be a powerful tool for data exploration and cleaning.

### Multiple vectors

*Available as of v0.10.0*

If the collection was created with multiple vectors, the name of the vector should be specified in the recommendation request:

```http
POST /collections/{collection_name}/points/recommend

{
  "positive": [100, 231],
  "negative": [718],
  "using": "image",
  "limit": 10
 }
```

```python
client.recommend(
    collection_name="{collection_name}",
    positive=[100, 231],
    negative=[718],
    using="image",
    limit=10,
)
```

```typescript
client.recommend("{collection_name}", {
  positive: [100, 231],
  negative: [718],
  using: "image",
  limit: 10,
});
```

```rust
use qdrant_client::qdrant::RecommendPoints;

client
    .recommend(&RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 231.into()],
        negative: vec![718.into()],
        using: Some("image".to_string()),
        limit: 10,
        ..Default::default()
    })
    .await?;
```

Parameter `using` specifies which stored vectors to use for the recommendation.

## Batch recommendation API

*Available as of v0.10.0*

Similar to the batch search API in terms of usage and advantages, it enables the batching of recommendation requests.

```http
POST /collections/{collection_name}/points/recommend/batch
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
            "negative": [718],
            "positive": [100, 231],
            "limit": 10
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
            "negative": [300],
            "positive": [200, 67],
            "limit": 10
        }
    ]
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

filter = models.Filter(
    must=[
        models.FieldCondition(
            key="city",
            match=models.MatchValue(
                value="London",
            ),
        )
    ]
)

recommend_queries = [
    models.RecommendRequest(
        positive=[100, 231], negative=[718], filter=filter, limit=3
    ),
    models.RecommendRequest(positive=[200, 67], negative=[300], filter=filter, limit=3),
]

client.recommend_batch(collection_name="{collection_name}", requests=recommend_queries)
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
    positive: [100, 231],
    negative: [718],
    filter,
    limit: 3,
  },
  {
    positive: [200, 67],
    negative: [300],
    filter,
    limit: 3,
  },
];

client.recommend_batch("{collection_name}", {
  searches,
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{Condition, Filter, RecommendBatchPoints, RecommendPoints},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("city", "London".to_string())]);

let recommend_queries = vec![
    RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![100.into(), 231.into()],
        negative: vec![718.into()],
        filter: Some(filter.clone()),
        limit: 3,
        ..Default::default()
    },
    RecommendPoints {
        collection_name: "{collection_name}".to_string(),
        positive: vec![200.into(), 67.into()],
        negative: vec![300.into()],
        filter: Some(filter),
        limit: 3,
        ..Default::default()
    },
];

client
    .recommend_batch(&RecommendBatchPoints {
        collection_name: "{collection_name}".to_string(),
        recommend_points: recommend_queries,
        ..Default::default()
    })
    .await?;
```

The result of this API contains one array per recommendation requests.

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

Search and recommendation APIs allow to skip first results of the search and return only the result starting from some specified offset:

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

client = QdrantClient("localhost", port=6333)

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

Is equivalent to retrieving the 11th page with 10 records per page.

<aside role="alert">Large offset values may cause performance issues</aside>

Vector-based retrieval in general and HNSW index in particular, are not designed to be paginated.
It is impossible to retrieve Nth closest vector without retrieving the first N vectors first.

However, using the offset parameter saves the resources by reducing network traffic and the number of times the storage is accessed.

Using an `offset` parameter, will require to internally retrieve `offset + limit` points, but only access payload and vector from the storage those points which are going to be actually returned.

## Grouping API

*Available as of v1.2.0*

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

For example, if you have a large document split into multiple chunks, and you want to search or recommend on a per-document basis, you can group the results by the document ID.

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

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/search_point_groups)):

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
    query_vector=g,
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

### Recommend groups

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/recommend_point_groups)):

```http
POST /collections/{collection_name}/points/recommend/groups

{
    // Same as in the regular recommend API
    "negative": [1],
    "positive": [2, 5],

    // Grouping parameters
    "group_by": "document_id",  // Path of the field to group by
    "limit": 4,                 // Max amount of groups
    "group_size": 2,            // Max amount of points per group
}
```

```python
client.recommend_groups(
    collection_name="{collection_name}",
    # Same as in the regular recommend() API
    negative=[1],
    positive=[2, 5],
    # Grouping parameters
    group_by="document_id",  # Path of the field to group by
    limit=4,  # Max amount of groups
    group_size=2,  # Max amount of points per group
)
```

```typescript
client.recommendPointGroups("{collection_name}", {
  negative: [1],
  positive: [2, 5],
  group_by: "document_id",
  limit: 4,
  group_size: 2,
});
```

```rust
use qdrant_client::qdrant::RecommendPointGroups;

client
    .recommend_groups(&RecommendPointGroups {
        collection_name: "{collection_name}".to_string(),
        positive: vec![1.into()],
        negative: vec![2.into(), 5.into()],
        group_by: "document_id".to_string(),
        limit: 4,
        group_size: 10,
        ..Default::default()
    })
    .await?;
```

In either case (search or recommend), the output would look like this:

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
