---
title: Bulk Upload
short_description: "Bulk-upload vectors into Qdrant collections efficiently by tuning indexing strategy and using high-performance client libraries."
description: "Tutorial: bulk-upload large vector datasets into Qdrant by deferring HNSW index construction and parallelizing client uploads for maximum throughput."
aliases:
  - /documentation/tutorials/bulk-upload/
  - /documentation/database-tutorials/bulk-upload/
weight: 1
---

# Bulk Upload Vectors to a Qdrant Collection

| Time: 20 min | Level: Intermediate |
| --- | ----------- |

Uploading a large dataset quickly can be a challenge, but Qdrant provides several strategies to help.

The bottleneck during data upload is usually on the client side, not the server.
This means that if you are uploading a large dataset, you should prefer a high-performance client library. We recommend using our [Rust client library](https://github.com/qdrant/rust-client) for this purpose, as it is the fastest client library available for Qdrant.

## Batch Your Uploads

[Upsert points in batches](/documentation/manage-data/points/#upload-points) rather than one at a time. Each request to Qdrant carries overhead: network round-trip, Write-Ahead Log (WAL) write, and internal routing. When you upload points individually, that overhead impacts the throughput.

Aim for **64–256 points per batch**. Smaller batches under-utilize the network; larger batches can increase memory pressure on the server and raise the cost of retrying on failure. The optimal batch size depends on your data and cluster, so you may want to experiment with different sizes for best performance.

## Parallelize Across Multiple Threads

A single upload thread rarely saturates the server. Split your dataset across two to four concurrent threads, each sending its own stream of batches. This keeps Qdrant's internal write workers busy across shards and reduces total upload time.

If [your collection has multiple shards](#create-collections-with-multiple-shards), target one upload thread per shard as a starting point. Each shard has an independent WAL and update worker, so parallel streams map directly onto available write capacity.


> The Python client's `upload_points` method [handles batching and parallelization for you](/documentation/manage-data/points/#python-client-optimizations). Pass an iterator of points and set `batch_size` and `parallel` to control throughput without managing batches manually. For other client libraries, you need to implement batching and parallelization yourself.

## Create Collections with Multiple Shards

In Qdrant, each collection is split into shards. By default, a collection has one shard, but you can specify more when creating the collection.
By creating multiple shards, you can parallelize the upload of a large dataset. From two to four shards per machine is a reasonable number.

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-two-shards/" >}}

## Create Payload Indexes Before Ingesting Data

If your collection uses payload indexes, [create them](/documentation/manage-data/indexing/#create-a-payload-index) before you start uploading points. Qdrant builds extra HNSW links for each payload index to optimize filtered vector search quality. If you add a payload index after the HNSW graph is already built, those links won't exist, and filtered search will fall back to slower query-time strategies until you [rebuild the graph](/documentation/manage-data/indexing/#rebuild-the-hnsw-index), which is resource-intensive and can take a long time.

The correct order is:

1. Create the collection.
2. Create all payload indexes.
3. Upload your points.

Following this sequence means Qdrant builds the graph in a single pass, rather than having to rebuild it after the fact.

## Upload Directly to Disk

When the vectors you upload do not all fit in RAM, you likely want to use
[memmap](/documentation/manage-data/storage/#configuring-memmap-storage)
support.

During [collection
creation](/documentation/manage-data/collections/#create-collection),
memmaps can be enabled on a per-vector basis using the `on_disk` parameter. This
will store vector data directly on disk at all times.

Using `memmap_threshold` is not recommended in this case. This requires
the [optimizer](/documentation/ops-optimization/optimizer/) to constantly
transform in-memory segments into memmap segments on disk. This process is
slower, and the optimizer can be a bottleneck when ingesting a large amount of
data.

For full configuration details, see [Configuring Memmap Storage](/documentation/manage-data/storage/#configuring-memmap-storage).
