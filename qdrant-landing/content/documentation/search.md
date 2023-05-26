---
title: Search
weight: 50
---


## Similarity search

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
    search_params=models.SearchParams(
        hnsw_ef=128,
        exact=False
    ),
    query_vector=[0.2, 0.1, 0.9, 0.7],
    limit=3,
)
```

In this example, we are looking for vectors similar to vector `[0.2, 0.1, 0.9, 0.7]`.
Parameter `limit` (or its alias - `top`) specifies the amount of most similar results we would like to retrieve.

Values under the key `params` specify custom parameters for the search.
Currently, it could be:

* `hnsw_ef` - value that specifies `ef` parameter of the HNSW algorithm.
* `exact` - option to not use the approximate search (ANN). If set to true, the search may run for a long as it performs a full scan to retrieve exact results.

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

Search is processing only among vectors with the same name.

### Filtering results by score

In addition to payload filtering, it might be useful to filter out results with a low similarity score.
For example, if you know the minimal acceptance score for your model and do not want any results which are less similar than the threshold.
In this case, you can use `score_threshold` parameter of the search query.
It will exclude all results with a score worse than the given.

<aside role="status">This parameter may exclude lower or higher scores depending on the used metric. For example, higher scores of Euclidean metric are considered more distant and, therefore, will be excluded.</aside>

### Payload and vector in the result

By default, retrieval methods do not return any stored information.
Additional parameters `with_vectors` and `with_payload` could alter this behavior.

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

Parameter `with_payload` might also be used to include or exclude specific fields only:

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
    models.SearchRequest(
        vector=[0.2, 0.1, 0.9, 0.7],
        filter=filter,
        limit=3
    ),
    models.SearchRequest(
        vector=[0.5, 0.3, 0.2, 0.3],
        filter=filter,
        limit=3
    )
]

client.search_batch(
    collection_name="{collection_name}",
    requests=search_queries
)
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

<aside role="alert">Negative vectors is an experimental functionality that is not guaranteed to work with all kind of embeddings.</aside>

In addition to the regular search, Qdrant also allows you to search based on multiple vectors already stored in the collection.
This API uses vector search without involving the neural network encoder for already encoded objects.

The recommendation API allows specifying several positive and negative vector IDs, which the service will combine into a certain average vector.

`average_vector = avg(positive_vectors) + ( avg(positive_vectors) - avg(negative_vectors) )`

If there is only one positive ID provided - this request is equivalent to the regular search with vector of that point.

Vector components that have a greater value in a negative vector are penalized, and those that have a greater value in a positive vector, on the contrary, are amplified.
This average vector will be used to find the most similar vectors in the collection.

REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/recommend_points)

```http
POST /collections/{collection_name}/points/recommend

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
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.recommend(
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
    negative=[718],
    positive=[100, 231],
    limit=10,
)
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
        positive=[100, 231],
        negative=[718],
        filter=filter,
        limit=3
    ),
    models.RecommendRequest(
        positive=[200, 67],
        negative=[300],
        filter=filter,
        limit=3
    )
]

client.recommend_batch(
    collection_name="{collection_name}",
    requests=recommend_queries
)
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
    with_vector=True,
    with_payload=True,
    limit=10,
    offset=100
)
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
{
    {
        "id": 0,
        "payload": {
            "chunk_part": 0, 
            "document_id": "a",
        },
        "vector": [0.91],
    },
    {
        "id": 1,
        "payload": {
            "chunk_part": 1, 
            "document_id": ["a", "b"],
        },
        "vector": [0.8],
    },
    {
        "id": 2,
        "payload": {
            "chunk_part": 2, 
            "document_id": "a",
        },
        "vector": [0.2],
    },
    {
        "id": 3,
        "payload": {
            "chunk_part": 0, 
            "document_id": 123,
        },
        "vector": [0.79],
    },
    {
        "id": 4,
        "payload": {
            "chunk_part": 1, 
            "document_id": 123,
        },
        "vector": [0.75],
    },
    {
        "id": 5,
        "payload": {
            "chunk_part": 0, 
            "document_id": -10,
        },
        "vector": [0.6],
    },
}
```

With the ***groups*** API, you will be able to get the best *N* points for each document, assuming that the payload of the points contains the document ID. Of course there will be times where the best *N* points cannot be fulfilled due to lack of points or a big distance with respect to the query. In every case, the `group_size` is a best-effort parameter, akin to the `limit` parameter.

### Search groups

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/search_point_groups)):

```http
POST /collections/{collection_name}/points/search/groups

{
    // Same as in the regular search API
    "vector": [1.1],
    ...,

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
    vector=[1.1],
    ...,
    
    # Grouping parameters
    group_by="document_id", # Path of the field to group by
    limit=4,                # Max amount of groups
    group_size=2,           # Max amount of points per group
)
```

### Recommend groups

REST API ([Schema](https://qdrant.github.io/qdrant/redoc/index.html#tag/points/operation/recommend_point_groups)):

```http
POST /collections/{collection_name}/points/recommend/groups

{
    // Same as in the regular recommend API
    "negative": [1],
    "positive": [2, 5],
    ...,

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
    ...,

    # Grouping parameters
    group_by="document_id", # Path of the field to group by
    limit=4,                # Max amount of groups
    group_size=2,           # Max amount of points per group
)
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
                    { "id": 1, "score": 0.85 },
                ]
            },
            {
                "id": "b",
                "hits": [
                    { "id": 1, "score": 0.85 },
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

**Limitations**:

* Only string and integer (signed and unsigned) fields are supported for the `group_by` parameter. Payload fields with other types will be ignored.
* At the moment, pagination is not enabled when using **groups**, so the `offset` parameter is not allowed.
