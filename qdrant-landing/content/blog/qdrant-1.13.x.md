---
title: "Qdrant 1.13"
draft: false
short_description: ""
description: "" 
preview_image: /blog/qdrant-1.13.x/social_preview.png
social_preview_image: /blog/qdrant-1.13.x/social_preview.png
date: 2025-01-15T00:00:00-08:00
author: David Myriel
featured: true
tags:
---

[**Qdrant 1.13.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.13.0) Let's look at major new features and a few minor additions:

**GPU Indexing:** Add GPU support for HNSW super fast indexing.</br>
**Streaming Snapshots:** Create snapshots on the fly without putting them on disk first.</br>
**Strict Mode:** Restrict certain type of operations on collections</br>

**HNSW Graph Optimization:** Compress HNSW graph links.</br>
**New storage for Payloads and Sparse Vectors:** A replacement of general-purpose RocksDB with our custom storage implementation, which allows reads and writes in constant number of disk operations</br>
**Named Vector Filtering:** Add Has Vector filtering condition, check if a named vector is present on a point.</br>


## GPU Accelerated Indexing

Qdrant introduces GPU-accelerated HNSW indexing to dramatically reduce index construction times.
This feature is optimized for large datasets where indexing speed is critical. 

> The new feature delivers speeds up to 10x faster than CPU-based methods for the equivalent hardware price.

We introduce our custom implementation of GPU-accelerated HNSW indexing,
 which doesn't rely on any third-party libraries, and therefore is not limited to any specific GPU vendor.
The only requirement is a GPU with Vulkan support, which is available on most modern GPUs.

Here is a picture of us, running Qdrant with GPU support on a SteamDeck (AMD Van Gogh GPU):


{{< figure src="/blog/qdrant-1.13.x/steamdeck.jpg" alt="Qdrant on SteamDeck" caption="Qdrant on SteamDeck with AMD GPU" >}}

This experiment didn't require any changes to the codebase, everything worked with the default docker image.

As of right now this solution supports only on-premises deployments, but we will introduce cloud shortly.

**Highlights**

- Multi-GPU Support: Index segments concurrently to handle large-scale workloads.
- Hybrid Compatibility: Seamlessly integrate GPU-enabled and CPU-only nodes in the same cluster.
- Hardware Flexibility: Doesn't require high-end GPUs to achieve significant performance improvements.
- Full Feature Support: GPU indexing supports all quantization options and datatypes implemented in Qdrant.
- Large-Scale Benefits: Fast indexing unlocks larger size of segments, which leads to higher PRS on the same hardware.

### Benchmarks on Common GPUs

TABLE HERE

### Using Qdrant on GPU Instances
Setup is simple with pre-configured Docker images for GPU environments. 
Users can enable GPU indexing with minimal configuration changes. 
Logs clearly indicate GPU detection and usage for transparency.

Read more about [GPU Indexing](https://qdrant.tech)

## Snapshot Streaming

Snapshots plays an important role in data workflow, and especially they are important in the context of distributed deployment.

Snapshots are used to transfer points with constructed indexes between nodes.
It happens when a new node joins the cluster, or when a node needs synchronization with the rest of the cluster.

Before v1.13, shapshot-based transfer required an extra consideration before using, as it was necessary to ensure, that the machine has enough disk space to store snapshot file.
It is especially challenging, if you take into account that vector data has very high entropy, and therefore is hard to compress.

Streamable snapshots allows to create snapshots on the fly, without storing them on disk. That significantly reduces requirements for disk space and simplifies the process of transferring data between nodes. In addition, it makes the transfer process faster deployments with slow disks.

In order to implement this feature, we had to not only change code in Qdrant itself, but also to introduce changes in upstream of [tar-rs](https://github.com/alexcrichton/tar-rs/pulls?q=is%3Apr+author%3Axzfc+is%3Aclosed) library, a Rust library for working with tar archives.

Introduction of streaming support finally bringings tar (aka tape archive), a format historically designed to put data on tape streamers, to its historical roots.


## Strict Mode

Qdrant’s Strict Mode introduces operational controls to safeguard resource usage and maintain consistent performance in shared, serverless environments. 
By capping the computational cost of operations like unindexed filtering, batch sizes, and search parameters (e.g., hnsw_ef and oversampling), it prevents inefficient usage patterns that could overload the service. 
Additional limits on payload sizes, filter conditions, and timeouts ensure that even high-demand applications remain predictable and responsive. 

Strict Mode is configured at the collection level via `strict_mode_config`, this feature allows users to define thresholds while preserving backward compatibility. 
Newly created collections default to strict mode, enforcing compliance by design and balancing workloads across tenants.

Strict Mode also enhances usability by providing detailed error messages when requests exceed defined limits, offering clear guidance on resolution steps. 
The robust verification system guarantees that all operations adhere to the configured constraints, making Qdrant an excellent choice for multi-tenant and serverless deployments. 
Strict Mode mitigates the noisy neighbor problem and ensures efficient resource allocation. 

### Using Strict Mode
See [schema definitions](https://api.qdrant.tech/api-reference/collections/create-collection#request.body.strict_mode_config) for all the `strict_mode_config` parameters.

Upon crossing a limit, the server will return a client side error with the information about the limit that was crossed.

As part of the config, the `enabled` field act as a toggle to enable or disable the strict mode dynamically.

The `strict_mode_config` can be enabled when creating a collection, for instance below to active the `unindexed_filtering_retrieve` limit.

```http
PUT /collections/{collection_name}
{
    "strict_mode_config": {
        "enabled": true,
        "unindexed_filtering_retrieve": true
    }
}
```

```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "strict_mode_config": {
        "enabled":" true,
        "unindexed_filtering_retrieve": true
    }
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.SparseVectorParams{ enabled=True, unindexed_filtering_retrieve=True },
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  strict_mode_config: {
    enabled: true,
    unindexed_filtering_retrieve: true,
  },
});
```

```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, StrictModeConfigBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .strict_config_mode(StrictModeConfigBuilder::default().enabled(true).unindexed_filtering_retrieve(true)),
    )
    .await?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.StrictModeCOnfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setStrictModeConfig(
                StrictModeConfig.newBuilder().setEnabled(true).setUnindexedFilteringRetrieve(true).build())
            .build())
    .get();
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	strictModeConfig: new StrictModeConfig { enabled = true, unindexed_filtering_retrieve = true }
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
	StrictModeConfig: &qdrant.StrictModeConfig{
        Enabled: qdrant.PtrOf(true),
		IndexingThreshold: qdrant.PtrOf(true),
	},
})
```

or enabled later on an existing collection.

```http
PATCH /collections/{collection_name}
{
    "strict_mode_config": {
        "enabled": true,
        "unindexed_filtering_retrieve": true
    }
}
```


```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "strict_mode_config": {
        "enabled": true,
        "unindexed_filtering_retrieve": true
    }
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.update_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(enabled=True, unindexed_filtering_retrieve=True),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.updateCollection("{collection_name}", {
  strict_mode_config: {
    enabled: true,
    unindexed_filtering_retrieve: true,
  },
});
```

```rust
use qdrant_client::qdrant::{StrictModeConfigBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").strict_mode_config(
            StrictModeConfigBuilder::default().enabled(true).unindexed_filtering_retrieve(true),
        ),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.StrictModeConfigBuilder;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setStrictModeConfig(
            StrictModeConfig.newBuilder().setEnabled(true).setUnindexedFilteringRetrieve(true).build())
        .build());
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	strictModeConfig: new StrictModeConfig { Enabled = true, UnindexedFilteringRetrieve = true }
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
	StrictModeConfig: &qdrant.StrictModeConfig{
        Enabled: qdrant.PtrOf(true),
		UnindexedFilteringRetrieve: qdrant.PtrOf(true),
	},
})
```

It can be disabled on an existing collection.

```http
PATCH /collections/{collection_name}
{
    "strict_mode_config": {
        "enabled": false
    }
}
```

```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "strict_mode_config": {
        "enabled": false,
    }
  }'
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.update_collection(
    collection_name="{collection_name}",
    strict_mode_config=models.StrictModeConfig(enabled=False),
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.updateCollection("{collection_name}", {
  strict_mode_config: {
    enabled: false,
  },
});
```

```rust
use qdrant_client::qdrant::{StrictModeConfigBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").strict_mode_config(
            StrictModeConfigBuilder::default().enabled(false),
        ),
    )
    .await?;
```

```java
import io.qdrant.client.grpc.Collections.StrictModeConfigBuilder;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setStrictModeConfig(
            StrictModeConfig.newBuilder().setEnabled(false).build())
        .build());
```

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	strictModeConfig: new StrictModeConfig { Enabled = false }
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
	StrictModeConfig: &qdrant.StrictModeConfig{
        Enabled: qdrant.PtrOf(false),
	},
})
```

Read more about [Strict Mode](/documentation/guides/administration/#strict-mode)

## HNSW Graph Compression

Search engines rely on a variety of optimization, dedicates to speed up the search or reduce the memory footprint.
One of the popular optimization technique in classical inverted index is [Delta Encoding](https://en.wikipedia.org/wiki/Delta_encoding).

Turns out, with some [custom modifications](https://github.com/qdrant/qdrant/pull/5487), we can apply the same technique to HNSW graph links.

In the contrast to traditional compression algorithms, like gzip or lz4, delta encoding requires very little CPU overhead for decompression, which makes it a perfect fit for the HNSW graph links. As a result of out experiments, we didn't observe any measurable performance degradation, while the memory footprint of the HNSW graph was reduced by up to 30%.


## Named Vector Filtering

This condition enables filtering by the presence of a given named vector on a point.

For example, if we have two named vector in our collection.

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
    },
    "sparse_vectors": {
        "sparse-image": {},
        "sparse-text": {},
    },
}
```

Some points in the collection might have all vectors, some might have only a subset of them.

<aside role="status">If your collection does not have named vectors, use an empty (<code>""</code>) name.</aside>

This is how you can search for points which have the dense `image` vector defined:

```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            { "has_vector": "image" }
        ]
    }
}
```

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.scroll(
    collection_name="{collection_name}",
    scroll_filter=models.Filter(
        must=[
            models.HasVectorCondition(has_vector="image"),
        ],
    ),
)
```

```typescript
client.scroll("{collection_name}", {
      filter: {
    must: [
      {
        has_vector: "image",
      },
    ],
  },
});
```
```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}")
            .filter(Filter::must([Condition::has_vector("image")])),
    )
    .await?;
```
```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.hasVector;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(hasVector("image"))
                    .build())
            .build())
    .get();
```
```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(collectionName: "{collection_name}", filter: HasVector("image"));
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

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewHasVector(
        "image",
			),
		},
	},
})
```
Read more about [Named Vector Filtering](https://qdrant.tech)

## New storage backend

Historically, Qdrant used RocksDB as a storage backend for payloads and sparse vectors.
RocksDB is a general-purpose key-value storage, which is optimized for random reads and writes. 

But in the context of Qdrant, RocksDB's general-purpose nature was not the best fit.
For example, RocksDB assumes that both keys and values in the storage can be an arbitrary bytes of arbitrary length.

Because of those relaxed assumptions, RocksDB requires an additional step in the lifecycle of the data: compaction.

Compaction happens in the background, but under heavy write load, it can lead to significant performance degradation.
In case of Qdrant, we observed timeout errors happening randomly during an upload of a large number of points.

As a solution, we introduced a custom storage backend, which is optimized for Qdrant's specific use case.
The main characteristic of this new storage is that it allows reads and writes in a constant number of disk operations, regardless of the size of the data.

Here is how it works:

{{< figure src="/blog/qdrant-1.13.x/storage.png" alt="New Qdrant Storage Backend" caption="New Qdrant Storage Backend" >}}

Storage is devided in tree layers.

- **Data Layer** - Contains of the fixed-size blocks, which contain the actual data. The size of the block is a configuration parameter, which can be adjusted depending on the workload. Each record occupies required number of blocks. If data size exceeds the block size, it is split into multiple blocks. If data size is less than the block size, it still occupies the whole block.

- **Mask Layer** - This layer contains a bit-mask, which indicates which blocks are occupied and which are free. The size of the mask is equal to the number of blocks in the data layer. For example, if the block size is 128 bytes, bit-mask layer will contain 1 bit for each 128 bytes of the data layer. Which means the overhead for the mask layer is 1/1024 of the data layer. Is saved on disk and doesn't require to be loaded into memory.

- **Tracker Layer** - Final layer of the storage, which contains information about mask regions. Size of each bitmask region is configured to match the size of the memory page. This layer is used to quickly find the region of the mask layer, which contains enough free blocks to store the data. This layer have to be loaded into memory, but it contains only minimal information about each region. Overall, the requirement is to keep 1/million of the data layer size in memory. That is one KB of RAM for a GB of data.