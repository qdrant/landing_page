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

## Disable indexing during upload

In case you are doing an initial upload of a large dataset, you might want to disable indexing during upload.
It will enable to avoid unnecessary indexing of vectors, which will be overwritten by the next batch.

To disable indexing during upload, set `indexing_threshold` to `0`:

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
