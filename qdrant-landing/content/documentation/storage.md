---
title: Storage
weight: 80
---

All data within one collection is divided into segments.
Each segment has its independent vector and payload storage as well as indexes.

Data stored in segments usually do not overlap.
However, storing the same point in different segments will not cause problems since the search contains a deduplication mechanism.

The segments consist of vector and payload storages, vector and payload [indexes](../indexing), and id mapper, which stores the relationship between internal and external ids.

A segment can be `appendable` or `non-appendable` depending on the type of storage and index used.
You can freely add, delete and query data in the `appendable` segment.
With `non-appendable` segment can only read and delete data.

The configuration of the segments in the collection can be different and independent from one another, but at least one `appendable' segment must be present in a collection.

## Vector storage

Depending on the requirements of the application, Qdrant can use one of the data storage options.
The choice has to be made between the search speed and the size of the RAM used.

**In-memory storage** - Stores all vectors in RAM, has the highest speed since disk access is required only for persistence.

**Memmap storage** -  creates a virtual address space associated with the file on disk. [Wiki](https://en.wikipedia.org/wiki/Memory-mapped_file).
Mmapped files are not directly loaded into RAM. Instead, they use page cache to access the contents of the file.
This scheme allows flexible use of available memory. With sufficient RAM, it is almost as fast as in-memory storage.

<!--
However, dynamically adding vectors to the mmap file is fairly complicated and is not implemented in Qdrant.
Thus, segments using mmap storage are `non-appendable` and can only be construed by the optimizer.
But it only matters for internal operations, so you can safely ignore this fact.
If you update a vector in a segment with mmap storage, the vector will be moved to appendable segment first, and then the old vector will be deleted from the mmap segment. 
-->

### Configuring Memmap storage

There are two ways to configure the usage of mmap(also known as on-disk) storage:

- Set up `on_disk` option for the vectors in the collection create API:

**Available since v1.2.0**


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

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(
        size=768,
        distance=models.Distance.COSINE
        on_disk=True
    ),
)
```

This will create a collection with all vectors immediately stored in mmap storage.
This is the recommended way, in case your Qdrant instance operates with fast disks and you are working with large collections.


- Set up `memmap_threshold_kb` option. This option will set the threshold after which the segment will be converted to mmap storage.

There are two ways to do this:

1. You can set the threshold globally in the [configuration file](../configuration/). The parameter is called `memmap_threshold_kb`.
2. You can set the threshold for each collection separately during [creation](../collections/#create-collection) or [update](../collections/#update-collection-parameters).

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

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000)
)
```

The rule of thumb to set the mmap threshold parameter is simple:

- if you have a balanced use scenario - set mmap threshold the same as `indexing_threshold` (default is 20000). In this case the optimizer will not make any extra runs and will optimize all thresholds at once.
- if you have a high write load and low RAM - set mmap threshold lower than `indexing_threshold` to e.g. 10000. In this case the optimizer will convert the segments to mmap storage first and will only apply indexing after that.

In addition, you can use mmap storage not only for vectors, but also for HNSW index.
To enable this, you need to set the `hnsw_config.on_disk` parameter to `true` during [creation](../collections/#create-collection) of the collection.

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

client = QdrantClient("localhost", port=6333)

client.recreate_collection(
    collection_name="{collection_name}",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
    optimizers_config=models.OptimizersConfigDiff(memmap_threshold=20000),
    hnsw_config=models.HnswConfigDiff(on_disk=True)
)
```

## Payload storage

Qdrant supports two types of payload storages: InMemory and OnDisk.

InMemory payload storage is organized in the same way as in-memory vectors.
The payload data is loaded into RAM at service startup while disk and [RocksDB](https://rocksdb.org/) are used for persistence only.
This type of storage works quite fast, but it may require a lot of space to keep all the data in RAM, especially if the payload has large values attached - abstracts of text or even images.

In the case of large payload values, it might be better to use OnDisk payload storage.
This type of storage will read and write payload directly to RocksDB, so it won't require any significant amount of RAM to store.
The downside, however, is the access latency.
If you need to query vectors with some payload-based conditions - checking values stored on disk might take too much time.
In this scenario, we recommend creating a payload index for each field used in filtering conditions to avoid disk access.
Once you create the field index, Qdrant will preserve all values of the indexed field in RAM regardless of the payload storage type.

You can specify the desired type of payload storage with [configuration file](../configuration/) or with collection parameter `on_disk_payload` during [creation](../collections/#create-collection) of the collection.

## Versioning

To ensure data integrity, Qdrant performs all data changes in 2 stages.
In the first step, the data is written to the Write-ahead-log(WAL), which orders all operations and assigns them a sequential number.

Once a change has been added to the WAL, it will not be lost even if a power loss occurs.
Then the changes go into the segments.
Each segment stores the last version of the change applied to it as well as the version of each individual point.
If the new change has a sequential number less than the current version of the point, the updater will ignore the change.
This mechanism allows Qdrant to safely and efficiently restore the storage from the WAL in case of an abnormal shutdown.
