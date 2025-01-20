---
title: "Qdrant 1.13 - GPU Indexing, Snapshot Streaming & Strict Mode"
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

[**Qdrant 1.13.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.13.0) Let's look at the main features for this version:

**Snapshot Streaming:** Generate snapshots dynamically without writing to disk first.</br>
**Strict Mode:** Enforce operation restrictions on collections for enhanced control.</br>
**HNSW Graph Compression:** Reduce storage use via HNSW Delta Encoding.</br>

**Named Vector Filtering:** New `has_vector` filtering condition for named vectors.</br>
**Custom Storage:** For constant-time reads/writes of payloads and sparse vectors.</br>

**GPU Accelerated Indexing:** Fast HNSW indexing with architecture-free GPU support.</br>

## Snapshot Streaming

![snapshot-streaming](/blog/qdrant-1.13.x/image_1.png)

[**Snapshots**](/documentation/concepts/snapshots/) are key to data workflows, especially in distributed setups. 
They help sync nodes by transferring points and indexes when new nodes join or when existing nodes need updates.

- **The Old Way:** Before v1.13, snapshots required ample disk space to store high-entropy vector data, which is tough to compress. This made deployments cumbersome and slow on machines with limited disk speed or capacity.

- **The New Way:** Now snapshots can be streamed. Instead of saving files to disk, snapshots are created and transferred on the fly. This slashes disk space needs and speeding up the process, even on slower hardware.

**How We Did It:**

Implementing streamable snapshots required **significant changes to Qdrant’s core functionality**. Additionally, we made contributions to the [**tar-rs**](https://github.com/alexcrichton/tar-rs/pulls?q=is%3Apr+author%3Axzfc+is%3Aclosed) library, a Rust-based tool for handling tar archives. These updates extended tar’s streaming capabilities, aligning the format with its original purpose of supporting tape streamers.

With the introduction of streaming support, tar (short for “tape archive”) returns to its roots as a format designed for efficient data streaming. 

> This enhancement not only honors its historical legacy but also modernizes it for today’s high-performance distributed systems.

*Read more in our documentation on [**Database Snapshots**](/documentation/concepts/snapshots/).* 

## Strict Mode

![strict-mode](/blog/qdrant-1.13.x/image_2.png)

**Strict Mode** ensures consistent performance in shared, serverless deployments by enforcing operational controls. It limits computationally intensive operations like unindexed filtering, batch sizes, and search parameters (`hnsw_ef`, `oversampling`) This prevents inefficient usage that could overload your system.

Additional safeguards, including limits on payload sizes, filter conditions, and timeouts, keep high-demand applications fast and reliable. This feature is configured via `strict_mode_config`, and it allows collection-level customization while maintaining backward compatibility.

> New collections will default to **Strict Mode**, ensuring compliance by design and balancing workloads across tenants. 

This feature also enhances usability by providing **detailed error messages** when requests exceed defined limits. The system will give you clear guidance on resolution steps. 

**Strict Mode** solves the “*noisy neighbor*” problem and optimizes resource allocation, making Qdrant a top choice for multi-tenant and serverless vector search.

### Using Strict Mode

To configure **Strict Mode**, refer to the [**schema definitions**](https://api.qdrant.tech/api-reference/collections/create-collection#request.body.strict_mode_config`) for all available `strict_mode_config` parameters.

When a defined limit is crossed, Qdrant responds with a client-side error that includes details about the specific limit exceeded. This can make troubleshooting much simpler. 

> The `enabled` field in the configuration acts as a dynamic toggle, allowing you to activate or deactivate Strict Mode as needed.

In this example we enable **Strict Mode** when creating a collection to activate the `unindexed_filtering_retrieve` limit:

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
> You may also use the `PATCH` request to enable Strict Mode on an existing collection.

*Read more about Strict Mode in the [**Database Administration Guide**](/documentation/guides/administration/#strict-mode)*

## HNSW Graph Compression

![hnsw-graph-compression](/blog/qdrant-1.13.x/image_3.png)

We’re always looking for ways to make your search experience faster and more efficient. That’s why we are introducing a new optimization method for our HNSW graph technology: [**Delta Encoding**](https://en.wikipedia.org/wiki/Delta_encoding). This improvement makes your searches lighter on memory without sacrificing speed.

**Delta Encoding** is a clever way to compress data by storing only the differences (or “deltas”) between values. It’s commonly used in search engines (*for the classical inverted index*) to save space and improve performance. We’ve now [**adapted this technique**](https://github.com/qdrant/qdrant/pull/5487) for the HNSW graph structure that powers Qdrant’s search.

> With **Delta Encoding**, the memory needed to store your data’s graph structure can be reduced by up to 30%. 

The best part? This optimization doesn’t slow down your searches. You’ll experience the same lightning-fast results you’re used to, but with a smaller memory footprint.

### How Delta Encoding Works

Unlike traditional compression methods like gzip, which can be resource-intensive to decompress, **Delta Encoding** is designed to be lightweight. It works seamlessly in the background, minimizing the strain on your system while keeping performance at its peak.

1. Imagine your data is represented as a series of connected points (a graph).
2. **Delta Encoding** compresses this graph by storing only the necessary information about the differences between points.
3. The result is a smaller, more efficient structure that’s quick to access.

*For more general info, read about [**Indexing and Data Structures in Qdrant**](/documentation/concepts/indexing/)*

## Filter by Named Vectors

![filter-named-vectors](/blog/qdrant-1.13.x/image_4.png)

In Qdrant, you can store multiple vectors of different sizes and types in a single data point. This is useful when you have to representing data with multiple embeddings, such as image, text, or video features.

> We previously introduced this feature as [**Named Vectors**](/documentation/concepts/vectors/#named-vectors). Now, you can filter points by checking if a specific named vector exists.

This makes it easy to search for points based on the presence of specific vectors. For example, *if your collection includes image and text vectors, you can filter for points that only have the image vector defined*.

### Create a Collection with Named Vectors

Upon collection creation, you define named vector types, such as `image` or `text`:

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
### Filter by Named Vector

Some points might include both **image** and **text** vectors, while others might include just one. With this new feature, you can easily filter for points that specifically have the **image** vector defined.

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
This feature makes it easier to manage and query collections with heterogeneous data. It give you more flexibility and control over your vector search workflows.

*To dive deeper into filtering by named vectors, check out the [**Filtering Documentation**](/documentation/concepts/filtering/#has-vector)*

## Custom Storage Engine

![custom-storage-engine](/blog/qdrant-1.13.x/image_5.png)

When Qdrant started, we used **RocksDB** as the storage backend for payloads and sparse vectors. RocksDB, known for its versatility and ability to handle random reads and writes, seemed like a solid choice. But as our needs evolved, its “*general-purpose*” design began to show cracks.

> RocksDB is built to handle arbitrary keys and values of any size, but this flexibility comes at a cost. 

A key example is compaction, a process that reorganizes data on disk to maintain performance. **Under heavy write loads, compaction can become a bottleneck**, causing significant slowdowns. For Qdrant, this meant random timeout errors during large uploads—a frustrating roadblock.

To solve this, we built a **custom storage backend** optimized for our specific use case. Unlike RocksDB, our system delivers consistent performance by ensuring reads and writes require a constant number of disk operations, regardless of data size. The result? Faster, more reliable performance tailored to Qdrant’s needs.

### Our New Storage Architecture

Storage is divided into three layers. The **Data Layer**, **Mask Layer** and **Tracker Layer**.

{{< figure src="/blog/qdrant-1.13.x/storage.png" alt="Qdrant's New Storage Backend" caption="Qdrant's New Storage Backend" >}}

**The Data Layer** consists of fixed-size blocks that store the actual data. The block size is a configurable parameter that can be adjusted based on the workload. Each record occupies the required number of blocks. If the data size exceeds the block size, it is split into multiple blocks. If the data size is smaller than the block size, it still occupies an entire block.

**The Mask Layer** contains a bitmask that indicates which blocks are occupied and which are free. The size of the mask corresponds to the number of blocks in the Data Layer. For instance, if the block size is 128 bytes, the bitmask will allocate 1 bit for every 128 bytes in the Data Layer. This results in an overhead of 1/1024 of the Data Layer size. The bitmask is stored on disk and does not need to be loaded into memory.

**The Tracker Layer** is the final storage layer, holding metadata about regions of the Mask Layer. Each bitmask region corresponds to the size of a memory page, which is also configurable. This layer is used to quickly identify regions of the Mask Layer that have sufficient free blocks to store data. The Tracker Layer must be loaded into memory, but it only contains minimal information about each region. As a result, the memory requirement is approximately 1/1,000,000 of the Data Layer size, or 1 KB of RAM per GB of data.

## GPU Accelerated Indexing 

![gpu-accelerated-indexing](/blog/qdrant-1.13.x/image_6.png)

We are making it easier for you to handle even **the most demanding workloads**.

Qdrant now supports GPU-accelerated HNSW indexing **on all architectures, including NVIDIA, AMD, Intel**. This new feature dramatically reduces indexing times, making it a game-changer for projects where speed truly matters.

> Indexing over GPU now delivers speeds up to 10x faster than CPU-based methods for the equivalent hardware price.

Our custom implementation of GPU-accelerated HNSW indexing **is built entirely in-house**. Unlike solutions that depend on third-party libraries, our approach is vendor-agnostic, meaning it works seamlessly with any modern GPU that supports **Vulkan API**. This ensures broad compatibility and flexibility for a wide range of systems.

*Here is a picture of us, running Qdrant with GPU support on a SteamDeck (AMD Van Gogh GPU):*

{{< figure src="/blog/qdrant-1.13.x/gpu-test.jpg" alt="Qdrant on SteamDeck" caption="Qdrant on SteamDeck with AMD GPU" >}}

This experiment didn't require any changes to the codebase, and everything worked with the default Docker image.

> As of right now this solution supports only on-premises deployments, but we will introduce support for Qdrant Cloud shortly.

### Mixed Resource Architecture

You can easily integrate **GPU-enabled and CPU-only nodes** in the same cluster. This feature was built in such a way that you can configure multiple low-powered CPU machines to handle vector search and dedicate one GPU machine just for indexing. 

![composite-cluster](/blog/qdrant-1.13.x/composite-cluster.png)

{{< figure src="/blog/qdrant-1.13.x/composite-cluster.png" alt="Architecture combining GPU and CPU nodes" caption="Architecture combining GPU and CPU nodes." >}}

### Benchmarks on Common GPUs

**Qdrant doesn't require high-end GPUs** to achieve significant performance improvements. Let's take a look at some benchmark results for common GPU machines:

| **placeholder** | **placeholder** |
|-------------|-------------|
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |
| placeholder | placeholder |

**Additional Benefits:**

- Fast indexing unlocks larger size of segments, which leads to **higher PRS on the same hardware**.

- GPU indexing **supports all quantization options** and datatypes implemented in Qdrant.

### Usage Instructions 
Setup is simple with [**pre-configured Docker images**](https://hub.docker.com/r/qdrant/qdrant/tags) for GPU environments. 
Users can enable GPU indexing with minimal configuration changes.

> Logs will clearly indicate GPU detection and usage for transparency.

*Read more about this feature in the [**GPU Indexing Documentation**](https://qdrant.tech)*

## Get Started with Qdrant

The easiest way to reach that **Hello World** moment is to [**try vector search in a live cluster**](/documentation/quickstart-cloud/). Our **interactive tutorial** will show you how to create a cluster, add data and try some filtering clauses. 

**New features, like named vector filtering, can be tested in the Qdrant Dashboard:**

![qdrant-filtering-tutorial](/articles_data/vector-search-filtering/qdrant-filtering-tutorial.png)