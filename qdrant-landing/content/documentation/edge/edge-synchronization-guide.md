---
title: "Synchronize with a Server" 
weight: 30
---

# Synchronize Qdrant Edge with a Server

Qdrant Edge can be synchronized with a collection from an external Qdrant server to support use cases like:

- **Offload indexing**: Indexing is a computationally expensive operation. By synchronizing an Edge Shard with a server collection, you can offload the indexing process to a more powerful server instance. The indexed data can then be synchronized back to the Edge Shard.
- **Back up and Restore**: Regularly back up your Edge Shard data to a central Qdrant instance to prevent data loss. In case of hardware failure or data corruption on the edge device, you can restore the data from the central instance.
- **Data Aggregation**: Collect data from multiple Edge Shards deployed in different locations and aggregate it into a central Qdrant instance for comprehensive analysis and reporting.
- **Synchronization between devices**: Keep data consistent across multiple edge devices by synchronizing their Edge Shards with a central Qdrant instance.

## Synchronizing Qdrant Edge with a Server

To support having local updates from the device as well as updates from a server, you can implement a setup with two Edge Shards:

- A **mutable** Edge Shard that handles local data updates.
- An **immutable** Edge Shard that mirrors a shard from a collection on a server using partial snapshots.

When querying data, merge results from both Edge Shards to provide a unified view. This way, new points added on the device are available for search alongside the data synchronized from the server.

![Qdrant Edge Shards can be synchronized with a central server](/documentation/edge/qdrant-edge-sync-with-server.png)

Implementing a dual-write mechanism that writes data to both the mutable Edge Shard and the server collection ensures that data is indexed on the server and synchronized back to the immutable Edge Shard, benefitting search performance.

For a Python example implementation of the patterns described in this guide, refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo).

### 1. Initialize a Mutable Edge Shard

The mutable Edge Shard will manage local data updates. It can be initialized from scratch, as detailed in the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="initialize-mutable-shard" >}}

### 2. Initialize an Immutable Edge Shard from a Server Snapshot

Next, create the immutable Edge Shard from a snapshot on the server, as outlined in [Initialize Edge Shard from existing Qdrant Collection](/documentation/edge/edge-data-synchronization-patterns/#initialize-edge-shard-from-existing-qdrant-collection):

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="initialize-immutable-shard" >}}

### 3. Implement a Dual-Write Mechanism

With both Edge Shards initialized, you can implement a dual-write mechanism in your application as outlined in [Update a Server Collection from an Edge Shard](/documentation/edge/edge-data-synchronization-patterns/#update-a-server-collection-from-an-edge-shard). When adding or updating a point, write it to the mutable Edge Shard and enqueue it for writing to the server collection.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="dual-write" >}}

Each point's payload should include a timestamp field (`SYNC_TIMESTAMP_KEY` in this example) that records when the point was upserted. This timestamp is used to deduplicate data when the immutable Edge Shard is synchronized with the server.

### 4. Periodically Update the Immutable Edge Shard

You can periodically update the immutable Edge Shard with changes from the server using partial snapshots, as described in [Update Qdrant Edge with Server-Side Changes](/documentation/edge/edge-data-synchronization-patterns/#update-qdrant-edge-with-server-side-changes).

While restoring a snapshot, you may want to pause and buffer any ongoing data updates on the mutable Edge Shard. Before taking the snapshot, ensure all queued data has been written to the server. After the restoration is complete, you can resume normal operations. Refer to the [Qdrant Edge Demo GitHub repository](https://github.com/qdrant/qdrant-edge-demo) for an example implementation in Python.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="update-immutable-shard" >}}

This example records a `sync_timestamp` at the time of creating the partial snapshot. All points that were added to the mutable Edge Shard before this timestamp are now restored to the immutable Edge Shard. These duplicate points can now be deleted from the mutable Edge Shard:

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="delete-synced-points" >}}

### 5. Query Both Edge Shards

To provide a unified search experience across all data, query both the mutable and immutable Edge Shards and merge the two result sets. Since a point may exist in both Edge Shards, deduplicate the results based on point ID.

{{< code-snippet path="/documentation/headless/snippets/edge/synchronization-guide/" block="query-both-shards" >}}

## Support

For explicit support in implementing Qdrant Edge in your project, please contact [Qdrant Sales](https://qdrant.tech/contact-us/).

