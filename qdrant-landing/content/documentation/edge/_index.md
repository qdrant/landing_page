---
title: "Qdrant Edge"
short_description: "Embed Qdrant Edge for in-process vector search on robots, kiosks, and mobile devices with low-latency local retrieval."
description: "Embed Qdrant Edge for in-process vector search on robots, kiosks, and mobile devices, with offline-capable local retrieval and optional server sync."
weight: 220
partition: develop
---

<aside role="status">Qdrant Edge is in beta. The API and functionality may change in future releases.</aside>

# What Is Qdrant Edge?

Qdrant Edge is a lightweight, embedded vector search engine for in-process retrieval with a minimal memory footprint and no background services. Qdrant Edge is designed for applications requiring low-latency vector search in environments with limited or intermittent connectivity, such as robots, kiosks, home assistants, and mobile phones.

Unlike Qdrant Server, which uses a client-server architecture, Qdrant Edge runs inside the application process. Think of it as SQLite, but for vector search. Data is stored and queried locally, ensuring low-latency access and enhanced privacy since data does not need to be transmitted to an external server. That said, Qdrant Edge provides APIs to [synchronize data with a Qdrant server](/documentation/edge/edge-data-synchronization-patterns/). This enables you to offload heavy computations such as indexing to more powerful server instances, back up and restore data, and centrally aggregate data from multiple edge devices. 

## Qdrant Edge Shard

Qdrant Edge is built around the concept of an **Edge Shard**: a self-contained storage unit that can operate independently. Each Edge Shard manages its own data, including vector and payload storage, and can perform local search and retrieval operations.

![Qdrant Edge Shards operate on edge devices](/documentation/edge/qdrant-edge.png)

To work with a Qdrant Edge Shard, use the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) package or the [`qdrant-edge` Rust crate](https://crates.io/crates/qdrant-edge). Both expose an `EdgeShard` type with methods to manage data, query it, and restore snapshots. To learn more about the available methods, refer to the [Edge API](/documentation/edge/edge-api/) page.

## Using Qdrant Edge

| Type         | Guide                                                                                  | What you'll learn                                                                                  |
|--------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| **Beginner** | [Qdrant Edge Quickstart](/documentation/edge/edge-quickstart/)             | Get started with Qdrant Edge and learn the basics of managing and querying data |
| **Beginner** | [On-Device Embeddings](/documentation/edge/edge-fastembed-embeddings/)     | Generate vector embeddings directly on edge devices using FastEmbed |
| **Beginner** | [On-Device BM25](/documentation/edge/edge-bm25/)                          | Generate BM25 sparse embeddings on-device for keyword search |
| **Reference** | [Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/) | Overview of patterns for synchronizing data between Edge Shards and Qdrant server collections |
| **Advanced** | [Synchronize with a Server](/documentation/edge/edge-synchronization-guide/) | Synchronize an Edge Shard with a Qdrant server collection to offload indexing and synchronize data between devices |
| **Reference** | [Edge API](/documentation/edge/edge-api/)                                 | Reference for the `EdgeShard` methods available in Python and Rust, with their parameters and return values |

### More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/dev/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/dev/lib/edge/publish/examples).

## Comparison Tables

Qdrant Edge and a Qdrant cluster share the same core search engine, but they're built for different environments.
Use the following tables to review where they align and diverge.

### Architecture & Deployment

How each option runs, connects, and scales.

| | Qdrant Edge | Qdrant Cluster |
| --- | --- | --- |
| **Architecture** | Embedded, in-process library | Client-server, accessed over the network |
| **Connectivity** | Works fully offline | Requires network access to the server |
| **Scaling** | Single shard, single device | Horizontal scaling across multiple nodes |
| **Multitenancy** | Manual: one Edge Shard per tenant | Native shard-key based multitenancy |

### Operations

How data gets indexed, optimized, and kept available.

| | Qdrant Edge | Qdrant Cluster |
| --- | --- | --- |
| **Indexing** | Manual, blocking `optimize()` call; no background optimizer | Continuous background optimizer |
| **High availability** | None; a single local shard | Replication and failover across nodes |
| **Data sync** | Snapshot-based sync with a server collection ([Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/)) | Not applicable |

### API & Features

How you talk to each option, and what you can do once connected.

| | Qdrant Edge | Qdrant Cluster |
| --- | --- | --- |
| **API** | In-process library API ([Python](https://pypi.org/project/qdrant-edge-py/) and [Rust](https://crates.io/crates/qdrant-edge) bindings) | REST and gRPC, plus all Qdrant client libraries |
| **HNSW indexing** | Supported | Supported |
| **Quantization** | Supported | Supported |
| **On-disk storage** | Supported | Supported |
| **Sparse vectors** | Supported | Supported |
| **Grouping (`query_groups`)** | Rust only; not exposed in Python | Available |
| **Search matrix (`search_matrix`)** | Rust only; not exposed in Python | Available |
