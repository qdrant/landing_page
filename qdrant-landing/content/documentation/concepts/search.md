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
| [Recommendations](/documentation/concepts/explore/#recommendation-api) | Provide positive and negative examples |
| [Discovery Search](/documentation/concepts/explore/#discovery-api) | Guide the search using context as a one-shot training set |
| [Scroll](/documentation/concepts/points/#scroll-points) | Get all points with optional filtering |
| [Grouping](/documentation/concepts/search/#grouping-api) | Group results by a certain field |
| [Order By](/documentation/concepts/hybrid-queries/#re-ranking-with-stored-values) | Order points by payload key |
| [Hybrid Search](/documentation/concepts/hybrid-queries/#hybrid-search) | Combine multiple queries to get better results |
| [Multi-Stage Search](/documentation/concepts/hybrid-queries/#multi-stage-queries) | Optimize performance for large embeddings |
| [Random Sampling](#random-sampling) | Get random points from the collection |

**Nearest Neighbors Search**

{{< code-snippet path="/documentation/headless/snippets/query-points/simple-dense/" >}}

**Search By Id**

{{< code-snippet path="/documentation/headless/snippets/query-points/by-existing-id/" >}}

## Metrics

There are many ways to estimate the similarity of vectors with each other.
In Qdrant terms, these ways are called metrics.
The choice of metric depends on the vectors obtained and, in particular, on the neural network encoder training method.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - <https://en.wikipedia.org/wiki/Dot_product>
* Cosine similarity: `Cosine`  - <https://en.wikipedia.org/wiki/Cosine_similarity>
* Euclidean distance: `Euclid` - <https://en.wikipedia.org/wiki/Euclidean_distance>
* Manhattan distance: `Manhattan`*- <https://en.wikipedia.org/wiki/Taxicab_geometry> <i><sup>*Available as of v1.7</sup></i>

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

REST API - API Schema definition is available [here](https://api.qdrant.tech/api-reference/search/query-points)

{{< code-snippet path="/documentation/headless/snippets/query-points/basic-with-filter-and-params/" >}}

In this example, we are looking for vectors similar to vector `[0.2, 0.1, 0.9, 0.7]`.
Parameter `limit` (or its alias - `top`) specifies the amount of most similar results we would like to retrieve.

Values under the key `params` specify custom parameters for the search.
Currently, it could be:

* `hnsw_ef` - value that specifies `ef` parameter of the HNSW algorithm.
* `exact` - option to not use the approximate search (ANN). If set to true, the search may run for a long as it performs a full scan to retrieve exact results.
* `indexed_only` - With this option you can disable the search in those segments where vector index is not built yet. This may be useful if you want to minimize the impact to the search performance whilst the collection is also being updated. Using this option may lead to a partial result if the collection is not fully indexed yet, consider using it only if eventual consistency is acceptable for your use case.

Since the `filter` parameter is specified, the search is performed only among those points that satisfy the filter condition.
See details of possible filters and their work in the [filtering](/documentation/concepts/filtering/) section.

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

If the collection was created with multiple vectors, the name of the vector to use for searching should be provided:

{{< code-snippet path="/documentation/headless/snippets/query-points/named-vector/" >}}

Search is processing only among vectors with the same name.

If the collection was created with sparse vectors, the name of the sparse vector to use for searching should be provided:

You can still use payload filtering and other features of the search API with sparse vectors.

There are however important differences between dense and sparse vector search:

| Index| Sparse Query | Dense Query |
| --- | --- | --- |
| Scoring Metric | Default is `Dot product`, no need to specify it | `Distance` has supported metrics e.g. Dot, Cosine |
| Search Type | Always exact in Qdrant | HNSW is an approximate NN |
| Return Behaviour | Returns only vectors with non-zero values in the same indices as the query vector | Returns `limit` vectors |

In general, the speed of the search is proportional to the number of non-zero values in the query vector.

{{< code-snippet path="/documentation/headless/snippets/query-points/sparse-vectors/" >}}

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

{{< code-snippet path="/documentation/headless/snippets/query-points/with-payload-and-vectors/" >}}

You can use `with_payload` to scope to or filter a specific payload subset.
You can even specify an array of items to include, such as `city`,
`village`, and `town`:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-payload-fields/" >}}

Or use `include` or `exclude` explicitly. For example, to exclude `city`:

{{< code-snippet path="/documentation/headless/snippets/query-points/exclude-fields/" >}}

It is possible to target nested fields using a dot notation:
* `payload.nested_field` - for a nested field
* `payload.nested_array[].sub_field` - for projecting nested fields within an array

Accessing array elements by index is currently not supported.

## Batch search API

The batch search API enables to perform multiple search requests via a single request.

Its semantic is straightforward, `n` batched search requests are equivalent to `n` singular search requests.

This approach has several advantages. Logically, fewer network connections are required which can be very beneficial on its own.

More importantly, batched requests will be efficiently processed via the query planner which can detect and optimize requests if they have the same `filter`.

This can have a great effect on latency for non trivial filters as the intermediary results can be shared among the request.

In order to use it, simply pack together your search requests. All the regular attributes of a search request are of course available.

{{< code-snippet path="/documentation/headless/snippets/query-points/batch-search/" >}}

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

## Query by ID

Whenever you need to use a vector as an input, you can always use a [point ID](/documentation/concepts/points/#point-ids) instead.

{{< code-snippet path="/documentation/headless/snippets/query-points/by-existing-id/" >}}

The above example will fetch the default vector from the point with this id, and use it as the query vector.

If the `using` parameter is also specified, Qdrant will use the vector with that name.

It is also possible to reference an ID from a different collection, by setting the `lookup_from` parameter.

{{< code-snippet path="/documentation/headless/snippets/query-points/by-existing-id-with-lookup/" >}}

In the case above, Qdrant will fetch the `"image-512"` vector from the specified point id in the 
collection `another_collection`.

<aside role="status">
 The fetched vector(s) must match the characteristics of the <code>using</code> vector, otherwise, an error will be returned.
</aside>


## Pagination

Search and [recommendation](/documentation/concepts/explore/#recommendation-api) APIs allow to skip first results of the search and return only the result starting from some specified offset:

Example:

{{< code-snippet path="/documentation/headless/snippets/query-points/with-offset/" >}}

Is equivalent to retrieving the 11th page with 10 records per page.

<aside role="alert">Large offset values may cause performance issues</aside>

Vector-based retrieval in general and HNSW index in particular, are not designed to be paginated.
It is impossible to retrieve Nth closest vector without retrieving the first N vectors first.

However, using the offset parameter saves the resources by reducing network traffic and the number of times the storage is accessed.

Using an `offset` parameter, will require to internally retrieve `offset + limit` points, but only access payload and vector from the storage those points which are going to be actually returned.

## Grouping API

It is possible to group results by a certain field. This is useful when you have multiple points for the same item, and you want to avoid redundancy of the same item in the results.

For example, if you have a large document split into multiple chunks, and you want to search or [recommend](/documentation/concepts/explore/#recommendation-api) on a per-document basis, you can group the results by the document ID.

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

REST API ([Schema](https://api.qdrant.tech/api-reference/search/query-points-groups)):

{{< code-snippet path="/documentation/headless/snippets/query-groups/basic/" >}}

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

* Only [keyword](/documentation/concepts/payload/#keyword) and [integer](/documentation/concepts/payload/#integer) payload values are supported for the `group_by` parameter. Payload values with other types will be ignored.
* At the moment, pagination is not enabled when using **groups**, so the `offset` parameter is not allowed.

### Lookup in groups

Having multiple points for parts of the same item often introduces redundancy in the stored data. Which may be fine if the information shared by the points is small, but it can become a problem if the payload is large, because it multiplies the storage space needed to store the points by a factor of the amount of points we have per group.

One way of optimizing storage when using groups is to store the information shared by the points with the same group id in a single point in another collection. Then, when using the [**groups** API](#grouping-api), add the `with_lookup` parameter to bring the information from those points into each group.

![Group id matches point id](/docs/lookup_id_linking.png)

<aside role="status">Store only document-level metadata (e.g., titles, abstracts) in the lookup collection, not chunks or duplicated data.</aside>

This has the extra benefit of having a single point to update when the information shared by the points in a group changes.

For example, if you have a collection of documents, you may want to chunk them and store the points for the chunks in a separate collection, making sure that you store the point id from the document it belongs in the payload of the chunk point.

In this case, to bring the information from the documents into the chunks grouped by the document id, you can use the `with_lookup` parameter:

{{< code-snippet path="/documentation/headless/snippets/query-groups/with-lookup/" >}}

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

Since the lookup is done by matching directly with the point id, the lookup collection must be pre-populated with points where the `id` matches the `group_by` value (e.g., document_id) from your primary collection.

Any group id that is not an existing (and valid) point id in the lookup collection will be ignored, and the `lookup` field will be empty.

## Random Sampling

*Available as of v1.11.0*

In some cases it might be useful to retrieve a random sample of points from the collection. This can be useful for debugging, testing, or for providing entry points for exploration.

Random sampling API is a part of [Universal Query API](#query-api) and can be used in the same way as regular search API.

{{< code-snippet path="/documentation/headless/snippets/query-points/random-sample/" >}}

## Query planning

Depending on the filter used in the search - there are several possible scenarios for query execution.
Qdrant chooses one of the query execution options depending on the available indexes, the complexity of the conditions and the cardinality of the filtering result.
This process is called query planning.

The strategy selection process relies heavily on heuristics and can vary from release to release.
However, the general principles are:

* planning is performed for each segment independently (see [storage](/documentation/concepts/storage/) for more information about segments)
* prefer a full scan if the amount of points is below a threshold
* estimate the cardinality of a filtered result before selecting a strategy
* retrieve points using payload index (see [indexing](/documentation/concepts/indexing/)) if cardinality is below threshold
* use filterable vector index if the cardinality is above a threshold

You can adjust the threshold using a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), as well as independently for each collection.
