---
title: "Quickstart" 
weight: 10
---

# Qdrant Edge Quickstart

## Install Qdrant Edge

First, install the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) or the [Rust crate](https://crates.io/crates/qdrant-edge).

## Create a Storage Directory

A Qdrant Edge Shard stores its data in a local directory on disk. Create the directory if it doesn't exist yet:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="create-storage-directory" >}}

## Configure the Edge Shard

An Edge Shard is configured with a definition of the dense and sparse vectors that can be stored in the Edge Shard, similar to how you would configure a Qdrant collection.

Set up a configuration by creating an instance of `EdgeConfig` in Python or `EdgeShardConfig` in Rust. For example:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-edge-shard" >}}

## Initialize the Edge Shard

Now you can create an instance of `EdgeShard` with the storage directory and the configuration:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="initialize-edge-shard" >}}

## Work with Points

An Edge Shard has several methods to work with points. To add points, use the `update` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="upsert-points" >}}

To retrieve a point by ID, use the `retrieve` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="retrieve-point" >}}

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

The optimizer can be configured using the `optimizers` parameter of `EdgeConfig` (Python) or `EdgeShardConfig` (Rust) when initializing the Edge Shard. For example:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-optimizer" >}}

## Close the Edge Shard

When shutting down your application, close the Edge Shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to reopen the Edge Shard.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="close-edge-shard" >}}

## Load Existing Edge Shard from Disk

After closing an Edge Shard, you can reopen it by loading its data and configuration from disk. Create a new `EdgeShard` instance with the storage directory:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="load-edge-shard" >}}

## More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/master/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/master/lib/edge/examples).
