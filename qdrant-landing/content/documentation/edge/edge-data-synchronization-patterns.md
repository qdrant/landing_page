---
title: "Data Synchronization Patterns" 
weight: 3
partition: ecosystem
---

# Data Synchronization Patterns

This page describes patterns for synchronizing data between Qdrant Edge Shards and Qdrant server collections. For a practical end-to-end guide on implementing these patterns, refer to the [Qdrant Edge Synchronization Guide](/documentation/edge/edge-synchronization-guide/).

## Initialize Edge Shard from Existing Qdrant Collection

Instead of starting with an empty Edge Shard, you may want to initialize it with pre-existing data from a collection on a Qdrant server. You can achieve this by restoring a snapshot of a shard in the server-side collection.

![Qdrant Edge Shards can be initialized from snapshots of server-side shards](/documentation/edge/qdrant-edge-restore-snapshot.png)

When creating a snapshot for synchronization, specify the applicable server-side shard ID in the snapshot URL. This allows for a single collection to serve multiple independent users or devices, each with its own Edge Shard. Read more about Qdrant's sharding strategy in the [Tiered Multitenancy Documentation](/documentation/guides/multitenancy/#tiered-multitenancy).

First, craft a snapshot URL:

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="snapshot-url" >}}

Note that this example uses shard ID `0`.

Using the snapshot URL, you can download the snapshot to the local disk and use its data to initialize a new Edge Shard.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="restore-snapshot" >}}

This code first downloads the snapshot to a temporary directory. Next, `EdgeShard.unpack_snapshot` unpacks the downloaded snapshot into the data directory, and a new instance of `EdgeShard` is created using the unpacked snapshot's data and configuration.

The `edge_shard` will use the same configuration and the same file structure as the source collection from which the snapshot was created, including vector and payload indexes.

## Update Qdrant Edge with Server-Side Changes

To keep an Edge Shard updated with new data from a server collection, you can periodically download and apply a snapshot. Restoring a full snapshot every time would create unnecessary overhead. Instead, you can use partial snapshots to restore changes since the last snapshot. A partial snapshot contains only those segments that have changed, based on the Edge Shard's manifest that describes all its segments and metadata. The `EdgeShard` class provides an `update_from_snapshot` method to update an Edge Shard from a partial snapshot.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="update-from-snapshot" >}}

## Update a Server Collection from an Edge Shard

To synchronize data from an Edge Shard to a server collection, implement a dual-write mechanism in your application. When you add or update a point in the Edge Shard, simultaneously store it in a server collection using the Qdrant client.

Instead of writing to the server collection directly, you may want to set up a background job or a message queue that handles the synchronization asynchronously. The device running the Edge Shard may not always have a stable internet connection, so queuing updates ensures that data is eventually synchronized when connectivity is restored.

First, initialize:
- an Edge Shard from scratch or from server-side snapshot 
- a Qdrant server connection.

<details>
<summary>Details</summary>

Initialize an Edge Shard:
{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="initialize-edge-shard" >}}

Initialize a Qdrant client connection to the server and create the target collection if it does not exist:

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="initialize-server-client" >}}
</details>

Next, instantiate the queue that will hold the points that need to be synchronized with the server:

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="create-upload-queue" >}}

When adding or updating points in the Edge Shard, also enqueue the point for synchronization with the server.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="upsert-point" >}}

A background worker can process the upload queue and synchronize points with the server collection.
This example uploads points in batches of up to 10 points at a time:

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-patterns/" block="process-upload-queue" >}}

Make sure to properly handle errors and retries in case of network issues or server unavailability.
