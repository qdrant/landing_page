---
title: Storage
weight: 29
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

## Payload storage

Qdrant supports two types of payload storages: InMemory and OnDisk.

InMemory payload storage is organized in the same way as in-memory vectors.
Payload is loaded into RAM at service startup while disk and [RocksDB](https://rocksdb.org/) are used for persistence only.
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

Once a change has been added to the WAL, it will not be lost even if power loss occurs.
Then the changes go into the segments.
Each segment stores the last version of the change applied to it as well as version of each individual point.
If the new change has a sequential number less than the current version of the point, the updater will ignore the change.
This mechanism allows Qdrant to safely and efficiently restore the storage from the WAL in case of an abnormal shutdown.
