---
title: Manage Data
weight: 202
partition: develop
---
# Manage Data

Qdrant stores data as **[points](/documentation/manage-data/points/)**. Each point consists of one or more  **[vectors](/documentation/manage-data/vectors/)** and an optional **[payload](/documentation/manage-data/payload/)** (structured metadata). Points are stored in a **[collection](/documentation/manage-data/collections/)**. A collection is a named set of points that you can **[search](/documentation/search/)**.

This section covers how to write, update, and move data in your collections.

- **[Points](/documentation/manage-data/points/)** — Insert, update, and delete vectors and their associated payloads.
- **[Vectors](/documentation/manage-data/vectors/)** — Named vectors, sparse vectors, and multivector support for diverse embedding strategies.
- **[Payload](/documentation/manage-data/payload/)** — Attach and manage structured metadata on points; supported payload types and schema.
- **[Collections](/documentation/manage-data/collections/)** — Create, update, and delete collections; configure distance metrics and vector parameters.
- **[Storage](/documentation/manage-data/storage/)** — In-memory vs. on-disk storage options and how to configure them.
- **[Indexing](/documentation/manage-data/indexing/)** — HNSW vector index, payload indexes, and sparse vector indexes for faster search.
- **[Quantization](/documentation/manage-data/quantization/)** — Scalar, product, and binary quantization to reduce memory usage and speed up search.
- **[Multitenancy](/documentation/manage-data/multitenancy/)** — Serve multiple users from a single collection using payload-based partitioning.
- **[Bulk Upload](/documentation/manage-data/bulk-upload/)** — Efficiently load large datasets using batch upsert and streaming ingestion.
- **[Migrate Data](/documentation/manage-data/migration/)** — Move data between collections or Qdrant instances without downtime.
