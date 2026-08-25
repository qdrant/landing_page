---
title: "Shard Lifecycle"
short_description: "Create, load, inspect, flush, and close a Qdrant Edge Shard with the Python bindings or the Rust crate."
description: "Reference for the Qdrant Edge Shard lifecycle methods: creating a new shard, loading an existing one, inspecting its path and configuration, flushing to disk, and closing it."
weight: 10
---

# Shard Lifecycle

An Edge Shard is backed by a directory on local disk. The lifecycle of a shard is:

1. **Create** a new shard with `EdgeShard.create` (Python) or `EdgeShard::new` (Rust), or **load** an existing one with `load`.
2. **Use** the shard to update and query data.
3. **Flush** pending changes to disk, and **close** the shard to release its resources.

Because the shard owns the files in its directory, only one `EdgeShard` may be open on a given directory at a time.

## Create a New Edge Shard

Creates a new Edge Shard at `path` using the supplied configuration.

```python
@staticmethod
def create(path: str, config: EdgeConfig) -> EdgeShard
```

```rust
pub fn new(path: &Path, config: EdgeConfig) -> OperationResult<EdgeShard>
```

| Parameter | Description |
|---|---|
| `path` | Path to the shard directory. Must not already contain segment data. |
| `config` | Configuration for the new shard. Required. |

**Returns** a new `EdgeShard` instance.

Creation fails if the shard's segments directory already contains any segment. To open a directory that already holds data, use [`load`](#load-an-existing-edge-shard) instead.

The configuration is persisted to `edge_config.json` inside the shard directory, so a later `load` can recover it without you passing it again. Write-ahead log behavior follows `config.wal_options`, which defaults to 32 MiB segments when unset. See [Custom WAL Size](/documentation/edge/edge-quickstart/#custom-wal-size).

## Load an Existing Edge Shard

Opens an Edge Shard from existing files at `path`.

```python
@staticmethod
def load(path: str, config: Optional[EdgeConfig] = None) -> EdgeShard
```

```rust
pub fn load(path: &Path, config: Option<EdgeConfig>) -> OperationResult<EdgeShard>
```

| Parameter | Description |
|---|---|
| `path` | Path to an existing shard directory. |
| `config` | Configuration overrides. When omitted, the shard's persisted configuration is used. |

**Returns** the loaded `EdgeShard` instance.

Loading fails if the directory contains no segments and no configuration can be loaded or inferred.

<aside role="status">The <code>vectors</code> and <code>sparse_vectors</code> parameters define the data the shard stores and cannot be changed by <code>load</code>. If you supply them, they are validated for compatibility against the loaded segments; if you omit them, they are taken from the persisted configuration or from the segments themselves. To add or remove a named vector, use an update operation instead. Refer to <a href="/documentation/edge/edge-quickstart/#modify-the-vector-schema">Modify the Vector Schema</a>.</aside>

Parameters that you change and that affect stored segments do not take effect immediately. Existing segments converge to the new value as the [optimizers](/documentation/edge/edge-quickstart/#optimize-the-edge-shard) run.

## Inspect the Path and Configuration

*Rust only*

Return the shard's directory and its currently resolved configuration.

```rust
pub fn path(&self) -> &Path
pub fn config(&self) -> parking_lot::RwLockReadGuard<'_, EdgeConfig>
```

`config` returns a read guard rather than a copy, so the configuration cannot be mutated through it and the guard should be dropped promptly. To change configuration on a live shard, use `set_hnsw_config`, `set_vector_hnsw_config`, or `set_optimizers_config`.

## info

Returns metadata about the shard's contents.

```python
def info(self) -> ShardInfo
```

```rust
fn info(&self) -> OperationResult<ShardInfo>
```

In Rust, `info` comes from the `EdgeShardRead` trait rather than from `EdgeShard` itself, so bring it into scope with `use qdrant_edge::EdgeShardRead;` before calling it.

`ShardInfo` carries the following fields. The counts are summed across segments, and a point can be present in more than one segment before it is optimized, so `points_count` and `indexed_vectors_count` are **approximate** and can read higher than the number of distinct points:

| Field | Type | Description |
|---|---|---|
| `segments_count` | `int` | Number of segments in the shard. |
| `points_count` | `int` | Approximate number of points stored. |
| `indexed_vectors_count` | `int` | Approximate number of vectors that have been added to a vector index. |
| `payload_schema` | map of field name to `PayloadIndexInfo` | The shard's payload indexes. |

An `indexed_vectors_count` well below `points_count` means segments are still waiting to be optimized. Refer to [`optimize`](/documentation/edge/edge-api/configuration/#optimize).

## Flush Pending Changes

Persists the write-ahead log and all segments to disk.

```python
def flush(self) -> None
```

```rust
pub fn flush(&self) -> OperationResult<()>
```

**Returns** nothing in Python. In Rust, returns `Ok(())` on success, or an error if the WAL or a segment could not be flushed.

`flush` blocks until the WAL and segment locks are free. A flush issued while an `update` or `optimize` is in flight waits for that operation to finish and then persists, rather than failing with a lock contention error. A genuine I/O error during the flush is still surfaced to the caller.

<aside role="status">In Rust, do not call <code>flush</code> from a thread that already holds the shard's WAL mutex or a segments guard. The underlying locks are not reentrant and the call would deadlock.</aside>

## Close an Edge Shard

Closes the shard and releases its resources.

```python
def close(self) -> None
```

Rust has no `close` method. `EdgeShard` implements `Drop`, so the shard is closed when it goes out of scope:

```rust
{
    let shard = EdgeShard::new(path, config)?;
    // ... use the shard ...
} // `shard` is dropped here, flushing to disk
```

In both languages, closing flushes pending data to disk. The data remains on disk and the directory can be reopened with `load`.

<aside role="status">The Rust <code>Drop</code> implementation flushes on a best-effort basis: a flush error is logged rather than returned, because a destructor cannot fail. If you need to detect a failed flush, call <code>flush</code> explicitly and handle its result before the shard goes out of scope.</aside>
