---
title: Collections
weight: 8
partition: develop
---
# Collections

A **collection** is a named set of points (vectors with optional payloads) that you can search. All vectors within a collection must have the same dimensionality and use the same distance metric.

This section covers everything you need to configure and manage collections:

- **[Collections](/documentation/collections/collections/)** — Create, update, and delete collections; configure distance metrics and vector parameters.
- **[Vectors](/documentation/collections/vectors/)** — Named vectors, sparse vectors, and multivector support for diverse embedding strategies.
- **[Storage](/documentation/collections/storage/)** — In-memory vs. on-disk storage options and how to configure them.
- **[Indexing](/documentation/collections/indexing/)** — HNSW vector index, payload indexes, and sparse vector indexes for faster search.
- **[Quantization](/documentation/collections/quantization/)** — Scalar, product, and binary quantization to reduce memory usage and speed up search.
- **[Multitenancy](/documentation/collections/multitenancy/)** — Serve multiple users from a single collection using payload-based partitioning.
