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

An Edge Shard is configured with a definition of the dense and sparse vectors that can be stored in the Edge Shard, similar to how you would configure a Qdrant collection. Set up a configuration by creating an instance of `EdgeConfig`:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="configure-edge-shard" >}}

## Initialize the Edge Shard

Now you can create an instance of `EdgeShard` with the storage directory and the configuration:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="initialize-edge-shard" >}}

## Work with Points

An Edge Shard has several methods to work with points. To add points, use the `update` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="upsert-points" >}}

To retrieve a point by ID, use the `retrieve` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="retrieve-point" >}}

## Query Points

To query points in the Edge Shard, use the `query` method:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="query-points" >}}

## Close the Edge Shard

When shutting down your application, close the Edge Shard to ensure all data is flushed to disk. The data is persisted on disk and can be used to reopen the Edge Shard.

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="close-edge-shard" >}}

## Load Existing Edge Shard from Disk

After closing an Edge Shard, you can reopen it by loading its data and configuration from disk. Create a new `EdgeShard` instance with the storage directory:

{{< code-snippet path="/documentation/headless/snippets/edge/quickstart/" block="load-edge-shard" >}}

## More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/master/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/master/lib/edge/examples).
