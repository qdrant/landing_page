---
title: "Quickstart" 
short_description: "Get started with Qdrant Edge: install the Python or Rust bindings, configure a shard, and run local vector search in minutes."
description: "Set up Qdrant Edge with Python or Rust bindings to configure shards, upsert points, build payload indexes, and run local vector search on-device."
weight: 10
partition: develop
---

# Qdrant Edge Quickstart

## Install Qdrant Edge

First, install the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) or the [Rust crate](https://crates.io/crates/qdrant-edge).

## Create a Storage Directory

A Qdrant Edge Shard stores its data in a local directory on disk. Create the directory if it doesn't exist yet:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="create-storage-directory" >}}

## Configure the Edge Shard

An Edge Shard is configured with a definition of the dense and sparse vectors that can be stored in the Edge Shard, similar to how you would configure a Qdrant collection.

Set up a configuration by creating an instance of `EdgeConfig`. For example:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-edge-shard" >}}

Qdrant Edge supports all Qdrant quantization methods: Scalar, Product, Binary, and TurboQuant. Configure quantization globally on `EdgeConfig.quantization_config` or override per-vector on `EdgeVectorParams.quantization_config`. See the [Quantization](/documentation/manage-data/quantization/) guide for configuration details.

For every `EdgeConfig` parameter, refer to [Configuration](/documentation/edge/edge-api/configuration/#edgeconfig).

## Initialize the Edge Shard

Now you can create a new `EdgeShard` using `EdgeShard.create` (Python) or `EdgeShard::new` (Rust), passing the storage directory and configuration:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="initialize-edge-shard" >}}

Note that `create` and `new` will fail if the storage directory already contains data. To initialize an Edge Shard with existing data, see [Load Existing Edge Shard from Disk](#load-existing-edge-shard-from-disk).

For the full signatures, refer to [Create a New Edge Shard](/documentation/edge/edge-api/shard-lifecycle/#create-a-new-edge-shard).

## Work with Points

An Edge Shard has several methods to work with points. To add points, use the [`update`](/documentation/edge/edge-api/updating-data/#update) method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="upsert-points" >}}

To retrieve a point by ID, use the [`retrieve`](/documentation/edge/edge-api/reading-data/#retrieve) method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="retrieve-point" >}}

## Modify the Vector Schema

You can add or remove named vectors to an existing Edge Shard's schema. This is useful when migrating to a new embedding model or adding hybrid search to an Edge Shard that already contains data.

For example, to add a sparse vector for [BM25 keyword search](/documentation/edge/edge-bm25/):

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="modify-vector-schema" >}}

Existing points aren't automatically populated with the new vector. Re-upsert them to add their values for the new field.

To remove a named vector, use `UpdateOperation.delete_vector_name("text")` (Python) or `VectorNameOperations::DeleteVectorName` (Rust).

For every schema operation, refer to [Update Operations](/documentation/edge/edge-api/updating-data/#update-operations).

## Create a Payload Index

To optimize operations like [filtering](#filter-points) and [faceting](#create-facets) on payload fields, first create a payload index on the fields you plan to use with these operations:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="create-payload-index" >}}

For the index parameters, refer to `create_field_index` in [Update Operations](/documentation/edge/edge-api/updating-data/#update-operations).

## Query Points

To query points in the Edge Shard, use the [`query`](/documentation/edge/edge-api/reading-data/#query) method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="query-points" >}}

## Filter points

You can also [filter](/documentation/search/filtering/) points based on payload fields:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="filter" >}}

Filters are accepted by most read methods.

## Create Facets

To create facets on a payload field, use the [`facet`](/documentation/edge/edge-api/reading-data/#facet) method.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="facet" >}}

## Optimize the Edge Shard

Optimization is the process of removing data marked for deletion, merging segments, and creating indexes. Qdrant Edge does not have a background optimizer. Instead, an application can call the `optimize` method to synchronously run optimization at a suitable time, such as during low-traffic periods or after a batch of updates.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="optimize" >}}

The optimizer can be configured using the `optimizers` parameter of `EdgeConfig` when initializing the Edge Shard. For example:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-optimizer" >}}

For the optimizer parameters and the `optimize` return value, refer to [Optimizer Parameters](/documentation/edge/edge-api/configuration/#optimizer-parameters).

## Close the Edge Shard

When shutting down your application, close the Edge Shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to reopen the Edge Shard.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="close-edge-shard" >}}

In Rust there is no `close` method; the shard is flushed when it is dropped. Refer to [Close an Edge Shard](/documentation/edge/edge-api/shard-lifecycle/#close-an-edge-shard).

## Load Existing Edge Shard from Disk

After closing an Edge Shard, you can reopen it by loading its data and configuration from disk using the [`load`](/documentation/edge/edge-api/shard-lifecycle/#load-an-existing-edge-shard) method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="load-edge-shard" >}}

## Custom WAL Size

Qdrant Edge uses a Write-Ahead Log (WAL) to record every update before it's applied to storage. The WAL file is pre-allocated to 32 MB by default, inflating backup sizes and OS storage reports. To reduce the size, set `wal_options` on `EdgeConfig` when calling `new` or `load`. WAL options are only available in Rust.

For example, to set the WAL size to 4 MB:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="wal-options" >}}

When loading an existing Edge Shard, any parameter left unset on the supplied `EdgeConfig` keeps the value persisted with the shard. A config that only sets `wal_options` therefore leaves the rest of the shard's configuration untouched.

For every `WalOptions` field, refer to [WAL Options](/documentation/edge/edge-api/configuration/#wal-options).

## Tune the Search Thread Pool

Each Edge Shard owns a thread pool that runs per-segment reads such as `query`, `search`, `scroll`, `count`, and `facet` in parallel, and loads segments in parallel when the shard opens. The pool is built once when the shard opens and kept for its lifetime.

By default the pool is deliberately larger than the CPU count: four threads per CPU core. Per-segment reads spend much of their time waiting on I/O, so overcommitting keeps the CPU busy while other threads block. On a device where an Edge Shard shares a small number of cores with the rest of the application, that default can claim more than you want.

Two `EdgeConfig` parameters control the pool:

- `max_search_threads` sets the number of threads directly, replacing the CPU-derived default.
- `search_pool_core` pins every pool thread to one CPU core, bounding the shard's search compute to that core while keeping the pool's ability to overlap I/O.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="search-threads" >}}

Pinning is best-effort. If the core ID is unavailable, Qdrant Edge logs a warning and leaves the threads unpinned rather than failing. macOS treats thread affinity as a hint, so pinning may have no effect there.

<aside role="status">In Python, <code>EdgeConfig</code> requires <code>vectors</code> or <code>sparse_vectors</code> to be non-empty, so a configuration that only adjusts the thread pool must still declare the shard's vectors. Rust has no such restriction: <code>EdgeConfigBuilder</code> can build a configuration that sets only these parameters, and <code>load</code> takes the rest from the shard.</aside>

For both parameters, refer to [Configuration](/documentation/edge/edge-api/configuration/#edgeconfig).

## More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/dev/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/dev/lib/edge/publish/examples).
