---
title: Collections
weight: 30
aliases:
  - ../collections
---

# Collections

A collection is a named set of points (vectors with a payload) among which you can search. The vector of each point within the same collection must have the same dimensionality and be compared by a single metric. [Named vectors](#collection-with-multiple-vectors) can be used to have multiple vectors in a single point, each of which can have their own dimensionality and metric requirements.

Distance metrics are used to measure similarities among vectors.
The choice of metric depends on the way vectors obtaining and, in particular, on the method of neural network encoder training.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - https://en.wikipedia.org/wiki/Dot_product
* Cosine similarity: `Cosine`  - https://en.wikipedia.org/wiki/Cosine_similarity
* Euclidean distance: `Euclid` - https://en.wikipedia.org/wiki/Euclidean_distance

<aside role="status">For search efficiency, Cosine similarity is implemented as dot-product over normalized vectors. Vectors are automatically normalized during upload</aside>

In addition to metrics and vector size, each collection uses its own set of parameters that controls collection optimization, index construction, and vacuum.
These settings can be changed at any time by a corresponding request.

## Setting up multitenancy

**How many collections should you create?** In most cases, you should only use a single collection with payload-based partitioning. This approach is called multitenancy. It is efficient for most of users, but it requires additional configuration. [Learn how to set it up](../../tutorials/multiple-partitions/)

**When should you create multiple collections?** When you have a limited number of users and you need isolation. This approach is flexible, but it may be more costly, since creating numerous collections may result in resource overhead. Also, you need to ensure that they do not affect each other in any way, including performance-wise. 

## Create a collection

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=100, distance=models.Distance.COSINE),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: { size: 100, distance: "Cosine" },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{vectors_config::Config, CreateCollection, Distance, VectorParams, VectorsConfig},
};

//The Rust client uses Qdrant's GRPC interface
let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 100,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        ..Default::default()
    })
    .await?;
```

In addition to the required options, you can also specify custom values for the following collection options:

* `hnsw_config` - see [indexing](../indexing/#vector-index) for details.
* `wal_config` - Write-Ahead-Log related configuration. See more details about [WAL](../storage/#versioning)
* `optimizers_config` - see [optimizer](../optimizer) for details.
* `shard_number` - which defines how many shards the collection should have. See [distributed deployment](../../guides/distributed_deployment#sharding) section for details.
* `on_disk_payload` - defines where to store payload data. If `true` - payload will be stored on disk only. Might be useful for limiting the RAM usage in case of large payload.
* `quantization_config` - see [quantization](../../guides/quantization/#setting-up-quantization-in-qdrant) for details.

Default parameters for the optional collection parameters are defined in [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml).

See [schema definitions](https://qdrant.github.io/qdrant/redoc/index.html#operation/create_collection) and a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) for more information about collection and vector parameters.

*Available as of v1.2.0*

Vectors all live in RAM for very quick access. The `on_disk` parameter can be
set in the vector configuration. If true, all vectors will live on disk. This
will enable the use of
[memmaps](../../concepts/storage/#configuring-memmap-storage),
which is suitable for ingesting a large amount of data.

### Create collection from another collection

*Available as of v1.0.0*

It is possible to initialize a collection from another existing collection.

This might be useful for experimenting quickly with different configurations for the same data set.

Make sure the vectors have the same size and distance function when setting up the vectors configuration in the new collection.

```http
PUT /collections/{collection_name}

{
    "vectors": {
      "size": 100,
      "distance": "Cosine"
    },
    "init_from": {
       "collection": "{from_collection_name}"
    }
}
```

```python
from qdrant_client import QdrantClient
from qdrant_client.http import models

client = QdrantClient("localhost", port=6333)

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=100, distance=models.Distance.COSINE),
    init_from=models.InitFrom(collection="{from_collection_name}"),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: { size: 100, distance: "Cosine" },
  init_from: { collection: "{from_collection_name}" },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{vectors_config::Config, CreateCollection, Distance, VectorParams, VectorsConfig},
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::Params(VectorParams {
                size: 100,
                distance: Distance::Cosine.into(),
                ..Default::default()
            })),
        }),
        init_from_collection: Some("{from_collection_name}".to_string()),
        ..Default::default()
    })
    .await?;
```

### Collection with multiple vectors

*Available as of v0.10.0*

It is possible to have multiple vectors per record.
This feature allows for multiple vector storages per collection. 
To distinguish vectors in one record, they should have a unique name defined when creating the collection.
Each named vector in this mode has its distance and size:

```http
PUT /collections/{collection_name}

{
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

client = QdrantClient("localhost", port=6333)

client.create_collection(
    collection_name="{collection_name}",
    vectors_config={
        "image": models.VectorParams(size=4, distance=models.Distance.DOT),
        "text": models.VectorParams(size=8, distance=models.Distance.COSINE),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    image: { size: 4, distance: "Dot" },
    text: { size: 8, distance: "Cosine" },
  },
});
```

```rust
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        vectors_config::Config, CreateCollection, Distance, VectorParams, VectorParamsMap,
        VectorsConfig,
    },
};

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client
    .create_collection(&CreateCollection {
        collection_name: "{collection_name}".to_string(),
        vectors_config: Some(VectorsConfig {
            config: Some(Config::ParamsMap(VectorParamsMap {
                map: [
                    (
                        "image".to_string(),
                        VectorParams {
                            size: 4,
                            distance: Distance::Dot.into(),
                            ..Default::default()
                        },
                    ),
                    (
                        "text".to_string(),
                        VectorParams {
                            size: 8,
                            distance: Distance::Cosine.into(),
                            ..Default::default()
                        },
                    ),
                ]
                .into(),
            })),
        }),
        ..Default::default()
    })
    .await?;
```

For rare use cases, it is possible to create a collection without any vector storage.

*Available as of v1.1.1*

For each named vector you can optionally specify
[`hnsw_config`](../indexing/#vector-index) or
[`quantization_config`](../../guides/quantization/#setting-up-quantization-in-qdrant) to
deviate from the collection configuration. This can be useful to fine-tune
search performance on a vector level.

*Available as of v1.2.0*

Vectors all live in RAM for very quick access. On a per-vector basis you can set
`on_disk` to true to store all vectors on disk at all times. This will enable
the use of
[memmaps](../../concepts/storage/#configuring-memmap-storage),
which is suitable for ingesting a large amount of data.

### Delete collection

```http
DELETE /collections/{collection_name}
```

```python
client.delete_collection(collection_name="{collection_name}")
```

```typescript
client.deleteCollection("{collection_name}");
```

```rust
client.delete_collection("{collection_name}").await?;
```

### Update collection parameters

Dynamic parameter updates may be helpful, for example, for more efficient initial loading of vectors.
For example, you can disable indexing during the upload process, and enable it immediately after the upload is finished.
As a result, you will not waste extra computation resources on rebuilding the index.

The following command enables indexing for segments that have more than 10000 kB of vectors stored:

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
    optimizer_config=models.OptimizersConfigDiff(indexing_threshold=10000),
)
```

```typescript
client.updateCollection("{collection_name}", {
  optimizers_config: {
    indexing_threshold: 10000,
  },
});
```

```rust
use qdrant_client::qdrant::OptimizersConfigDiff;

client
    .update_collection(
        "{collection_name}",
        &OptimizersConfigDiff {
            indexing_threshold: Some(10000),
            ..Default::default()
        },
    )
    .await?;
```

The following parameters can be updated:

* `optimizers_config` - see [optimizer](../optimizer/) for details.
* `hnsw_config` - see [indexing](../indexing/#vector-index) for details.
* `quantization_config` - see [quantization](../../guides/quantization/#setting-up-quantization-in-qdrant) for details.
* `vectors` - vector-specific configuration, including individual `hnsw_config`, `quantization_config` and `on_disk` settings.
* `params` - other collection parameters, including `write_consistency_factor` and `on_disk_payload`. 

Full API specification is available in [schema definitions](https://qdrant.github.io/qdrant/redoc/index.html#tag/collections/operation/update_collection).

Calls to this endpoint may be blocking as it waits for existing optimizers to
finish. We recommended against using this in a production database as it may
introduce huge overhead due to the rebuilding of the index.

#### Update vector parameters

*Available as of v1.4.0*

<aside role="status">To update vector parameters using the collection update API, you must always specify a vector name. If your collection does not have named vectors, use an empty (<code>""</code>) name.</aside>

Qdrant 1.4 adds support for updating more collection parameters at runtime. HNSW
index, quantization and disk configurations can now be changed without
recreating a collection. Segments (with index and quantized data) will
automatically be rebuilt in the background to match updated parameters.

To put vector data on disk for a collection that **does not have** named vectors,
use `""` as name:

```http
PATCH /collections/{collection_name}

{
    "vectors": {
        "": {
            "on_disk": true
        }
    },
}
```

To put vector data on disk for a collection that **does have** named vectors:

```http
PATCH /collections/{collection_name}

{
    "vectors": {
        "my_vector": {
            "on_disk": true
        }
    },
}
```

In the following example the HNSW index and quantization parameters are updated,
both for the whole collection, and for `my_vector` specifically:

```http
PATCH /collections/{collection_name}

{
    "vectors": {
        "my_vector": {
            "hnsw_config": {
                "m": 32,
                "ef_construct": 123
            },
            "quantization_config": {
                "product": {
                    "compression": "x32",
                    "always_ram": true
                }
            },
            "on_disk": true
        }
    },
    "hnsw_config": {
        "ef_construct": 123
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "quantile": 0.8,
            "always_ram": false
        }
    }
}
```

```python
client.update_collection(
    collection_name="{collection_name}",
    vectors_config={
        "my_vector": models.VectorParamsDiff(
            hnsw_config=models.HnswConfigDiff(
                m=32,
                ef_construct=123,
            ),
            quantization_config=models.ProductQuantization(
                product=models.ProductQuantizationConfig(
                    compression=models.CompressionRatio.X32,
                    always_ram=True,
                ),
            ),
            on_disk=True,
        ),
    },
    hnsw_config=models.HnswConfigDiff(
        ef_construct=123,
    ),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            quantile=0.8,
            always_ram=False,
        ),
    ),
)
```

```typescript
client.updateCollection("{collection_name}", {
  vectors: {
    my_vector: {
      hnsw_config: {
        m: 32,
        ef_construct: 123,
      },
      quantization_config: {
        product: {
          compression: "x32",
          always_ram: true,
        },
      },
      on_disk: true,
    },
  },
  hnsw_config: {
    ef_construct: 123,
  },
  quantization_config: {
    scalar: {
      type: "int8",
      quantile: 0.8,
      always_ram: true,
    },
  },
});
```

<!---
```rust
// Available as of Rust client 1.7.0
// See: <https://github.com/qdrant/rust-client/issues/75>

use qdrant_client::client::QdrantClient;
use qdrant_client::qdrant::{
    quantization_config_diff::Quantization, vectors_config_diff::Config, HnswConfigDiff,
    QuantizationConfigDiff, QuantizationType, ScalarQuantization, VectorParamsDiff,
    VectorsConfigDiff,
};

client
    .update_collection(
        "{collection_name}",
        None,
        None,
        Some(&HnswConfigDiff {
            ef_construct: Some(123),
            ..Default::default()
        }),
        Some(&VectorsConfigDiff {
            config: Some(Config::ParamsMap(
                qdrant_client::qdrant::VectorParamsDiffMap {
                    map: HashMap::from([(
                        ("my_vector".into()),
                        VectorParamsDiff {
                            hnsw_config: Some(HnswConfigDiff {
                                m: Some(32),
                                ef_construct: Some(123),
                                ..Default::default()
                            }),
                            ..Default::default()
                        },
                    )]),
                },
            )),
        }),
        Some(&QuantizationConfigDiff {
            quantization: Some(Quantization::Scalar(ScalarQuantization {
                r#type: QuantizationType::Int8 as i32,
                quantile: Some(0.8),
                always_ram: Some(true),
                ..Default::default()
            })),
        }),
    )
    .await?;
```
--->

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

```typescript
client.getCollection("{collection_name}");
```

```rust
client.collection_info("{collection_name}").await?;
```

If you insert the vectors into the collection, the `status` field may become
`yellow` whilst it is optimizing. It will become `green` once all the points are
successfully processed.

The following color statuses are possible:

- 🟢 `green`: collection is ready
- 🟡 `yellow`: collection is optimizing
- 🔴 `red`: an error occurred which the engine could not recover from

There are some other attributes you might be interested in:

- `points_count` - total number of objects (vectors and their payloads) stored in the collection
- `vectors_count` - total number of vectors in a collection. If there are multiple vectors per object, it won't be equal to `points_count`.
- `indexed_vectors_count` - total number of vectors stored in the HNSW index. Qdrant does not store all the vectors in the index, but only if an index segment might be created for a given configuration.

### Indexing vectors in HNSW

In some cases, you might be surprised the value of `indexed_vectors_count` is lower than `vectors_count`. This is an intended behaviour and
depends on the [optimizer configuration](../optimizer). A new index segment is built if the size of non-indexed vectors is higher than the
value of `indexing_threshold`(in kB).  If your collection is very small or the dimensionality of the vectors is low, there might be no HNSW segment
created and `indexed_vectors_count` might be equal to `0`.

It is possible to reduce the `indexing_threshold` for an existing collection by [updating collection parameters](#update-collection-parameters).

## Collection aliases

In a production environment, it is sometimes necessary to switch different versions of vectors seamlessly.
For example, when upgrading to a new version of the neural network.

There is no way to stop the service and rebuild the collection with new vectors in these situations.
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
                "collection_name": "example_collection",
                "alias_name": "production_collection"
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
                collection_name="example_collection", alias_name="production_collection"
            )
        )
    ]
)
```

```typescript
client.updateCollectionAliases({
  actions: [
    {
      create_alias: {
        collection_name: "example_collection",
        alias_name: "production_collection",
      },
    },
  ],
});
```

```rust
client.create_alias("example_collection", "production_collection").await?;
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

```python
client.update_collection_aliases(
    change_aliases_operations=[
        models.DeleteAliasOperation(
            delete_alias=models.DeleteAlias(alias_name="production_collection")
        ),
    ]
)
```

```typescript
client.updateCollectionAliases({
  actions: [
    {
      delete_alias: {
        alias_name: "production_collection",
      },
    },
  ],
});
```

```rust
client.delete_alias("production_collection").await?;
```

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
                "collection_name": "example_collection",
                "alias_name": "production_collection"
            }
        }
    ]
}
```

```python
client.update_collection_aliases(
    change_aliases_operations=[
        models.DeleteAliasOperation(
            delete_alias=models.DeleteAlias(alias_name="production_collection")
        ),
        models.CreateAliasOperation(
            create_alias=models.CreateAlias(
                collection_name="example_collection", alias_name="production_collection"
            )
        ),
    ]
)
```

```typescript
client.updateCollectionAliases({
  actions: [
    {
      delete_alias: {
        alias_name: "production_collection",
      },
    },
    {
      create_alias: {
        collection_name: "example_collection",
        alias_name: "production_collection",
      },
    },
  ],
});
```

```rust
client.delete_alias("production_collection").await?;
client.create_alias("example_collection", "production_collection").await?;
```

### List collection aliases

```http
GET /collections/{collection_name}/aliases
```

```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

client.get_collection_aliases(collection_name="{collection_name}")
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getCollectionAliases("{collection_name}");
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client.list_collection_aliases("{collection_name}").await?;
```

### List all aliases

```http
GET /aliases
```

```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

client.get_aliases()
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getAliases();
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client.list_aliases().await?;
```

### List all collections

```http
GET /collections
```

```python
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

client.get_collections()
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getCollections();
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("http://localhost:6334").build()?;

client.list_collections().await?;
```
