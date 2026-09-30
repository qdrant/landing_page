---
title: "Edge vs. Qdrant Cluster"
short_description: "Compare Qdrant Edge and Qdrant Server across architecture, deployment, operations, and API surface."
description: "Compare Qdrant Edge with Qdrant Server across architecture, deployment, operations, and API surface to decide which fits your use case."
weight: 5
partition: develop
---

# Comparing Qdrant Edge with Qdrant Server

Qdrant Edge and Qdrant Server share the same core search engine, but they're built for different use cases.
Use the following tables to review where they align and diverge. Rows marked *distributed mode* describe capabilities that require a multi-node Qdrant cluster.

## Architecture & Deployment

How each option runs, connects, and scales.

| | Qdrant Edge | Qdrant Server |
| --- | --- | --- |
| **Architecture** | Embedded, in-process library | Client-server, accessed over the network |
| **Connectivity** | Works fully offline | Requires network access to the server |
| **Scaling** | Single shard, single device | Horizontal scaling across multiple nodes (*distributed mode*) |
| **Collections** | No collection concept; use one Edge Shard per dataset | Named collections with aliases, managed through the collection API |
| **Multitenancy** | Payload-based partitioning within one shard, or one Edge Shard per tenant/device | Payload partitioning, user-defined sharding, or tiered — refer to [Multitenancy](/documentation/manage-data/multitenancy/) |

## Operations

How data gets indexed, optimized, and kept available.

| | Qdrant Edge | Qdrant Server |
| --- | --- | --- |
| **Optimization** | Manual, by calling `optimize()`; runs synchronously | Continuous background optimizer |
| **HNSW indexing** | Manual indexing for large shards via `optimize()`; new points are brute-force searchable until then | Automatic background indexing |
| **High availability** | None; a single local shard | Replication and failover across nodes (*distributed mode*) |
| **Snapshots** | Restore snapshots only | Create and restore snapshots |

## API & Features

How you talk to each option, and what you can do once connected.

| | Qdrant Edge | Qdrant Server |
| --- | --- | --- |
| **API** | In-process library API ([Python](https://pypi.org/project/qdrant-edge-py/) and [Rust](https://crates.io/crates/qdrant-edge) bindings) | REST and gRPC, plus all Qdrant client libraries |
| **Dense vectors** | Supported | Supported |
| **Sparse vectors** | Supported | Supported |
| **Multivectors** | Supported | Supported |
| **Named vectors** | Supported | Supported |
| **Hybrid search** | Supported | Supported |
| **Quantization** | Supported | Supported |
| **Distance metrics** | Cosine, Dot, Euclid, and Manhattan | Cosine, Dot, Euclid, and Manhattan |
| **HNSW indexing** | Supported | Supported |
| **Payload indexes** | All field types | All field types |
| **Query scoring** | Nearest neighbor, recommendation, discovery, context, formula, MMR, order-by, and sample | Nearest neighbor, recommendation, discovery, context, formula, MMR, order-by, and sample |
| **Grouping (`query_groups`)** | Rust only | Available |
| **Search matrix (`search_matrix`)** | Rust only | Available |
