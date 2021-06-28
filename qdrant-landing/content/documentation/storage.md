---
title: Storage
weight: 29
---

All data within one collection is divided into segments.
Each segment has its own independent vector and payload storage as well as indexes. 

Data stored in segments usually do not overlap.
However, storing the same point in different segments will not cause problems, since the search contains a deduplication mechanism.

The segments consist of vector and payload storages, vector and payload [indexes](../indexing), and id mapper, which stores the relationship between internal and external ids.

A segment can be `appendable` or `non-appendable` depending on the type of storage and index used.
You can freely add, delete and query data in the `appendable` segment.
With `non-appendable` segment can only read and delete data.

The configuration of the segments in the collection can be different and independent from one another, but at least one `appendable' segment must be present in a collection.

## Vector storage

Depending on the requirements of the application, Qdrant can use one of the data storage options.
The choice has to be made between the search speed and the size of RAM used.

**In-memory storage** - Stores all vectors in RAM, has the highest speed, since disk access is required only for persistence.

**Memmap storage** -  creates a virtual address space associated with the file on disk. [Wiki](https://en.wikipedia.org/wiki/Memory-mapped_file). Mmaped files are not directly loaded into RAM, instead they use page cache to access the contents of the file.
This scheme allows a flexible use of available memory. With sufficient RAM is almost as fast as in-memory storage.
However, dynamically adding vectors to the mmap file is fairly complicated and is not implemented in Qdrant.
Thus, segments using mmap storage are `non-appendable` and can only be construed by the optimizer.


## Payload storage

In the current version of Qdrant, payload storage is organized in the same way as in-memory vectors.
Payload is loaded into RAM at service startup while disk and [RocksDB](https://rocksdb.org/) are used for persistence.

## Versioning

To ensure data integrity, all data changes occur in 2 stages.
In the first step, the data is written to the Write-ahead-log(WAL), which orders all operations and assigns them a sequential number.

Once a change has been added to the WAL, it will not be lost even if power loss occurs.
Then the changes go into the segments.
Each segment stores the last version of the change applied to it. 
If the new change has a sequential number less than the current version of the segment, the change will be ignored.
This mechanism allows Qdrant to safely and efficiently restore the state of the storage from the WAL in case of abnormal shutdown.
