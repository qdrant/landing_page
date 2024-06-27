---
title: Hybrid Queries #required
weight: 57 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
aliases: 
  - ../hybrid-queries
hideInSidebar: false # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---

# Hybrid and multi-stage queries

*Available as of v1.10.0*

There are use-cases when the best search is obtained by combining multiple queries, 
or by performing the search in more than one stage.

Qdrant has a flexible and universal interface to make this possible, called `Query API` ([API reference](https://api.qdrant.tech/api-reference/search/query-points)).

The main component for making the combinations of queries possible is the `prefetch` parameter.

The way it works is that, whenever a query has at least one prefetch, Qdrant will first perform the prefetch query (or queries),
and then it will apply the main query over the results of the prefetch.

## Hybrid Search

One of the most common problems when you have different representations of the same data is to combine the queried 
points for each representation in a single result.


{{< figure  src="/docs/reciprocal-rank-fusion.png" caption="Reciprocal Rank Fusion" width="85%" >}}


For example, in text search, it is often useful to combine dense and sparse vectors get the best of semantics,
plus the best of specific words.

There are many ways to fuse the results, in this example we use Reciprocal Rank Fusion (<a href=https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf target="_blank">RRF</a>), 
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

## Multi-stage queries

In many cases the usage of a larger vector representation gives more accurate search results, but it is also more expensive to compute.

One of the popular techniques to speed up the search is to split the search into two stages:

* First, use a smaller and cheaper representation to get a large list of candidates.
* Then, re-score the candidates using the larger and more accurate representation.

There are a few ways to build search architectures around this idea:

* The quantized vectors as a first stage, and the full-precision vectors as a second stage.
* Leverage Matryoshka Representation Learning (<a href=https://arxiv.org/abs/2205.13147 target="_blank">MRL</a>) to generate candidate vectors with a shorter vector, and then refine them with a longer one.
* Use regular dense vectors to pre-fetch the candidates, and then re-score them with a multi-vector model like <a href=https://arxiv.org/abs/2112.01488 target="_blank">ColBERT</a>.

To leverage the best of all worlds, Qdrant has a convenient interface to perform the queries in stages,
such that the coarse results are fetched first, and then they are refined later with larger vectors.

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

Even more sophisticated examples like leveraging all the above techniques in a single query are possible:
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
    "query": "43cf51e2-8777-4f52-bc74-c2cbde0c8b04" // <--- point id
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

<aside role="status">
 The fetched vector(s) must match the characteristics of the <code>using</code> vector, otherwise an error will be returned.
</aside>


## Re-ranking with payload values

Query API allows to retrieve points not only by vector similarity, but also by the content of the payload.

There are two ways to make use of the payload in the query:

* Apply filters to the payload fields, to get only the points that match the filter.
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

In this example, we first fetch 10 points with the color "red", and then 10 points with the color "green".
Then, we order the results by the price field.

In this way we can guarantee even sampling of both colors in the results, and also get the cheapest ones first.

