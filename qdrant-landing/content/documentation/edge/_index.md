---
title: "Qdrant Edge"
weight: 13
partition: qdrant
---

<aside role="status">Qdrant Edge is in beta. The API and functionality may change in future releases.</aside>

# What Is Qdrant Edge?

Qdrant Edge is a lightweight, embedded vector search engine for in-process retrieval with a minimal memory footprint and no background services. Qdrant Edge is designed for applications requiring low-latency vector search in environments with limited or intermittent connectivity, such as robots, kiosks, home assistants, and mobile phones.

Unlike Qdrant Server, which uses a client-server architecture, Qdrant Edge runs inside the application process. Think of it as SQLite, but for vector search. Data is stored and queried locally, ensuring low-latency access and enhanced privacy since data does not need to be transmitted to an external server. That said, Qdrant Edge provides APIs to [synchronize data with a Qdrant server](/documentation/edge/edge-data-synchronization-patterns/). This enables you to offload heavy computations such as indexing to more powerful server instances, back up and restore data, and centrally aggregate data from multiple edge devices. 

## Qdrant Edge Shard

Qdrant Edge is built around the concept of an **Edge Shard**: a self-contained storage unit that can operate independently. Each Edge Shard manages its own data, including vector and payload storage, and can perform local search and retrieval operations.

![Qdrant Edge Shards operate on edge devices](/documentation/edge/qdrant-edge.png)

To work with a Qdrant Edge Shard, use the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) package or the [`qdrant-edge` Rust crate](https://crates.io/crates/qdrant-edge). This library provides an `EdgeShard` class with methods to manage data, query it, and restore snapshots:

- `update`: Updates the data.
- `query`: Queries the data.
- `facet`: Returns the top N distinct values of a payload field, sorted by the number of points that have each value.
- `scroll`: Returns all points.
- `count`: Returns the number of points.
- `retrieve`: Retrieves points with the given IDs.
- `flush`: Flushes the data to ensure that all writes have been persisted to disk.
- `close`: Cleanly destroys the shard instance, ensuring the data is flushed (Python). The data is persisted on disk and can be used to create another shard. In Rust, use the `Drop` trait to ensure the shard is closed when it goes out of scope.
- `optimize`: Optimizes the Edge Shard by removing data marked for deletion, merging segments, and creating indexes.
- `info`: Returns metadata information about the shard.
- `unpack_snapshot`: Unpacks a snapshot on disk.
- `snapshot_manifest`: Returns the current shard’s snapshot manifest.
- `update_from_snapshot`: Applies a snapshot to the shard.

## Using Qdrant Edge

| Type         | Guide                                                                                  | What you'll learn                                                                                  |
|--------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| **Beginner** | [Qdrant Edge Quickstart](/documentation/edge/edge-quickstart/)             | Get started with Qdrant Edge and learn the basics of managing and querying data |
| **Beginner** | [On-Device Embeddings](/documentation/edge/edge-fastembed-embeddings/)     | Generate vector embeddings directly on edge devices using FastEmbed |
| **Reference** | [Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/) | Overview of patterns for synchronizing data between Edge Shards and Qdrant server collections |
| **Advanced** | [Synchronize with a Server](/documentation/edge/edge-synchronization-guide/) | Synchronize an Edge Shard with a Qdrant server collection to offload indexing and synchronize data between devices |

### More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/master/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/master/lib/edge/examples).

