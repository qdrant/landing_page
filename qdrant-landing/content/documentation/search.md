---
title: Search
weight: 26
---


## Similarity search

Searching for nearest vectors is at the core of many representational learning applications.
Modern neural networks are trained to transform objects into vectors so that objects close in the real world appear close in vector space.
For example texts with the similar meaning, visually similar pictures or songs of the same genre.


![Embeddings](/docs/encoders.png)


## Metrics

There are many ways to estimate the similarity of vectors with each other.
In Qdrant terms, these ways are called metrics.
The choice of metric depends on the way of vectors obtaining and in particular on the method of neural network encoder training.

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
In this case it becomes equivalent to dot production - a very fast operation due to SIMD.

## Query planning

Depending on the filter used in the search - there are several possible scenarios for query execution.
Qdrant chooses one of the query execution options depending on the available indexes, the complexity of the conditions and the cardinality of the filtering result. 
This process is called query planning.

The strategy selection process relies heavily on heuristics and can vary from release to release.
However, the general principles are:

- planning is performed for each segment independently (see [storage](../storage) for more information about segments)
- prefer a full scan if amount of points is below threshold
- estimate cardinality of a filtered result before selecting strategy
- retrieve points using payload index (see [indexing](../indexing)) if cardinality is below threshold
- use filterable vector index if cardinality is above threshold


You can adjust the threshold using a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), as well as independently for each collection.

## Search API

Let's look at an example of a search query.

REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/search_points)

```
POST /collections/{collection_name}/points/search
{
    "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "keyword": "London"
                }
            }
        ]
    },
    "params": {
        "hnsw_ef": 128
    },
    "vector": [0.2, 0.1, 0.9, 0.7],
    "top": 3
}
```

In this example we are looking for vectors which are similar to vector `[0.2, 0.1, 0.9, 0.7]`. 
Parameter `top` specifies the amount of most similar results we would like to retrieve.

Values under the key `params` specifies custom parameters for the search.
Currently it could be:

* `hnsw_ef` - value that specifies `ef` parameter of the HNSW algorithm.


Since the `filter` parameter is specified, the search is performed only among those points that satisfy the filter condition.
See details of possible filters and how they work in [filtering](../filtering) section.

Example result of this API would be 

```
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


<!--
```python
```
 -->


## Recommendation API

**DISCLAIMER**: Negative vectors is an experimental functionality which is not guaranteed to work with all king of embeddings.

In addition to the regular search, Qdrant also allows you to perform a search based on multiple, already stored in the collection vectors.
This API allows to use vector search without the need to use a neural network encoder for already encoded objects.

The recommendation API allows to specify several positive and negative vector IDs, which will be combined into a certain average vector.

` average_vector = avg(positive_vectors) + ( avg(positive_vectors) - avg(negative_vectors) )`

Vector components that have a greater value in a negative vector are penalized, and those that have a greater value in a positive vector, on the contrary, are amplified.
This average vector will be used to find the most similar vectors in the collection.


REST API - API Schema definition is available [here](https://qdrant.github.io/qdrant/redoc/index.html#operation/recommend_points)

```
POST /collections/{collection_name}/points/recommend

{
  "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "keyword": "London"
                }
            }
        ]
  },
  "negative": [718],
  "positive": [100, 231],
  "top": 10
}
```

Example result of this API would be 

```
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


<!-- 
```python
```
-->
