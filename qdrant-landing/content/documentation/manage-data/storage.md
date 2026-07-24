---
title: Storage
short_description: "Tune how Qdrant stores vectors and payloads across segments, with options for in-memory, mmap, and on-disk storage."
description: "Configure Qdrant storage across segments, balancing in-memory, memory-mapped, and on-disk options for vectors and payloads to fit cost and latency goals."
weight: 25
aliases:
  - ../storage
---

# Storage

All data within one collection is divided into segments.
Each segment has its independent vector and payload storage as well as indexes.

Data stored in segments usually do not overlap.
However, storing the same point in different segments will not cause problems since the search contains a deduplication mechanism.

The segments consist of vector and payload storages, vector and payload [indexes](/documentation/manage-data/indexing/), and id mapper, which stores the relationship between internal and external ids.

A segment can be `appendable` or `non-appendable` depending on the type of storage and index used.
You can freely add, delete and query data in the `appendable` segment.
With `non-appendable` segment can only read and delete data.

The configuration of the segments in the collection can be different and independent of one another, but at least one `appendable' segment must be present in a collection.

## Vector storage

Qdrant always stores vectors in a [memory-mapped file](https://en.wikipedia.org/wiki/Memory-mapped_file) on disk. Depending on the requirements of your application, you can configure a [memory tier](/documentation/ops-configuration/memory-tiers/) to control whether vectors are also loaded into RAM for faster access:

- **`cached`** - Qdrant pre-loads the file into the disk cache on startup, so the first request is fast. This is the default; it requires enough RAM to hold the vectors.

- **`cold`** - Qdrant doesn't pre-load the file into RAM. The first request may be slower, since Qdrant reads from disk, but the operating system caches pages as they're accessed.

### Configuring Memmap storage

There are two ways to move vectors to the `cold` tier:

- Set the `memory` option for the vectors in the collection create API:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-vectors-on-disk/" >}}

This will create a collection with all vectors immediately in the `cold` tier.
This is the recommended way when your Qdrant instance operates with fast disks and you are working with large collections.


- Set up `memmap_threshold` option. This option will set the threshold after which the segment will be converted to memmap storage.

  There are two ways to do this:

  1. You can set the threshold globally in the [configuration file](/documentation/ops-configuration/configuration/). The parameter is called `memmap_threshold` (previously `memmap_threshold_kb`).
  2. You can set the threshold for each collection separately during [creation](/documentation/manage-data/collections/#create-collection) or [update](/documentation/manage-data/collections/#update-collection-parameters).

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-optimizer-config/" >}}

The rule of thumb to set the memmap threshold parameter is simple:

- if you have a balanced use scenario - set memmap threshold the same as `indexing_threshold` (default is 10000). In this case the optimizer will not make any extra runs and will optimize all thresholds at once.
- if you have a high write load and low RAM - set memmap threshold lower than `indexing_threshold` to e.g. 5000. In this case the optimizer will convert the segments to memmap storage first and will only apply indexing after that.

`memmap_threshold` only decides the default placement for vectors that don't have an explicit [memory tier](/documentation/ops-configuration/memory-tiers/) configured. If you explicitly set `memory` (or the deprecated `on_disk`) on a vector, that setting always takes precedence over the threshold, regardless of segment size.

In addition, you can configure a [memory tier](/documentation/ops-configuration/memory-tiers/) for the HNSW index, not only for vectors.
For example, to move it to the `cold` tier, set the `hnsw_config.memory` parameter to `cold` during collection [creation](/documentation/manage-data/collections/#create-a-collection) or [updating](/documentation/manage-data/collections/#update-collection-parameters).

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-vectors-and-hnsw-on-disk/" >}}

## Payload storage

Qdrant supports two [memory tiers](/documentation/ops-configuration/memory-tiers/) for payloads: `cached` and `cold` (default). Disk and [Gridstore](/articles/gridstore-key-value-storage/) are used for persistence regardless of tier.

`cached` payload storage is organized in the same way as `cached` vectors: Qdrant pre-loads it into the disk cache on startup, so it's fast to access. It may require a lot of space to keep all the data warm in RAM, especially if the payload has large values attached - abstracts of text or even images.

In the case of large payload values, it might be better to use the `cold` tier.
This tier reads and writes payload directly to Gridstore without pre-warming, so it won't require any significant amount of RAM to store.
The downside, however, is the access latency.
If you need to query vectors with some payload-based conditions - checking values stored on disk might take too much time.
In this scenario, we recommend creating a payload index for each field used in filtering conditions to avoid disk access.
Once you create the field index, Qdrant will preserve all values of the indexed field in RAM regardless of the payload storage type.

You can specify the desired memory tier with the [configuration file](/documentation/ops-configuration/configuration/) or with collection parameter `payload.memory` during [creation](/documentation/manage-data/collections/#create-collection) of the collection.

## Versioning

To ensure data integrity, Qdrant performs all data changes in 2 stages.
In the first step, the data is written to the Write-ahead-log(WAL), which orders all operations and assigns them a sequential number.

Once a change has been added to the WAL, it will not be lost even if a power loss occurs.
Then the changes go into the segments.
Each segment stores the last version of the change applied to it as well as the version of each individual point.
If the new change has a sequential number less than the current version of the point, the updater will ignore the change.
This mechanism allows Qdrant to safely and efficiently restore the storage from the WAL in case of an abnormal shutdown.
