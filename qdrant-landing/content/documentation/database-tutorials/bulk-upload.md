---
title: Bulk Upload Vectors
aliases:
  - /documentation/tutorials/bulk-upload/
weight: 1
---

# Bulk Upload Vectors to a Qdrant Collection

Uploading a large-scale dataset fast might be a challenge, but Qdrant has a few tricks to help you with that.

The first important detail about data uploading is that the bottleneck is usually located on the client side, not on the server side.
This means that if you are uploading a large dataset, you should prefer a high-performance client library.

We recommend using our [Rust client library](https://github.com/qdrant/rust-client) for this purpose, as it is the fastest client library available for Qdrant.

If you are not using Rust, you might want to consider parallelizing your upload process.

## Choose an Indexing Strategy

Qdrant incrementally builds an HNSW index for dense vectors as new data arrives. This ensures fast search, but indexing is memory- and CPU-intensive. During bulk ingestion, frequent index updates can reduce throughput and increase resource usage.

To control this behavior and optimize for your system’s limits, adjust the following parameters:

| Your Goal                                 | What to Do                                      | Configuration                                      |
|-------------------------------------------|-------------------------------------------------|----------------------------------------------------|
| Fastest upload, tolerate high RAM usage           | Disable indexing completely                     | `indexing_threshold: 0`                           |
| Low memory usage during upload            | Defer HNSW graph construction (recommended)                  | `m: 0`                 |
| Faster index availability after upload       | Keep indexing enabled (default behavior)        | `m: 16`, `indexing_threshold: 20000` *(default)* |

Indexing must be re-enabled after upload to activate fast HNSW search if it was disabled during ingestion.


### Defer HNSW graph construction (`m: 0`)

For dense vectors, setting the HNSW `m` parameter to `0` disables index building entirely. Vectors will still be stored, but not indexed until you enable indexing later.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {
        "m": 0
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        m=0,
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  hnsw_config: {
    m: 0,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .hnsw_config(HnswConfigDiffBuilder::default().m(0)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
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
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setM(0).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	hnswConfig: new HnswConfigDiff { M = 0 }
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
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	HnswConfig: &qdrant.HnswConfigDiff{
		M:        qdrant.PtrOf(uint64(0)),
	},
})
```

Once ingestion is complete, re-enable HNSW by setting `m` to your production value (usually 16 or 32).

```http
PATCH /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {
        "m": 16
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.update_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    hnsw_config=models.HnswConfigDiff(
        m=16,
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.updateCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  hnsw_config: {
    m: 16,
  },
});
```

```rust
use qdrant_client::qdrant::{
    UpdateCollectionBuilder, HnswConfigDiffBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .hnsw_config(HnswConfigDiffBuilder::default().m(16)),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setHnswConfig(HnswConfigDiff.newBuilder().setM(16).build())
        .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	hnswConfig: new HnswConfigDiff { M = 16 }
);
```

```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client, err := client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	HnswConfig: &qdrant.HnswConfigDiff{
		M:        qdrant.PtrOf(uint64(16)),
	},
})
```

### Disable indexing completely (`indexing_threshold: 0`)

In case you are doing an initial upload of a large dataset, you might want to disable indexing during upload. It will enable to avoid unnecessary indexing of vectors, which will be overwritten by the next batch.

Setting `indexing_threshold` to `0` disables indexing altogether:

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "indexing_threshold": 0
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(
        indexing_threshold=0,
    ),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  optimizers_config: {
    indexing_threshold: 0,
  },
});
```

```rust
use qdrant_client::qdrant::{
    OptimizersConfigDiffBuilder, UpdateCollectionBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .optimizers_config(OptimizersConfigDiffBuilder::default().indexing_threshold(0)),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.createCollectionAsync(
    CreateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setVectorsConfig(
            VectorsConfig.newBuilder()
                .setParams(
                    VectorParams.newBuilder()
                        .setSize(768)
                        .setDistance(Distance.Cosine)
                        .build())
                .build())
        .setOptimizersConfig(
            OptimizersConfigDiff.newBuilder()
                .setIndexingThreshold(0)
                .build())
        .build()
).get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
    collectionName: "{collection_name}",
    vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
    optimizersConfig: new OptimizersConfigDiff { IndexingThreshold = 0 }
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
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		IndexingThreshold: qdrant.PtrOf(uint64(0)),
	},
})
```

<aside role="status">
With indexing_threshold set to 0, storage won't be optimized properly, which can lead to high RAM usage as segments accumulate in memory.
</aside>

After upload is done, you can enable indexing by setting `indexing_threshold` to a desired value (default is 20000):

```http
PATCH /collections/{collection_name}
{
    "optimizers_config": {
        "indexing_threshold": 20000
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.update_collection(
    collection_name="{collection_name}",
    optimizer_config=models.OptimizersConfigDiff(indexing_threshold=20000),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.updateCollection("{collection_name}", {
  optimizers_config: {
    indexing_threshold: 20000,
  },
});
```

```rust
use qdrant_client::qdrant::{
    OptimizersConfigDiffBuilder, UpdateCollectionBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .optimizers_config(OptimizersConfigDiffBuilder::default().indexing_threshold(20000)),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setOptimizersConfig(
            OptimizersConfigDiff.newBuilder()
                .setIndexingThreshold(20000)
                .build()
        )
        .build()
).get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
    collectionName: "{collection_name}",
    optimizersConfig: new OptimizersConfigDiff { IndexingThreshold = 20000 }
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
		IndexingThreshold: qdrant.PtrOf(uint64(20000)),
	},
})
```



At this point, Qdrant will begin indexing new and previously unindexed segments in the background.

## Upload directly to disk

When the vectors you upload do not all fit in RAM, you likely want to use
[memmap](/documentation/concepts/storage/#configuring-memmap-storage)
support.

During collection
[creation](/documentation/concepts/collections/#create-collection),
memmaps may be enabled on a per-vector basis using the `on_disk` parameter. This
will store vector data directly on disk at all times. It is suitable for
ingesting a large amount of data, essential for the billion scale benchmark.

Using `memmap_threshold` is not recommended in this case. It would require
the [optimizer](/documentation/concepts/optimizer/) to constantly
transform in-memory segments into memmap segments on disk. This process is
slower, and the optimizer can be a bottleneck when ingesting a large amount of
data.

Read more about this in
[Configuring Memmap Storage](/documentation/concepts/storage/#configuring-memmap-storage).

## Parallel upload into multiple shards

In Qdrant, each collection is split into shards. Each shard has a separate Write-Ahead-Log (WAL), which is responsible for ordering operations.
By creating multiple shards, you can parallelize upload of a large dataset. From 2 to 4 shards per one machine is a reasonable number.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "shard_number": 2
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    shard_number=2,
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  shard_number: 2,
});
```

```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .shard_number(2),
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
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setShardNumber(2)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	shardNumber: 2
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
		Size:     768,
		Distance: qdrant.Distance_Cosine,
	}),
	ShardNumber: qdrant.PtrOf(uint32(2)),
})
```