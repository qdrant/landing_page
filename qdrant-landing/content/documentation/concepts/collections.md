---
title: Collections
weight: 30
aliases:
  - ../collections
  - /concepts/collections/
  - /documentation/frameworks/fondant/documentation/concepts/collections/
---

# Collections

A collection is a named set of points (vectors with a payload) among which you can search. The vector of each point within the same collection must have the same dimensionality and be compared by a single metric. [Named vectors](#collection-with-multiple-vectors) can be used to have multiple vectors in a single point, each of which can have their own dimensionality and metric requirements.

Distance metrics are used to measure similarities among vectors.
The choice of metric depends on the way vectors obtaining and, in particular, on the method of neural network encoder training.

Qdrant supports these most popular types of metrics:

* Dot product: `Dot` - [[wiki]](https://en.wikipedia.org/wiki/Dot_product)
* Cosine similarity: `Cosine`  - [[wiki]](https://en.wikipedia.org/wiki/Cosine_similarity)
* Euclidean distance: `Euclid` - [[wiki]](https://en.wikipedia.org/wiki/Euclidean_distance)
* Manhattan distance: `Manhattan` - [[wiki]](https://en.wikipedia.org/wiki/Taxicab_geometry)

<aside role="status">For search efficiency, Cosine similarity is implemented as dot-product over normalized vectors. Vectors are automatically normalized during upload</aside>

In addition to metrics and vector size, each collection uses its own set of parameters that controls collection optimization, index construction, and vacuum.
These settings can be changed at any time by a corresponding request.

## Setting up multitenancy

**How many collections should you create?** In most cases, you should only use a single collection with payload-based partitioning. This approach is called [multitenancy](https://en.wikipedia.org/wiki/Multitenancy). It is efficient for most of users, but it requires additional configuration. [Learn how to set it up](/documentation/tutorials/multiple-partitions/)

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

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    } 
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

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
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, VectorParamsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(100, Distance::Cosine)),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.createCollectionAsync("{collection_name}",
        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(100).build()).get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 100, Distance = Distance.Cosine }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     100,
		Distance: qdrant.Distance_Cosine,
	}),
})
```

In addition to the required options, you can also specify custom values for the following collection options:

* `hnsw_config` - see [indexing](/documentation/concepts/indexing/#vector-index) for details.
* `wal_config` - Write-Ahead-Log related configuration. See more details about [WAL](/documentation/concepts/storage/#versioning)
* `optimizers_config` - see [optimizer](/documentation/concepts/optimizer/) for details.
* `shard_number` - which defines how many shards the collection should have. See [distributed deployment](/documentation/guides/distributed_deployment/#sharding) section for details.
* `on_disk_payload` - defines where to store payload data. If `true` - payload will be stored on disk only. Might be useful for limiting the RAM usage in case of large payload.
* `quantization_config` - see [quantization](/documentation/guides/quantization/#setting-up-quantization-in-qdrant) for details.

Default parameters for the optional collection parameters are defined in [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml).

See [schema definitions](https://api.qdrant.tech/api-reference/collections/create-collection) and a [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) for more information about collection and vector parameters.

*Available as of v1.2.0*

Vectors all live in RAM for very quick access. The `on_disk` parameter can be
set in the vector configuration. If true, all vectors will live on disk. This
will enable the use of
[memmaps](/documentation/concepts/storage/#configuring-memmap-storage),
which is suitable for ingesting a large amount of data.

### Create collection from another collection

*Available as of v1.0.0*

It is possible to initialize a collection from another existing collection.

This might be useful for experimenting quickly with different configurations for the same data set.

<aside role="alert"> Usage of the <code>init_from</code> can create unpredictable load on the qdrant cluster. It is not recommended to use <code>init_from</code> in performance-sensitive environments.</aside>

Make sure the vectors have the same `size` and `distance` function when setting up the vectors configuration in the new collection. If you used the previous sample
code, `"size": 300` and `"distance": "Cosine"`.


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

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    },
    "init_from": {
       "collection": {from_collection_name}
    }
  }'
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

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
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(100, Distance::Cosine))
            .init_from_collection("{from_collection_name}"),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(100)
                            .setDistance(Distance.Cosine)
                            .build()))
            .setInitFromCollection("{from_collection_name}")
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 100, Distance = Distance.Cosine },
	initFromCollection: "{from_collection_name}"
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     100,
		Distance: qdrant.Distance_Cosine,
	}),
	InitFromCollection: qdrant.PtrOf("{from_collection_name}"),
})
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

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
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
    }'
```

```python
from qdrant_client import QdrantClient, models


client = QdrantClient(url="http://localhost:6333")

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
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, VectorParamsBuilder, VectorsConfigBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut vectors_config = VectorsConfigBuilder::default();
vectors_config
    .add_named_vector_params("image", VectorParamsBuilder::new(4, Distance::Dot).build());
vectors_config.add_named_vector_params(
    "text",
    VectorParamsBuilder::new(8, Distance::Cosine).build(),
);

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}").vectors_config(vectors_config),
    )
    .await?;
```

```java
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        "{collection_name}",
        Map.of(
            "image", VectorParams.newBuilder().setSize(4).setDistance(Distance.Dot).build(),
            "text",
                VectorParams.newBuilder().setSize(8).setDistance(Distance.Cosine).build()))
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParamsMap
	{
		Map =
		{
			["image"] = new VectorParams { Size = 4, Distance = Distance.Dot },
			["text"] = new VectorParams { Size = 8, Distance = Distance.Cosine },
		}
	}
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"image": {
				Size:     4,
				Distance: qdrant.Distance_Dot,
			},
			"text": {
				Size:     8,
				Distance: qdrant.Distance_Cosine,
			},
		}),
})
```

For rare use cases, it is possible to create a collection without any vector storage.

*Available as of v1.1.1*

For each named vector you can optionally specify
[`hnsw_config`](/documentation/concepts/indexing/#vector-index) or
[`quantization_config`](/documentation/guides/quantization/#setting-up-quantization-in-qdrant) to
deviate from the collection configuration. This can be useful to fine-tune
search performance on a vector level.

*Available as of v1.2.0*

Vectors all live in RAM for very quick access. On a per-vector basis you can set
`on_disk` to true to store all vectors on disk at all times. This will enable
the use of
[memmaps](/documentation/concepts/storage/#configuring-memmap-storage),
which is suitable for ingesting a large amount of data.


### Vector datatypes

*Available as of v1.9.0*

Some embedding providers may provide embeddings in a pre-quantized format.
One of the most notable examples is the [Cohere int8 & binary embeddings](https://cohere.com/blog/int8-binary-embeddings).
Qdrant has direct support for uint8 embeddings, which you can also use in combination with binary quantization.

To create a collection with uint8 embeddings, you can use the following configuration:

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 1024,
      "distance": "Cosine",
      "datatype": "uint8"
    }
}
```

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
      "size": 1024,
      "distance": "Cosine",
      "datatype": "uint8"
    }
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=1024,
        distance=models.Distance.COSINE,
        datatype=models.Datatype.UINT8,
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    image: { size: 1024, distance: "Cosine", datatype: "uint8" },
  },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, VectorParamsBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}").vectors_config(
            VectorParamsBuilder::new(1024, Distance::Cosine).datatype(Datatype::Uint8),
        ),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync("{collection_name}",
        VectorParams.newBuilder()
            .setSize(1024)
            .setDistance(Distance.Cosine)
            .setDatatype(Datatype.Uint8)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
  collectionName: "{collection_name}",
  vectorsConfig: new VectorParams {
    Size = 1024, Distance = Distance.Cosine, Datatype = Datatype.Uint8
  }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     1024,
		Distance: qdrant.Distance_Cosine,
		Datatype: qdrant.Datatype_Uint8.Enum(),
	}),
})
```

Vectors with `uint8` datatype are stored in a more compact format, which can save memory and improve search speed at the cost of some precision.
If you choose to use the `uint8` datatype, elements of the vector will be stored as unsigned 8-bit integers, which can take values **from 0 to 255**.


### Collection with sparse vectors

*Available as of v1.7.0*

Qdrant supports sparse vectors as a first-class citizen.

Sparse vectors are useful for text search, where each word is represented as a separate dimension.

Collections can contain sparse vectors as additional [named vectors](#collection-with-multiple-vectors) along side regular dense vectors in a single point.

Unlike dense vectors, sparse vectors must be named.
And additionally, sparse vectors and dense vectors must have different names within a collection.

```http
PUT /collections/{collection_name}
{
    "sparse_vectors": {
        "text": { },
    }
}
```

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "sparse_vectors": {
        "text": { }
    }
  }'
```


```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    sparse_vectors_config={
        "text": models.SparseVectorParams(),
    },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  sparse_vectors: {
    text: { },
  },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, SparseVectorParamsBuilder, SparseVectorsConfigBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut sparse_vector_config = SparseVectorsConfigBuilder::default();

sparse_vector_config.add_named_vector_params("text", SparseVectorParamsBuilder::default());

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .sparse_vectors_config(sparse_vector_config),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setSparseVectorsConfig(
                SparseVectorConfig.newBuilder()
                    .putMap("text", SparseVectorParams.getDefaultInstance()))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	sparseVectorsConfig: ("text", new SparseVectorParams())
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_namee}",
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"text": {},
		}),
})
```

Outside of a unique name, there are no required configuration parameters for sparse vectors.

The distance function for sparse vectors is always `Dot` and does not need to be specified.

However, there are optional parameters to tune the underlying [sparse vector index](/documentation/concepts/indexing/#sparse-vector-index).

### Check collection existence

*Available as of v1.8.0*

```http
GET http://localhost:6333/collections/{collection_name}/exists
```

```bash
curl -X GET http://localhost:6333/collections/{collection_name}/exists
```

```python
client.collection_exists(collection_name="{collection_name}")
```

```typescript
client.collectionExists("{collection_name}");
```

```rust
client.collection_exists("{collection_name}").await?;
```

```java
client.collectionExistsAsync("{collection_name}").get();
```

```csharp
await client.CollectionExistsAsync("{collection_name}");
```

```go
import "context"

client.CollectionExists(context.Background(), "my_collection")
```

### Delete collection

```http
DELETE http://localhost:6333/collections/{collection_name}
```

```bash
curl -X DELETE http://localhost:6333/collections/{collection_name}
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

```java
client.deleteCollectionAsync("{collection_name}").get();
```

```csharp
await client.DeleteCollectionAsync("{collection_name}");
```

```go
import "context"

client.DeleteCollection(context.Background(), "{collection_name}")
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

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "optimizers_config": {
        "indexing_threshold": 10000
    }
  }'
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
use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").optimizers_config(
            OptimizersConfigDiffBuilder::default().indexing_threshold(10000),
        ),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setOptimizersConfig(
            OptimizersConfigDiff.newBuilder().setIndexingThreshold(10000).build())
        .build());
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	optimizersConfig: new OptimizersConfigDiff { IndexingThreshold = 10000 }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		IndexingThreshold: qdrant.PtrOf(uint64(10000)),
	},
})
```

The following parameters can be updated:

* `optimizers_config` - see [optimizer](/documentation/concepts/optimizer/) for details.
* `hnsw_config` - see [indexing](/documentation/concepts/indexing/#vector-index) for details.
* `quantization_config` - see [quantization](/documentation/guides/quantization/#setting-up-quantization-in-qdrant) for details.
* `vectors` - vector-specific configuration, including individual `hnsw_config`, `quantization_config` and `on_disk` settings.
* `params` - other collection parameters, including `write_consistency_factor` and `on_disk_payload`. 

Full API specification is available in [schema definitions](https://api.qdrant.tech/api-reference/collections/update-collection).

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
    }
}
```

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
        "": { 
            "on_disk": true 
      }
    }
  }'
```


To put vector data on disk for a collection that **does have** named vectors:

Note: To create a vector name, follow the procedure from our [Points](/documentation/concepts/points/#create-vector-name).


```http
PATCH /collections/{collection_name}
{
    "vectors": {
        "my_vector": {
            "on_disk": true
        }
    }
}
```

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
        "my_vector": { 
           "on_disk": true 
      }
    }
  }'
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

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
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
}'
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

```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{
    quantization_config_diff::Quantization, vectors_config_diff::Config, HnswConfigDiffBuilder,
    QuantizationType, ScalarQuantizationBuilder, UpdateCollectionBuilder, VectorParamsDiffBuilder,
    VectorParamsDiffMap,
};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .hnsw_config(HnswConfigDiffBuilder::default().ef_construct(123))
            .vectors_config(Config::ParamsMap(VectorParamsDiffMap {
                map: HashMap::from([(
                    ("my_vector".into()),
                    VectorParamsDiffBuilder::default()
                        .hnsw_config(HnswConfigDiffBuilder::default().m(32).ef_construct(123))
                        .build(),
                )]),
            }))
            .quantization_config(Quantization::Scalar(
                ScalarQuantizationBuilder::default()
                    .r#type(QuantizationType::Int8.into())
                    .quantile(0.8)
                    .always_ram(true)
                    .build(),
            )),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.VectorParamsDiff;
import io.qdrant.client.grpc.Collections.VectorParamsDiffMap;
import io.qdrant.client.grpc.Collections.VectorsConfigDiff;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setHnswConfig(HnswConfigDiff.newBuilder().setEfConstruct(123).build())
            .setVectorsConfig(
                VectorsConfigDiff.newBuilder()
                    .setParamsMap(
                        VectorParamsDiffMap.newBuilder()
                            .putMap(
                                "my_vector",
                                VectorParamsDiff.newBuilder()
                                    .setHnswConfig(
                                        HnswConfigDiff.newBuilder()
                                            .setM(3)
                                            .setEfConstruct(123)
                                            .build())
                                    .build())))
            .setQuantizationConfig(
                QuantizationConfigDiff.newBuilder()
                    .setScalar(
                        ScalarQuantization.newBuilder()
                            .setType(QuantizationType.Int8)
                            .setQuantile(0.8f)
                            .setAlwaysRam(true)
                            .build()))
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	hnswConfig: new HnswConfigDiff { EfConstruct = 123 },
	vectorsConfig: new VectorParamsDiffMap
	{
		Map =
		{
			{
				"my_vector",
				new VectorParamsDiff
				{
					HnswConfig = new HnswConfigDiff { M = 3, EfConstruct = 123 }
				}
			}
		}
	},
	quantizationConfig: new QuantizationConfigDiff
	{
		Scalar = new ScalarQuantization
		{
			Type = QuantizationType.Int8,
			Quantile = 0.8f,
			AlwaysRam = true
		}
	}
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfigDiffMap(
		map[string]*qdrant.VectorParamsDiff{
			"my_vector": {
				HnswConfig: &qdrant.HnswConfigDiff{
					M:           qdrant.PtrOf(uint64(3)),
					EfConstruct: qdrant.PtrOf(uint64(123)),
				},
			},
		}),
	QuantizationConfig: qdrant.NewQuantizationDiffScalar(
		&qdrant.ScalarQuantization{
			Type:      qdrant.QuantizationType_Int8,
			Quantile:  qdrant.PtrOf(float32(0.8)),
			AlwaysRam: qdrant.PtrOf(true),
		}),
})
```

## Collection info

Qdrant allows determining the configuration parameters of an existing collection to better understand how the points are
distributed and indexed.

```http
GET /collections/{collection_name}
```

```bash
curl -X GET http://localhost:6333/collections/{collection_name}
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

```java
client.getCollectionInfoAsync("{collection_name}").get();
```

```csharp
await client.GetCollectionInfoAsync("{collection_name}");
```

```go
import "context"

client.GetCollectionInfo(context.Background(), "{collection_name}")
```

<details>
<summary>Expected result</summary>

```json
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

</details>

If you insert the vectors into the collection, the `status` field may become
`yellow` whilst it is optimizing. It will become `green` once all the points are
successfully processed.

The following color statuses are possible:

- 🟢 `green`: collection is ready
- 🟡 `yellow`: collection is optimizing
- ⚫ `grey`: collection is pending optimization ([help](#grey-collection-status))
- 🔴 `red`: an error occurred which the engine could not recover from

### Grey collection status

_Available as of v1.9.0_

A collection may have the grey ⚫ status or show "optimizations pending,
awaiting update operation" as optimization status. This state is normally caused
by restarting a Qdrant instance while optimizations were ongoing.

It means the collection has optimizations pending, but they are paused. You must
send any update operation to trigger and start the optimizations again.

For example:

```http
PATCH /collections/{collection_name}
{
    "optimizers_config": {}
}
```

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "optimizers_config": {}
  }'
```

```python
client.update_collection(
    collection_name="{collection_name}",
    optimizer_config=models.OptimizersConfigDiff(),
)
```

```typescript
client.updateCollection("{collection_name}", {
  optimizers_config: {},
});
```

```rust
use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .optimizers_config(OptimizersConfigDiffBuilder::default()),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setOptimizersConfig(
            OptimizersConfigDiff.getDefaultInstance())
        .build());
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	optimizersConfig: new OptimizersConfigDiff { }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName:   "{collection_name}",
	OptimizersConfig: &qdrant.OptimizersConfigDiff{},
})
```

### Approximate point and vector counts

You may be interested in the count attributes:

- `points_count` - total number of objects (vectors and their payloads) stored in the collection
- `vectors_count` - total number of vectors in a collection, useful if you have multiple vectors per point
- `indexed_vectors_count` - total number of vectors stored in the HNSW or sparse index. Qdrant does not store all the vectors in the index, but only if an index segment might be created for a given configuration.

The above counts are not exact, but should be considered approximate. Depending
on how you use Qdrant these may give very different numbers than what you may
expect. It's therefore important **not** to rely on them.

More specifically, these numbers represent the count of points and vectors in
Qdrant's internal storage. Internally, Qdrant may temporarily duplicate points
as part of automatic optimizations. It may keep changed or deleted points for a
bit. And it may delay indexing of new points. All of that is for optimization
reasons.

Updates you do are therefore not directly reflected in these numbers. If you see
a wildly different count of points, it will likely resolve itself once a new
round of automatic optimizations has completed.

To clarify: these numbers don't represent the exact amount of points or vectors
you have inserted, nor does it represent the exact number of distinguishable
points or vectors you can query. If you want to know exact counts, refer to the
[count API](/documentation/concepts/points/#counting-points).

_Note: these numbers may be removed in a future version of Qdrant._

### Indexing vectors in HNSW

In some cases, you might be surprised the value of `indexed_vectors_count` is lower than `vectors_count`. This is an intended behaviour and
depends on the [optimizer configuration](/documentation/concepts/optimizer/). A new index segment is built if the size of non-indexed vectors is higher than the
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

```bash
curl -X POST http://localhost:6333/collections/aliases \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "actions": [
        {
            "create_alias": {
                "collection_name": "example_collection",
                "alias_name": "production_collection"
            }
        }
    ]
}'
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
use qdrant_client::qdrant::CreateAliasBuilder;

client
    .create_alias(CreateAliasBuilder::new(
        "example_collection",
        "production_collection",
    ))
    .await?;
```

```java
client.createAliasAsync("production_collection", "example_collection").get();
```

```csharp
await client.CreateAliasAsync(aliasName: "production_collection", collectionName: "example_collection");
```

```go
import "context"

client.CreateAlias(context.Background(), "production_collection", "example_collection")
```

### Remove alias

```bash
curl -X POST http://localhost:6333/collections/aliases \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "actions": [
        {
            "delete_alias": {
                "alias_name": "production_collection"
            }
        }
    ]
}'
```

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

```java
client.deleteAliasAsync("production_collection").get();
```

```csharp
await client.DeleteAliasAsync("production_collection");
```

```go
import "context"

client.DeleteAlias(context.Background(), "production_collection")
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

```bash
curl -X POST http://localhost:6333/collections/aliases \
  -H 'Content-Type: application/json' \
  --data-raw '{
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
}'
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
use qdrant_client::qdrant::CreateAliasBuilder;

client.delete_alias("production_collection").await?;
client
    .create_alias(CreateAliasBuilder::new(
        "example_collection",
        "production_collection",
    ))
    .await?;
```

```java
client.deleteAliasAsync("production_collection").get();
client.createAliasAsync("production_collection", "example_collection").get();
```

```csharp
await client.DeleteAliasAsync("production_collection");
await client.CreateAliasAsync(aliasName: "production_collection", collectionName: "example_collection");
```

```go
import "context"

client.DeleteAlias(context.Background(), "production_collection")
client.CreateAlias(context.Background(), "production_collection", "example_collection")
```

### List collection aliases

```http
GET /collections/{collection_name}/aliases
```

```bash
curl -X GET http://localhost:6333/collections/{collection_name}/aliases
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.get_collection_aliases(collection_name="{collection_name}")
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getCollectionAliases("{collection_name}");
```

```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.list_collection_aliases("{collection_name}").await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.listCollectionAliasesAsync("{collection_name}").get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.ListCollectionAliasesAsync("{collection_name}");
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.ListCollectionAliases(context.Background(), "{collection_name}")
```

### List all aliases

```http
GET /aliases
```

```bash
curl -X GET http://localhost:6333/aliases
```


```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.get_aliases()
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getAliases();
```

```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.list_aliases().await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.listAliasesAsync().get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.ListAliasesAsync();
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.ListAliases(context.Background())
```

### List all collections

```http
GET /collections
```

```bash
curl -X GET http://localhost:6333/collections
```


```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.get_collections()
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.getCollections();
```

```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.list_collections().await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.listCollectionsAsync().get();
```

```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.ListCollectionsAsync();
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.ListCollections(context.Background())
```
