---
title: "Edge API"
short_description: "Reference for the Qdrant Edge API: the EdgeShard methods available in Python and Rust, with their parameters and return values."
description: "Reference for the Qdrant Edge API. Covers the EdgeShard methods available in the Python bindings and the Rust crate, including parameters, return values, and language differences."
weight: 12
partition: develop
---

# The Edge API

To work with a Qdrant Edge Shard, use the [Python Bindings for Qdrant Edge](https://pypi.org/project/qdrant-edge-py/) package or the [`qdrant-edge` Rust crate](https://crates.io/crates/qdrant-edge). Both expose an `EdgeShard` type with methods to manage data, query it, and restore snapshots.

For task-oriented introductions, see the [Quickstart](/documentation/edge/edge-quickstart/) and the [Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/).

## Shard Lifecycle

An Edge Shard is backed by a directory on local disk. The lifecycle of a shard is:

1. **Create** a new shard with `EdgeShard.create` (Python) or `EdgeShard::new` (Rust), or **load** an existing one with `load`.
2. **Use** the shard to update and query data.
3. **Flush** pending changes to disk, and **close** the shard to release its resources.

Because the shard owns the files in its directory, only one read-write `EdgeShard` may be open on a given directory at a time.

### Create a New Edge Shard

Creates a new Edge Shard at `path` using the supplied configuration.

```python
@staticmethod
def create(path: str, config: EdgeConfig) -> EdgeShard
```

```rust
pub fn new(path: &Path, config: EdgeConfig) -> OperationResult<EdgeShard>
```

| Parameter | Type | Description |
|---|---|---|
| `path` | `str` (Python) / `&Path` (Rust) | Path to the shard directory. Must not already contain segment data. |
| `config` | `EdgeConfig` | Configuration for the new shard. Required. |

**Returns** a new `EdgeShard` instance.

Creation fails if the shard's segments directory already contains any segment. To open a directory that already holds data, use [`load`](#load-an-existing-edge-shard) instead.

The configuration is persisted to `edge_config.json` inside the shard directory, so a later `load` can recover it without you passing it again. Write-ahead log behavior follows `config.wal_options`, which defaults to 32 MiB segments when unset. See [Custom WAL Size](/documentation/edge/edge-quickstart/#custom-wal-size).

### Load an Existing Edge Shard

Opens an Edge Shard from existing files at `path`.

```python
@staticmethod
def load(path: str, config: Optional[EdgeConfig] = None) -> EdgeShard
```

```rust
pub fn load(path: &Path, config: Option<EdgeConfig>) -> OperationResult<EdgeShard>
```

| Parameter | Type | Description |
|---|---|---|
| `path` | `str` (Python) / `&Path` (Rust) | Path to an existing shard directory. |
| `config` | `EdgeConfig`, optional | Configuration overrides. When omitted, the shard's persisted configuration is used. |

**Returns** the loaded `EdgeShard` instance.

Loading fails if the directory contains no segments and no configuration can be loaded or inferred.

<aside role="status">The <code>vectors</code> and <code>sparse_vectors</code> parameters define the data the shard stores and cannot be changed by <code>load</code>. If you supply them, they are validated for compatibility against the loaded segments; if you omit them, they are taken from the persisted configuration or from the segments themselves. To add or remove a named vector, use an update operation instead. Refer to <a href="/documentation/edge/edge-quickstart/#modify-the-vector-schema">Modify the Vector Schema</a>.</aside>

Parameters that you change and that affect stored segments do not take effect immediately. Existing segments converge to the new value as the [optimizers](/documentation/edge/edge-quickstart/#optimize-the-edge-shard) run.

### Inspect the Path and Configuration

Return the shard's directory and its currently resolved configuration. Rust only.

```rust
pub fn path(&self) -> &Path
pub fn config(&self) -> parking_lot::RwLockReadGuard<'_, EdgeConfig>
```

`config` returns a read guard rather than a copy, so the configuration cannot be mutated through it and the guard should be dropped promptly. To change configuration on a live shard, use `set_hnsw_config`, `set_vector_hnsw_config`, or `set_optimizers_config`.

### Flush Pending Changes

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

### Close an Edge Shard

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

### Read-Only and Update-Only Edge Shards

In addition to the read-write `EdgeShard`, the Rust crate exposes two single-purpose shard types. Neither is available in the Python bindings.

| Type | Constructor | Purpose |
|---|---|---|
| `ReadOnlyEdgeShard` | `open_mmap(path)` | A read-only follower that serves queries without writing to the directory. |
| `UpdateOnlyEdgeShard` | `open_mmap(path)` | A writer that applies updates without building query-time structures. |

```rust
pub fn open_mmap(path: &Path) -> OperationResult<Self>
```

`ReadOnlyEdgeShard` discovers segments through the segment manifest written by the read-write shard, so it requires the `write_segment_manifest` feature flag to be enabled on the writer. That flag is disabled by default. `UpdateOnlyEdgeShard` discovers segments by scanning the `segments/` directory instead, since the writer owns the directory it writes to.

Both types also have a generic `open` constructor that takes an explicit read backend and, for the read-only shard, an optional load profile. These are intended for deployments that read segments over a non-local filesystem.

## Configuration

`EdgeConfig` describes the vectors an Edge Shard stores and the parameters that govern how it indexes, stores, and searches them. Pass it to `create`/`new` when starting a new shard, and optionally to `load` when reopening one.

Every parameter except `vectors` and `sparse_vectors` is optional. A parameter left unset is "not specified" rather than "set to the default": when loading an existing shard, each unspecified parameter resolves through **provided → persisted in `edge_config.json` → derived from the existing segments → default**, so it keeps whatever the shard already has. This is why a configuration that sets only `wal_options` leaves the rest of the shard's configuration untouched.

### EdgeConfig

```python
EdgeConfig(
    vectors: Optional[Union[EdgeVectorParams, Dict[str, EdgeVectorParams]]] = None,
    sparse_vectors: Optional[Dict[str, EdgeSparseVectorParams]] = None,
    on_disk_payload: Optional[bool] = None,
    hnsw_config: Optional[HnswIndexConfig] = None,
    quantization_config: Optional[QuantizationConfigType] = None,
    optimizers: Optional[EdgeOptimizersConfig] = None,
    max_search_threads: Optional[int] = None,
    search_pool_core: Optional[int] = None,
)
```

In Rust, `EdgeConfig` is a struct whose fields you can set directly, or build with the fluent `EdgeConfig::builder()`:

```rust
let config = EdgeConfig::builder()
    .vector("text", EdgeVectorParams::builder(384, Distance::Cosine).build())
    .on_disk_payload(true)
    .build();
```

| Parameter | Type | Description |
|---|---|---|
| `vectors` | `EdgeVectorParams` or map of name to `EdgeVectorParams` | Dense vector configuration. In Python, a single `EdgeVectorParams` configures the default unnamed vector. Optional if `sparse_vectors` is given. |
| `sparse_vectors` | map of name to `EdgeSparseVectorParams` | Sparse vector configuration. |
| `on_disk_payload` | `bool` | Store payload on disk with mmap rather than in RAM. Defaults to on-disk. |
| `hnsw_config` | `HnswIndexConfig` | Global HNSW parameters, used when building the HNSW index. Override per vector with `EdgeVectorParams.hnsw_config`. |
| `quantization_config` | quantization config | Global quantization. Override per vector with `EdgeVectorParams.quantization_config`. Refer to [Quantization](/documentation/manage-data/quantization/). |
| `optimizers` | `EdgeOptimizersConfig` | Optimizer parameters. Refer to [Optimizer Parameters](#optimizer-parameters). |
| `max_search_threads` | `int` | Size of the shard's search thread pool, which runs per-segment reads in parallel and loads segments in parallel. Defaults to a count derived from the number of CPUs. |
| `search_pool_core` | `int` | Pin every search pool thread to this CPU core, bounding the shard's search compute to one core while keeping the pool's I/O overlap. Best-effort. Defaults to OS scheduling. |
| `wal_options` | `WalOptions` | Write-ahead log parameters. Rust only. Refer to [WAL Options](#wal-options). |

At least one of `vectors` or `sparse_vectors` must be configured. Both define the data the shard stores and are validated against existing segments on `load` rather than converging through the optimizers.

### Dense Vector Parameters

`EdgeVectorParams` configures one named dense vector. `size` and `distance` are required and cannot be changed after the shard is created.

```python
EdgeVectorParams(
    size: int,
    distance: Distance,
    on_disk: Optional[bool] = None,
    multivector_config: Optional[MultiVectorConfig] = None,
    datatype: Optional[VectorStorageDatatype] = None,
    quantization_config: Optional[QuantizationConfigType] = None,
    hnsw_config: Optional[HnswIndexConfig] = None,
)
```

```rust
pub fn builder(size: usize, distance: Distance) -> EdgeVectorParamsBuilder
```

| Parameter | Type | Description |
|---|---|---|
| `size` | `int` | Vector dimension. Required. |
| `distance` | `Distance` | Distance metric. Required. |
| `on_disk` | `bool` | Store vectors on disk with mmap rather than in RAM. |
| `multivector_config` | `MultiVectorConfig` | Multi-vector configuration, for late-interaction models. |
| `datatype` | `VectorStorageDatatype` | Storage datatype for the vector. |
| `quantization_config` | quantization config | Per-vector quantization, overriding the global setting. |
| `hnsw_config` | `HnswIndexConfig` | Per-vector HNSW parameters, overriding the global setting. |

### Sparse Vector Parameters

`EdgeSparseVectorParams` configures one named sparse vector. All parameters are optional.

```python
EdgeSparseVectorParams(
    full_scan_threshold: Optional[int] = None,
    on_disk: Optional[bool] = None,
    modifier: Optional[Modifier] = None,
    datatype: Optional[VectorStorageDatatype] = None,
)
```

```rust
pub fn builder() -> EdgeSparseVectorParamsBuilder
```

| Parameter | Type | Description |
|---|---|---|
| `full_scan_threshold` | `int` | Threshold below which a full scan is used instead of the sparse index. |
| `on_disk` | `bool` | Store the sparse index on disk rather than in RAM. |
| `modifier` | `Modifier` | Score modifier. Set to `Modifier.Idf` for BM25 scoring. Refer to [BM25 with Qdrant Edge](/documentation/edge/edge-bm25/). |
| `datatype` | `VectorStorageDatatype` | Storage datatype for the vector. |

### Optimizer Parameters

`EdgeOptimizersConfig` controls what the [`optimize`](/documentation/edge/edge-quickstart/#optimize-the-edge-shard) method does when you call it. It is a subset of the server-side collection optimizer config: it omits `flush_interval_sec`, because an Edge Shard does not flush on a timer, and `max_optimization_threads`, because optimization is invoked manually.

```python
EdgeOptimizersConfig(
    deleted_threshold: Optional[float] = None,
    vacuum_min_vector_number: Optional[int] = None,
    default_segment_number: Optional[int] = None,
    max_segment_size: Optional[int] = None,
    indexing_threshold: Optional[int] = None,
    prevent_unoptimized: Optional[bool] = None,
)
```

| Parameter | Type | Description |
|---|---|---|
| `deleted_threshold` | `float` | Minimum fraction of deleted vectors in a segment required to run vacuum. Default: `0.2`. |
| `vacuum_min_vector_number` | `int` | Minimum number of vectors in a segment required to run vacuum. Default: `1000`. |
| `default_segment_number` | `int` | Target number of segments. `0` chooses automatically from the CPU count. |
| `max_segment_size` | `int` | Maximum segment size in KB. Derived from the CPU count when unset. |
| `indexing_threshold` | `int` | Size in KB above which a segment gets an HNSW index. |
| `prevent_unoptimized` | `bool` | Store points written to unoptimized segments larger than the indexing threshold as deferred points: they are persisted but excluded from reads and searches until the segments are optimized. |

### WAL Options

Qdrant Edge records every update in a write-ahead log before applying it to storage. `WalOptions` is available in Rust only, and is set through `EdgeConfig.wal_options`.

```rust
pub struct WalOptions {
    pub segment_capacity: usize,
    pub segment_queue_len: usize,
    pub retain_closed: NonZeroUsize,
}
```

| Parameter | Type | Description |
|---|---|---|
| `segment_capacity` | `usize` | WAL segment capacity in bytes. Default: 32 MiB. |
| `segment_queue_len` | `usize` | Number of segments to pre-create so appends never wait on segment creation. Default: `0`. |
| `retain_closed` | `NonZeroUsize` | Number of closed WAL files to retain. Default: `1`. |

The WAL file is pre-allocated to `segment_capacity`, which inflates backup sizes and OS storage reports. Reduce it for embedded and mobile deployments where 32 MiB is too large. Refer to [Custom WAL Size](/documentation/edge/edge-quickstart/#custom-wal-size).

### Change Configuration on a Live Shard

Update a shard's configuration after it has been opened and persist the change to `edge_config.json`. Rust only.

```rust
pub fn set_hnsw_config(&self, hnsw_config: HnswConfig) -> OperationResult<()>
pub fn set_vector_hnsw_config(&self, vector_name: &str, hnsw_config: HnswConfig) -> OperationResult<()>
pub fn set_optimizers_config(&self, optimizers: EdgeOptimizersConfig) -> OperationResult<()>
```

| Method | Description |
|---|---|
| `set_hnsw_config` | Sets the global HNSW config. Does not affect per-vector overrides. |
| `set_vector_hnsw_config` | Sets the HNSW config for one named vector. Fails if the vector does not exist. |
| `set_optimizers_config` | Sets the optimizer parameters. |

Changes apply to work done after the call. Existing segments converge to the new parameters as the optimizers run.

<aside role="status">These setters cover HNSW and optimizer parameters only. Immutable properties such as a vector's <code>size</code> and <code>distance</code> cannot be changed on an existing shard, and there is no setter for quantization or payload storage. In Python, configuration can only be supplied at <code>create</code> or <code>load</code> time.</aside>

<!--

TO DO

Sections still to write, using the same shape as Shard Lifecycle above:

- [ ] Updating Data — `update` plus the UpdateOperation constructors
- [ ] Querying Data — `query`, `search`, `rescore_with_formula`, `scroll`,
      `query_scroll`, and the Rust request builders
- [ ] Reading Data — `retrieve`, `count`, `facet`, `info`
- [ ] Snapshots — `unpack_snapshot`, `snapshot_manifest`,
      `recover_partial_snapshot` (Rust) / `update_from_snapshot` (Python)
- [ ] Optimization — `optimize`

Open questions:

- [ ] Add a row to the table in _index.md.
- [ ] Should ReadOnlyEdgeShard / UpdateOnlyEdgeShard be documented here at all?
      They look like serverless infrastructure rather than Edge user API.
- [ ] Decide whether to keep inline signature blocks or move to runnable
      code-snippet blocks under headless/snippets/edge/api/.

-->
