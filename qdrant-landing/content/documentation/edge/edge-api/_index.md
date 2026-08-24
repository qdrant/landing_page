---
title: "Edge API"
short_description: "Reference for the Qdrant Edge API: the EdgeShard methods available in Python and Rust, with their parameters and return values."
description: "Reference for the Qdrant Edge API. Covers the EdgeShard methods available in the Python bindings and the Rust crate, including parameters, return values, and language differences."
weight: 12
partition: develop
---

# The Edge API

To work with a Qdrant Edge Shard, use the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) package or the [`qdrant-edge` Rust crate](https://crates.io/crates/qdrant-edge). Both expose an `EdgeShard` type with methods to manage data, query it, and restore snapshots.

For task-oriented introductions, refer to the [Quickstart](/documentation/edge/edge-quickstart/) and the [Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/).

## Reference

| Page | What it covers |
|---|---|
| [Shard Lifecycle](/documentation/edge/edge-api/shard-lifecycle/) | Creating, loading, inspecting, flushing, and closing an Edge Shard |
| [Configuration](/documentation/edge/edge-api/configuration/) | `EdgeConfig`, dense and sparse vector parameters, optimizer settings and `optimize`, and WAL options |
| [Updating Data](/documentation/edge/edge-api/updating-data/) | The `update` method and the full set of update operations |
| [Reading Data](/documentation/edge/edge-api/reading-data/) | `query`, `search`, `scroll`, grouping, `retrieve`, `count`, `facet`, and `info` |
| [Snapshots](/documentation/edge/edge-api/snapshots/) | Unpacking snapshots, reading manifests, and applying snapshots to a shard |

## Language Differences

The Python bindings and the Rust crate cover the same core surface, but they are not identical. Each method notes the languages it is available in. The most significant differences are:

- Rust declares the read methods on the `EdgeShardRead` trait rather than on `EdgeShard` directly, so the trait must be in scope to call them.
- Rust exposes [`query_groups`](/documentation/edge/edge-api/reading-data/#query_groups) and [`search_matrix`](/documentation/edge/edge-api/reading-data/#search_matrix), which have no Python equivalent.
- Rust closes a shard by dropping it, while Python has an explicit `close` method.
- WAL options and the configuration setters are Rust only.
- [Applying a snapshot](/documentation/edge/edge-api/snapshots/#apply-a-snapshot) updates the shard in place in Python, but returns a new shard in Rust.

## More Examples

The Qdrant GitHub repository contains examples of using the Qdrant Edge API in [Python](https://github.com/qdrant/qdrant/tree/dev/lib/edge/python/examples) and [Rust](https://github.com/qdrant/qdrant/tree/dev/lib/edge/publish/examples).
