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
**Named Vector Filtering:** Add Has Vector filtering condition, check if a named vector is present on a point.</br>
**Memory Map for Payload Storage:** Use mmap storage for payloads by default to make it more efficient, eliminating unexpected latency spikes. </br>


## GPU Accelerated Indexing
Qdrant introduces GPU-accelerated HNSW indexing to dramatically reduce index construction times.
This feature is optimized for large datasets where indexing speed is critical. 

> The new feature delivers speeds up to 10x faster than CPU-based methods. 

It is built with Vulkan API for broad GPU compatibility, including Nvidia, AMD, and integrated GPUs. 
As of right now this solution supports only on-premises deployments, but we will introduce cloud shortly.

Highlights
- Multi-GPU Support: Index segments concurrently to handle large-scale workloads.
- Hybrid Compatibility: Seamlessly integrate GPU-enabled and CPU-only nodes in the same cluster.
- Hardware Flexibility: Supports mid-range GPUs like Nvidia T4 for optimal cost-performance balance.
- Full Feature Support: Maintains compatibility with filtering, quantization, and payloads.

### Using Qdrant on GPU Instances
Setup is simple with pre-configured Docker images for GPU environments. 
Users can enable GPU indexing with minimal configuration changes. 
Logs clearly indicate GPU detection and usage for transparency.

Read more about [GPU Indexing](https://qdrant.tech)

## Snapshot Streaming

MISSING ABOUT 

MISSING CODE

Read more about [Snapshot Streaming](https://qdrant.tech)

## Strict Mode

Qdrant’s Strict Mode introduces operational controls to safeguard resource usage and maintain consistent performance in shared, serverless environments. 
By capping the computational cost of operations like unindexed filtering, batch sizes, and search parameters (e.g., hnsw_ef and oversampling), it prevents inefficient usage patterns that could overload collections. 
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

Read more about [Strict Mode](https://qdrant.tech)

## HNSW Graph Optimization

MISSING ABOUT


MISSING CODE

Read more about [HNSW Graph Optimization](https://qdrant.tech)


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

## Memory Map for Payload Storage

MISSING ABOUT SECTION


POSSIBLY DIAGRAM


































































