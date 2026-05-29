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

## Initialize the Edge Shard

Now you can create a new `EdgeShard` using `EdgeShard.create` (Python) or `EdgeShard::new` (Rust), passing the storage directory and configuration:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="initialize-edge-shard" >}}

Note that `create` and `new` will fail if the storage directory already contains data. To initialize an Edge Shard with existing data, see [Load Existing Edge Shard from Disk](#load-existing-edge-shard-from-disk).

## Work with Points

An Edge Shard has several methods to work with points. To add points, use the `update` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="upsert-points" >}}

To retrieve a point by ID, use the `retrieve` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="retrieve-point" >}}

## Modify the Vector Schema

You can add or remove named vectors to an existing Edge Shard's schema. This is useful when migrating to a new embedding model or adding hybrid search to an Edge Shard that already contains data.

For example, to add a sparse vector for [BM25 keyword search](/documentation/edge/edge-bm25/):

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="modify-vector-schema" >}}

Existing points aren't automatically populated with the new vector. Re-upsert them to add their values for the new field.

To remove a named vector, use `UpdateOperation.delete_vector_name("text")` (Python) or `VectorNameOperations::DeleteVectorName` (Rust).

## Create a Payload Index

To optimize operations like [filtering](#filtering) and [faceting](#faceting) on payload fields, first create a payload index on the fields you plan to use with these operations:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="create-payload-index" >}}

## Query Points

To query points in the Edge Shard, use the `query` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="query-points" >}}

## Filter points

You can also filter points based on payload fields:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="filter" >}}

## Create Facets

To create facets on a payload field, use the `facet` method.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="facet" >}}

## Optimize the Edge Shard

Optimization is the process of removing data marked for deletion, merging segments, and creating indexes. Qdrant Edge does not have a background optimizer. Instead, an application can call the `optimize` method to synchronously run optimization at a suitable time, such as during low-traffic periods or after a batch of updates.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="optimize" >}}

The optimizer can be configured using the `optimizers` parameter of `EdgeConfig` when initializing the Edge Shard. For example:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-optimizer" >}}

## Close the Edge Shard

When shutting down your application, close the Edge Shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to reopen the Edge Shard.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="close-edge-shard" >}}

## Load Existing Edge Shard from Disk

After closing an Edge Shard, you can reopen it by loading its data and configuration from disk using the `load` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="load-edge-shard" >}}

## Custom WAL Size

Qdrant Edge uses a Write-Ahead Log (WAL) to record every update before it's applied to storage. On iOS and Android, the WAL file is pre-allocated to 32 MB by default, inflating backup sizes and OS storage reports. To reduce the size, set `wal_options` on `EdgeConfig` when calling `new` or `load`. WAL options are only available in Rust.

For example, to set the WAL size to 4 MB:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="wal-options" >}}

## More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/dev/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/dev/lib/edge/publish/examples).