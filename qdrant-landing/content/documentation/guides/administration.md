---
title: Administration
weight: 10
aliases:
  - ../administration
---

# Administration

Qdrant exposes administration tools which enable to modify at runtime the behavior of a qdrant instance without changing its configuration manually.

## Locking

A locking API enables users to restrict the possible operations on a qdrant process.
It is important to mention that:

- The configuration is not persistent therefore it is necessary to lock again following a restart.
- Locking applies to a single node only. It is necessary to call lock on all the desired nodes in a distributed deployment setup.

Lock request sample:

```http
POST /locks
{
    "error_message": "write is forbidden",
    "write": true
}
```

Write flags enables/disables write lock.
If the write lock is set to true, qdrant doesn't allow creating new collections or adding new data to the existing storage.
However, deletion operations or updates are not forbidden under the write lock.
This feature enables administrators to prevent a qdrant process from using more disk space while permitting users to search and delete unnecessary data.

You can optionally provide the error message that should be used for error responses to users.

## Recovery mode

*Available as of v1.2.0*

Recovery mode can help in situations where Qdrant fails to start repeatedly.
When starting in recovery mode, Qdrant only loads collection metadata to prevent
going out of memory. This allows you to resolve out of memory situations, for
example, by deleting a collection. After resolving Qdrant can be restarted
normally to continue operation.

In recovery mode, collection operations are limited to
[deleting](/documentation/concepts/collections/#delete-collection) a
collection. That is because only collection metadata is loaded during recovery.

To enable recovery mode with the Qdrant Docker image you must set the
environment variable `QDRANT_ALLOW_RECOVERY_MODE=true`. The container will try
to start normally first, and restarts in recovery mode if initialisation fails
due to an out of memory error. This behavior is disabled by default.

If using a Qdrant binary, recovery mode can be enabled by setting a recovery
message in an environment variable, such as
`QDRANT__STORAGE__RECOVERY_MODE="My recovery message"`.


## Strict mode

*Available as of v1.13.0*

Strict mode is a feature to restrict certain type of operations on the collection in order to protect it.

The goal is to prevent inefficient usage patterns that could overload the collections.

This configuration ensures a more predictible and responsive service when you do not have control over the queries that are being executed.

Here is a non exhaustive list of operations that can be restricted using strict mode:

- Preventing querying non indexed payload which can be very slow
- Maximum number of filtering conditions in a query
- Maximum batch size when inserting vectors
- Maximum collection size (in terms of vectors or payload size)

See [schema definitions](https://api.qdrant.tech/api-reference/collections/create-collection#request.body.strict_mode_config) for all the `strict_mode_config` parameters.

Upon crossing a limit, the server will return a client side error with the information about the limit that was crossed.

As part of the config, the `enabled` field act as a toggle to enable or disable the strict mode dynamically.

The `strict_mode_config` can be enabled when [creating](#create-a-collection) a collection, for instance below to active the `unindexed_filtering_retrieve` limit.

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
    strict_mode_config=models.StrictModeConfig(enabled=True, unindexed_filtering_retrieve=True),
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

Or enable it later on an existing collection through the [collection update](#update-collection-parameters) API:

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

To disable strict mode on an existing collection use:

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