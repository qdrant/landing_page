---
title: Collections
weight: 21
---

## Collections

A collection is a named set of points (vectors with a payload) among which you can search.
Vectors within the same collection must have the same dimensionality and be compared by a single metric.

Distance metrics used to measure similarities among vectors.
The choice of metric depends on the way vectors obtaining and, in particular, on the method of neural network encoder training.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - https://en.wikipedia.org/wiki/Dot_product
* Cosine similarity: `Cosine`  - https://en.wikipedia.org/wiki/Cosine_similarity
* Euclidean distance: `Euclid` - https://en.wikipedia.org/wiki/Euclidean_distance

In addition to metrics and vector size, each collection uses its own set of parameters that controls collection optimization, index construction, and vacuum.
These settings can be changed at any time by a corresponding request.

### Create collection

With REST API

```
PUT /collections/example_collection

{
    "name": "example_collection",
    "distance": "Cosine",
    "vector_size": 300
}
```

In addition to the required options, you can also specify custom values for the following collection options:

- `hnsw_config`
- `wal_config`
- `optimizers_config`

See [schema definitions](https://qdrant.github.io/qdrant/redoc/index.html#operation/create_collection) and a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) for more information about collection parameters. 


<!-- 
#### Python

```python
```
 -->

### Delete collection

With REST API

```
DELETE /collections/example_collection
```

<!-- 
#### Python

```python
```
 -->


### Update collection parameters

Dynamic parameter updates may be helpful, for example, for more efficient initial loading of vectors.
With these settings, you can disable indexing during the upload process.  And enable it immediately after the upload is finished.
As a result, you will not waste extra computation resources on rebuilding the index.

```
PATCH /collections/example_collection

{
    "optimizers_config": {
        "indexing_threshold": 10000
    }
}
```

This command enables indexing for segments that have more than 10000 vectors stored.


<!-- 
#### Python

```python
```
 -->


## Collection aliases

In a production environment, it is sometimes necessary to switch different versions of vectors seamlessly.
For example, when upgrading to a new version of the neural network.

There is no way to stop the service and rebuild the collection with new vectors in these situations.
To avoid this, you can use aliases. 
Aliases are additional names for existing collections.
All queries to the collection can also be done identically, using an alias instead of the collection name.

Thus, it is possible to build a second collection in the background and then switch alias from the old to the new collection.
Since all changes of aliases happen atomically, no concurrent requests will be affected during the switch.

### Crate alias

```
POST /collections/aliases

{
    "actions": [
        {
            "create_alias": {
                "alias_name": "production_collection",
                "collection_name": "example_collection"
            }
        }
    ]
}
```

<!-- 
#### Python

```python
```
 -->


### Remove alias

```
POST /collections/aliases

{
    "actions": [
        {
            "delete_alias": {
                "alias_name": "production_collection"
            }
        }
    ]
}
```

<!-- 
#### Python

```python
```
 -->

### Switch collection

Multiple alias actions are performed atomically.
For example, you can switch underlying collection with the following command:


```
POST /collections/aliases

{
    "actions": [
        {
            "delete_alias": {
                "alias_name": "production_collection"
            }
        },
        {
            "create_alias": {
                "alias_name": "production_collection",
                "collection_name": "new_collection"
            }
        }
    ]
}
```