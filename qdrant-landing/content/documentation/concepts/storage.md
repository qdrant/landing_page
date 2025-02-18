---
title: Storage
weight: 80
aliases:
  - ../storage
---

# Storage

A Qdrant collection can be split into multiple shards. Each shard is a separate storage unit. By default, a collection is created with a single [shard](/documentation/concepts/sharding/). They are used to distribute data across nodes in a cluster, enabling parallel processing and improving performance. 

From a storage perspective, data within a shard is organized into segments. Each segment independently manages its vector and payload storage, along with their respective indexes.

![Storage Architecture](/documentation/concepts/storage/storage-architecture.png)

Typically, data in segments does not overlap. If the same data point is stored in multiple segments, it won't cause issues because the search process includes a deduplication mechanism.

Segments are made up of:
- Vector and Payload Storage
- Vector and Payload [Indexes](/documentation/concepts/indexing/)
- An ID mapper that links internal and external IDs

Segments can be either `appendable` or `non-appendable`:
- **Appendable segments**: You can add, delete, and query data freely.
- **Non-appendable segments**: You can only read and delete data.

Each collection can have segments that are configured differently, but it must include at least one `appendable` segment.

## Vector Storage

Qdrant offers two main options for storing vectors, depending on your application's needs. The choice affects search speed and RAM usage:

- **In-Memory storage**: 
  - Stores all vectors in RAM.
  - Offers the highest speed because disk access is only needed for saving data.

- **On-Disk storage**:
  - Uses a virtual address space linked to a file on disk. [Learn more](https://en.wikipedia.org/wiki/Memory-mapped_file).
  - Vectors aren't loaded directly into RAM. Instead, they use the page cache to access file contents.
  - This method allows flexible memory use and can be nearly as fast as in-memory storage if enough RAM is available.

### Configuring On-Disk Storage

You can store your data on disk in two ways:

- **Enable `on_disk` option**: Use this setting in the collection creation API to store vectors on disk.

*Available as of v1.2.0*


```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "on_disk": true
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768, distance=models.Distance.COSINE, on_disk=True
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
    on_disk: true,
  },
});
```

```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).on_disk(true)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        "{collection_name}",
        VectorParams.newBuilder()
            .setSize(768)
            .setDistance(Distance.Cosine)
            .setOnDisk(true)
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	"{collection_name}",
	new VectorParams
	{
		Size = 768,
		Distance = Distance.Cosine,
		OnDisk = true
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
		Size:     768,
		Distance: qdrant.Distance_Cosine,
		OnDisk:   qdrant.PtrOf(true),
	}),
})
```

When you enable **On-Disk** storage, all vectors in a collection are stored on disk immediately. This is recommended if your Qdrant instance uses fast disks and handles large collections.

To configure when segments switch to **On-Disk** storage, use the `memmap_threshold` option. You can set this threshold in two ways:

1. **Globally**: Adjust the `memmap_threshold` parameter in the [configuration file](/documentation/guides/configuration/).
2. **Per Collection**: Set the threshold during the [creation](/documentation/concepts/collections/#create-collection) or [update](/documentation/concepts/collections/#update-collection-parameters) of each collection.

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "memmap_threshold": 20000
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
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
    memmap_threshold: 20000,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, OptimizersConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .optimizers_config(OptimizersConfigDiffBuilder::default().memmap_threshold(20000)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.VectorParams;

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
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder().setMemmapThreshold(20000).build())
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
	optimizersConfig: new OptimizersConfigDiff { MemmapThreshold = 20000 }
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
		MaxSegmentSize: qdrant.PtrOf(uint64(20000)),
	},
})
```

The rule of thumb for setting the `memmap_threshold` is straightforward:

- **Balanced Use**: Set `memmap_threshold` equal to `indexing_threshold` (default is 20000). This way, the optimizer handles all thresholds together without extra runs.
- **High Write Load & Low RAM**: Set `memmap_threshold` lower than `indexing_threshold`, e.g., 10000. This prioritizes converting segments to Memmap storage before indexing.

Additionally, **On-Disk** storage can be used for the HNSW index. To enable this, set the `hnsw_config.on_disk` parameter to `true` during collection [creation](/documentation/concepts/collections/#create-a-collection) or [updating](/documentation/concepts/collections/#update-collection-parameters).

```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "optimizers_config": {
        "memmap_threshold": 20000
    },
    "hnsw_config": {
        "on_disk": true
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
    hnsw_config=models.HnswConfigDiff(on_disk=True),
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
    memmap_threshold: 20000,
  },
  hnsw_config: {
    on_disk: true,
  },
});
```

```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, OptimizersConfigDiffBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .optimizers_config(OptimizersConfigDiffBuilder::default().memmap_threshold(20000))
            .hnsw_config(HnswConfigDiffBuilder::default().on_disk(true)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
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
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder().setMemmapThreshold(20000).build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setOnDisk(true).build())
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
	optimizersConfig: new OptimizersConfigDiff { MemmapThreshold = 20000 },
	hnswConfig: new HnswConfigDiff { OnDisk = true }
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
		MaxSegmentSize: qdrant.PtrOf(uint64(20000)),
	},
	HnswConfig: &qdrant.HnswConfigDiff{
		OnDisk: qdrant.PtrOf(true),
	},
})
```

## Payload Storage

Qdrant supports two types of payload storage: **In-Memory** and **On-Disk**.

- **In-Memory Storage**:
  - Loads payload data into RAM at startup.
  - Uses disk and [RocksDB](https://rocksdb.org/) for persistence.
  - Fast access but requires a lot of RAM, especially for large payloads like text or images.

- **On-Disk Storage**:
  - Reads and writes payloads directly to [Gridstore](/articles/gridstore-key-value-storage/).
  - Requires less RAM but has higher access latency.
  - If querying vectors with payload-based conditions, create a payload index for each field to avoid disk access. Indexed fields are kept in RAM.

You can choose the type of payload storage in the [configuration file](/documentation/guides/configuration/) or by setting the `on_disk_payload` parameter when [creating](/documentation/concepts/collections/#create-collection) a collection.

## Versioning

Qdrant ensures data integrity through a two-stage process:

1. **Write-Ahead Log (WAL)**:
   - All data changes are first written to the WAL.
   - The WAL orders operations and assigns them a sequential number.
   - Changes in the WAL are safe from power loss.

2. **Segment Updates**:
   - Changes are then applied to segments.
   - Each segment keeps the latest version of changes and the version of each point.
   - If a new change has a lower sequential number than the current version, it is ignored.

This process allows Qdrant to restore storage safely from the WAL in case of an unexpected shutdown.
