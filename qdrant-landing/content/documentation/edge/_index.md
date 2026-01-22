---
title: "Qdrant Edge"
weight: 13
partition: qdrant
---

<aside role="status">Qdrant Edge is in beta. The API and functionality may change in future releases.</aside>

# What Is Qdrant Edge?

Qdrant Edge is a lightweight, embedded vector search engine for AI on devices like robots, kiosks, home assistants, and mobile phones. Designed for real-time vector search on edge devices with limited computational resources, Qdrant Edge allows applications to use Qdrant's functionality even with intermittent or no internet connectivity.

Qdrant Edge does not run as a separate process. Instead, it runs inside an application process. Data is stored and queried locally on the device, ensuring low-latency access and enhanced privacy since data does not need to be transmitted to an external server. That said, Qdrant Edge provides APIs to [synchronize data with a Qdrant server](/documentation/edge/edge-synchronizing-with-the-cloud/). This enables you to offload heavy computations such as indexing to more powerful server instances, back up and restore data, and centrally aggregate data from multiple edge devices. 

## Qdrant Edge Shard

Qdrant Edge is built around the concept of an **Edge Shard**: a self-contained storage unit that can operate independently on edge devices. Each Edge Shard manages its own data, including vector and payload storage, and can perform local search and retrieval operations.

To work with a Qdrant Edge Shard from a Python application, use the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) package. This package provides an `EdgeShard` class with methods to manage data, query it, and restore snapshots:

- `update`: Updates the data.
- `query`: Queries the data.
- `scroll`: Returns all points.
- `count`: Returns the number of points.
- `retrieve`: Retrieves points with the given IDs.
- `flush`: Flushes the data to ensure that all writes have been persisted to disk.
- `close`: Cleanly destroys the shard instance, ensuring the data is flushed. The data is persisted on disk and can be used to create another shard.
- `info`: Returns metadata information about the shard.
- `unpack_snapshot`: Unpacks a snapshot on disk.
- `snapshot_manifest`: Returns the current shard’s snapshot manifest.
- `update_from_snapshot`: Applies a snapshot to the shard.

## Using Qdrant Edge

To get started with Qdrant Edge, refer to the [Qdrant Edge Quickstart Guide](/documentation/edge/edge-quickstart/).


## More Examples

More examples and advanced usage of Qdrant Edge API can be found in the [GitHub repository](https://github.com/qdrant/qdrant/tree/master/lib/edge/python/examples).

