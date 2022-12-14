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

<aside role="status">For search efficiency, Cosine similarity is implemented as dot-product over normalized vectors. Vectors are automatically normalized during upload</aside>

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
    collection_name="{collection_name}",
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
    collection_name="{collection_name}",
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

## Collection info

Qdrant allows determining the configuration parameters of an existing collection to better understand how the points are
distributed and indexed. 

```http
GET /collections/{collection_name}

{
    "result": {
        "status": "green",
        "optimizer_status": "ok",
        "vectors_count": 1068786,
        "indexed_vectors_count": 1024232,
        "points_count": 1068786,
        "segments_count": 31,
        "config": {
            "params": {
                "vectors": {
                    "size": 384,
                    "distance": "Cosine"
                },
                "shard_number": 1,
                "replication_factor": 1,
                "write_consistency_factor": 1,
                "on_disk_payload": false
            },
            "hnsw_config": {
                "m": 16,
                "ef_construct": 100,
                "full_scan_threshold": 10000,
                "max_indexing_threads": 0
            },
            "optimizer_config": {
                "deleted_threshold": 0.2,
                "vacuum_min_vector_number": 1000,
                "default_segment_number": 0,
                "max_segment_size": null,
                "memmap_threshold": null,
                "indexing_threshold": 20000,
                "flush_interval_sec": 5,
                "max_optimization_threads": 1
            },
            "wal_config": {
                "wal_capacity_mb": 32,
                "wal_segments_ahead": 0
            }
        },
        "payload_schema": {}
    },
    "status": "ok",
    "time": 0.00010143
}
```

```python
client.get_collection(collection_name="{collection_name}")
```

If you insert the vectors into the collection, the `status` field will become `green` once all the points are already processed. 
In case the optimization is still running, it will be `yellow`, and might be set to `red` if there were some errors the engine 
could not recover from.

There are, however, some other attributes you might be interested in:

- `points_count` - total number of objects (vectors and their payloads) stored in the collection
- `vectors_count` - total number of vectors in a collection. If there are multiple vectors per object, it won't be equal to `points_count`.
- `indexed_vectors_count` - total number of vectors stored in the HNSW index. Qdrant does not store all the vectors in the index, but only if an index segment might be created for a given configuration.

### Indexing vectors in HNSW

In some cases, you might be surprised the value of `indexed_vectors_count` is lower than `vectors_count`. This is an intended behaviour and
depends on the [optimizer configuration](../optimizer). A new index segment is built if the size of non-indexed vectors is higher than the
value of `indexing_threshold`(in KB).  If your collection is very small or the dimensionality of the vectors is low, there might be no HNSW segment
created and `indexed_vectors_count` might be equal to `0`.

It is possible to reduce the `indexing_threshold` for an existing collection by [updating collection parameters](#update-collection-parameters).

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
