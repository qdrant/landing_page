---
title: Hybrid queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases: 
  - ../query
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and multi-stage queries

*As of v1.10.0*

There are use-cases when the best search is obtained by combining multiple queries, 
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter.

The way it works is that, whenever a query has at least one prefetch, Qdrant will first perform the prefetch query (or queries),
and then it will apply the main query over the results of the prefetch.

## Fusing related results

One of the most common problems when you have different representations of the same data is to combine the queried 
points for each representation in a single result.

For example, in text search, it is often useful to combine dense and sparse vectors get the best of semantics,
plus the best of specific words.

There are many ways to fuse the results, but one that we chose to implement is Reciprocal Rank Fusion (<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">RRF</a>), 
which considers the positions of each of points in the results, and boosts the ones that appear closer to the top in several queries.

This is a dense + sparse query, fused with RRF:

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
            "limit": 20,
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "using": "dense",
            "limit": 20,
        }
    ],
    "query": { "fusion": "rrf" }, // <--- reciprocal rank fusion
    "limit": 10
}
```

## Querying in stages

Qdrant often goes the extra mile to avoid multiple passes for a single query, specially with in-query filtering. But recent advances in embedding generation and techniques like smaller datatype embeddings (e.g. `uint8`),
Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>), 
Late-Interaction models (like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>) among others, 
have made it possible to go from quicker and more efficient to more refined and expensive searches.

To leverage the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later.

### Re-scoring examples

Fetch 1000 results using a shorter MRL byte vector, then re-score them using the full vector and get the top 10.

```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [1, 23, 45, 67], // <------------- small byte vector
        "using": "mrl_byte"
        "limit": 1000,
    },
    "query": [0.01, 0.299, 0.45, 0.67, ...], // <-- full vector
    "using": "full",
    "limit": 10
}
```

Fetch 100 results using the default vector, then re-score them using a multi-vector to get the top 10.
```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
        "limit": 100,
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

Even a crazy example of leveraging all the above techniques in a single query is possible:
```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "prefetch": {
            "query": [1, 23, 45, 67], // <------ small byte vector
            "using": "mrl_byte"
            "limit": 1000,
        },
        "query": [0.01, 0.45, 0.67, ...], // <-- full dense vector
        "using": "full"
        "limit": 100,
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

## Flexible interface

Other than the introduction of `prefetch`, the `Query API` has been designed to make querying easy, here are a few bonus features.

### Query by ID

Whenever you need to use a vector as an input, you can always use a point id instead.

```http
POST /collections/{collection_name}/points/query
{
    "query": "43cf51e2-8777-4f52-bc74-c2cbde0c8b04", // <--- point id
}
```

This will fetch the default vector from the point with this id, and use it as the query vector.

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

In the case above, Qdrant will fetch the `"image-512"` vector from the specified point id in the 
collection `another_collection`.

**Note:** The fetched vector(s) must match the characteristics of the `using` vector, otherwise an error will be returned.

### Sane defaults

Whatever you don't need to specify, Qdrant will take care of it for you.

The minimal query is... no parameters! In such case it will just return points by ids.

**Note:** The preferred way to fetch points without a query is via the [Scroll API](../points/#scroll-points), 
since offset pagination is much more efficient there.

```http
POST /collections/{collection_name}/points/query
{}
```

These are the defaults, in case you want to override them:

- `query`: no query, but providing a vector means a nearest neighbors query,
- `using`: the default vector name (`""`),
- `prefetch`: no prefetch.
- `filters`: no filters.
- `limit`: 10,
- `offset`: 0,
- `with_payload`: without payload,
- `with_vector`: without vector(s),
- `score_threshold`: no threshold,
- `lookup_from`: same as the current collection name and the `using` vector,


### All kinds of queries

The `query` parameter can be any kind of query, including:
- [`nearest`](../search): nearest neighbors query,
- [`recommend`](../explore/#recommendation-api): recommendation query,
- [`discover`](../explore/#discovery-search): discovery query (target + context),
- [`context`](../explore/#context-search): context query (only context),
- [`order_by`](../points/#order-points-by-payload-key): order by a payload field,
- [`fusion`](#fusing-related-results): fuse multiple prefetch queries,



