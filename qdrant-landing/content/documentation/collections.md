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

```http
PUT /collections/{collection_name}

{
    "name": "example_collection",
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

client.recreate_collection(
    name="{collection_name}",
    vectors_config=models.VectorParams(size=100, distance=models.Distance.COSINE),
)
```

In addition to the required options, you can also specify custom values for the following collection options:

* `hnsw_config` - see [indexing](../indexing/#vector-index) for details.
* `wal_config` - Write-Ahead-Log related configuration. See more details about [WAL](../storage/#versioning)
* `optimizers_config` - see [optimizer](../optimizer) for details.
* `shard_number` - which defines how many shards the collection should have. See [distributed deployment](../distributed_deployment#sharding) section for details.
* `on_disk_payload` - defines where to store payload data. If `true` - payload will be stored on disk only. Might be useful for limiting the RAM usage in case of large payload.

Default parameters for the optional collection parameters are defined in [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml).

See [schema definitions](https://qdrant.github.io/qdrant/redoc/index.html#operation/create_collection) and a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) for more information about collection parameters.

### Collection with multiple vectors

*Available since v0.10.0*

It is possible to have multiple vectors per record.
This feature allows for multiple vector storages per collection. 
To distinguish vectors in one record, they should have a unique name defined when creating the collection.
Each named vector in this mode has its distance and size:

```http
PUT /collections/{collection_name}

{
    "name": "example_collection",
    "vectors": {
        "image": {
            "size": 4,
            "distance": "Dot"
        },
        "text": {
            "size": 8,
            "distance": "Cosine"
        }
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient(host="localhost", port=6333)

client.recreate_collection(
    name="{collection_name}",
    vectors_config={
        "image": models.VectorParams(size=4, distance=models.Distance.DOT),
        "text": models.VectorParams(size=8, distance=models.Distance.COSINE),
    }
)
```

For rare use cases, it is possible to create a collection without any vector storage.

### Delete collection

```http
DELETE /collections/{collection_name}
```

```python
client.delete_collection(collection_name="{collection_name}")
```

### Update collection parameters

Dynamic parameter updates may be helpful, for example, for more efficient initial loading of vectors.
With these settings, you can disable indexing during the upload process.  And enable it immediately after the upload is finished.
As a result, you will not waste extra computation resources on rebuilding the index.

```http
PATCH /collections/{collection_name}

{
    "optimizers_config": {
        "indexing_threshold": 10000
    }
}
```

```python
client.update_collection(
    collection_name="{collection_name}",
    optimizer_config=models.OptimizersConfigDiff(
        max_segment_size=10000
    )
)
```

This command enables indexing for segments that have more than 10000 vectors stored.

## Collection aliases

In a production environment, it is sometimes necessary to switch different versions of vectors seamlessly.
For example, when upgrading to a new version of the neural network.

There is no way to stop the service and rebuild the collection with new vectors in these situations.
To avoid this, you can use aliases.
Aliases are additional names for existing collections.
All queries to the collection can also be done identically, using an alias instead of the collection name.

Thus, it is possible to build a second collection in the background and then switch alias from the old to the new collection.
Since all changes of aliases happen atomically, no concurrent requests will be affected during the switch.

### Create alias

```http
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

```python
client.update_collection_aliases(
    change_aliases_operations=[
        models.CreateAliasOperation(
            create_alias=models.CreateAlias(
                collection_name="example_collection",
                alias_name="production_collection"
            )
        )
    ]
)
```

### Remove alias

```http
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

```http
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
