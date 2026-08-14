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

Because the shard owns the files in its directory, only one `EdgeShard` may be open on a given directory at a time.

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

## Configuration

`EdgeConfig` describes the vectors an Edge Shard stores and the parameters that govern how it indexes, stores, and searches them. Pass it to `create`/`new` when starting a new shard, and optionally to `load` when reopening one.

Every parameter except `vectors` and `sparse_vectors` is optional. A parameter left unset is "not specified" rather than "set to the default": when loading an existing shard, each unspecified parameter resolves through *provided - persisted in `edge_config.json` - derived from the existing segments - default*, so it keeps whatever the shard already has. This is why a configuration that sets only `wal_options` leaves the rest of the shard's configuration untouched.

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

## Updating Data

Every write to an Edge Shard goes through a single method, `update`, which takes one `UpdateOperation` describing what to change. The operation is written to the write-ahead log before it is applied to storage, so an update that has returned survives a crash.

### update

```python
def update(self, operation: UpdateOperation) -> None
```

```rust
pub fn update(&self, operation: UpdateOperation) -> OperationResult<()>
```

| Parameter | Type | Description |
|---|---|---|
| `operation` | `UpdateOperation` | The operation to apply. |

**Returns** nothing in Python. In Rust, returns `Ok(())` on success.

Creating a named vector that already exists with different parameters fails rather than silently doing nothing, so the rejected operation never reaches the write-ahead log.

### Update Operations

In Python, `UpdateOperation` is a class with static constructors, one per operation. Each returns an `UpdateOperation` to pass to `update`.

| Operation | Parameters | Description |
|---|---|---|
| `upsert_points` | `points`, `condition`, `update_mode` | Insert or update points. |
| `delete_points` | `point_ids` | Delete points by ID. |
| `delete_points_by_filter` | `filter` | Delete every point matching a filter. |
| `update_vectors` | `point_vectors`, `condition` | Replace vectors on existing points. |
| `delete_vectors` | `point_ids`, `vector_names` | Delete named vectors from points. |
| `delete_vectors_by_filter` | `filter`, `vector_names` | Delete named vectors from matching points. |
| `set_payload` | `point_ids`, `payload`, `key` | Merge payload fields into points. |
| `set_payload_by_filter` | `filter`, `payload`, `key` | Merge payload fields into matching points. |
| `overwrite_payload` | `point_ids`, `payload`, `key` | Replace the entire payload on points. |
| `overwrite_payload_by_filter` | `filter`, `payload`, `key` | Replace the entire payload on matching points. |
| `delete_payload` | `point_ids`, `keys` | Delete named payload fields from points. |
| `delete_payload_by_filter` | `filter`, `keys` | Delete named payload fields from matching points. |
| `clear_payload` | `point_ids` | Delete all payload from points. |
| `clear_payload_by_filter` | `filter` | Delete all payload from matching points. |
| `create_field_index` | `field_name`, `schema` | Index a payload field. |
| `delete_field_index` | `field_name` | Remove a payload field index. |
| `create_dense_vector` | `vector_name`, `size`, `distance`, `multivector_config`, `datatype` | Add a dense named vector to the schema. |
| `create_sparse_vector` | `vector_name`, `modifier`, `datatype` | Add a sparse named vector to the schema. |
| `delete_vector_name` | `vector_name` | Remove a named vector from the schema. |

The `key` parameter on the payload operations targets a nested field path rather than the payload root. The `condition` parameter on `upsert_points` and `update_vectors` applies the write only to points matching a filter.

`upsert_points` also takes an `update_mode`:

| Mode | Behavior |
|---|---|
| `UpdateMode.Upsert` | Insert new points and update existing ones. The default. |
| `UpdateMode.InsertOnly` | Insert new points, leave existing ones untouched. |
| `UpdateMode.UpdateOnly` | Update existing points, do not insert new ones. |

In Rust, `UpdateOperation` is an enum grouping the same operations by what they act on:

| Variant | Covers |
|---|---|
| `PointOperation` | Upserting, deleting, and syncing points. |
| `VectorOperation` | Updating and deleting named vectors on existing points. |
| `PayloadOperation` | Setting, overwriting, deleting, and clearing payload. |
| `FieldIndexOperation` | Creating and deleting payload field indexes. |
| `VectorNameOperation` | Adding and removing named vectors from the schema. |

<aside role="status">Adding a named vector does not populate it on existing points. Re-upsert those points to give them a value for the new vector. Refer to <a href="/documentation/edge/edge-quickstart/#modify-the-vector-schema">Modify the Vector Schema</a>.</aside>

## Querying Data

Qdrant Edge offers two entry points for similarity search. `query` is the general one, supporting prefetches, fusion, and reranking. `search` is a narrower path for a single scoring query. `scroll` pages through points without scoring them.

<aside role="status">In Rust, the read methods are provided by the <code>EdgeShardRead</code> trait rather than declared on <code>EdgeShard</code> directly. Bring it into scope with <code>use qdrant_edge::EdgeShardRead;</code> before calling them.</aside>

### query

Runs a query, optionally combining the results of nested prefetch queries.

```python
def query(self, query: QueryRequest) -> List[ScoredPoint]
```

```rust
fn query(&self, request: QueryRequest) -> OperationResult<Vec<ScoredPoint>>
```

**Returns** a list of `ScoredPoint`, ordered by score.

`QueryRequest` accepts the following parameters:

| Parameter | Type | Description |
|---|---|---|
| `limit` | `int` | Maximum number of points to return. Required. |
| `offset` | `int` | Number of results to skip. |
| `query` | scoring query | What to score by. Omit to return points without scoring, honoring the filter alone. |
| `prefetches` | list of `Prefetch` | Nested queries whose results this query reranks or fuses. |
| `filter` | `Filter` | Payload and ID conditions the points must satisfy. Refer to [Filtering](/documentation/search/filtering/). |
| `score_threshold` | `float` | Drop results scoring worse than this value. |
| `params` | `SearchParams` | Search-time tuning, such as `hnsw_ef` and `exact`. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |

The `query` parameter accepts several kinds of scoring:

| Kind | Purpose |
|---|---|
| `Query` | Vector similarity: nearest neighbor, recommendation, discovery, context, or feedback. |
| `Fusion` | Combine the results of multiple prefetches. Refer to [Hybrid Queries](/documentation/search/hybrid-queries/). |
| `OrderBy` | Order by a payload field instead of by similarity. |
| `Formula` | Rescore prefetch results with an expression over payload and score. |
| `Mmr` | Maximal marginal relevance, trading similarity against diversity. |
| `Sample` | Return a sample of points. |

`Prefetch` takes `query`, `limit`, `filter`, `score_threshold`, `params`, and its own nested `prefetches`, so prefetches can be nested to build multi-stage retrieval.

### search

Runs a single scoring query. `search` has no prefetches and no fusion; use `query` when you need either.

```python
def search(self, search: SearchRequest) -> List[ScoredPoint]
```

```rust
fn search(&self, request: SearchRequest) -> OperationResult<Vec<ScoredPoint>>
```

**Returns** a list of `ScoredPoint`, ordered by score.

`SearchRequest` accepts `query` and `limit`, which are required, plus `offset`, `filter`, `params`, `with_payload`, `with_vector`, and `score_threshold`, all of which behave as they do on `QueryRequest`.

### scroll

Pages through points in the shard without scoring them.

```python
def scroll(self, scroll: ScrollRequest) -> Tuple[List[Record], Optional[PointId]]
```

```rust
fn scroll(&self, request: ScrollRequest) -> OperationResult<(Vec<Record>, Option<PointId>)>
```

**Returns** the matching records and the offset to pass to the next call, or `None` when the last page has been reached.

| Parameter | Type | Description |
|---|---|---|
| `offset` | `PointId` | Start from this point ID. Pass the offset returned by the previous call. |
| `limit` | `int` | Maximum number of points to return. |
| `filter` | `Filter` | Payload and ID conditions the points must satisfy. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |
| `order_by` | `OrderBy` | Page in the order of a payload field instead of by point ID. |

### query_groups

Groups query results by a payload field, returning a bounded number of hits per distinct value. Rust only.

```rust
fn query_groups(&self, request: GroupRequest) -> OperationResult<Vec<Group>>
```

**Returns** a list of `Group`, each carrying the group's `key` and its `hits`.

| Parameter | Type | Description |
|---|---|---|
| `query` | `QueryRequest` | The query to run within each group. |
| `group_by` | `JsonPath` | Payload field to group by. |
| `groups` | `usize` | Maximum number of groups to return. |
| `group_size` | `usize` | Maximum number of hits per group. |

### search_matrix

Samples points and finds each sample's nearest neighbors, producing a similarity matrix useful for clustering and visualization. Rust only.

```rust
fn search_matrix(&self, request: SearchMatrixRequest) -> OperationResult<SearchMatrixResponse>
```

**Returns** a `SearchMatrixResponse` with `sample_ids` and, for each sample, its `nearests`.

| Parameter | Type | Description |
|---|---|---|
| `sample_size` | `usize` | Number of points to sample. |
| `limit_per_sample` | `usize` | Number of nearest neighbors to find per sampled point. |
| `filter` | `Filter` | Restrict sampling to matching points. |
| `using` | `VectorNameBuf` | Named vector to compare on. |

### Request Builders

In Rust, each request type has a fluent builder, so you only set the parameters you need:

```rust
let request = QueryRequest::builder()
    .limit(10)
    .with_payload(true)
    .build();
```

Builders are available for `QueryRequest`, `SearchRequest`, `ScrollRequest`, `RetrieveRequest`, `CountRequest`, `FacetRequest`, `GroupRequest`, `SearchMatrixRequest`, and `Prefetch`. The Python bindings construct requests through their class constructors instead, where every optional parameter defaults to `None`.

## Reading Data

### retrieve

Fetches points by ID, without scoring.

```python
def retrieve(
    self,
    point_ids: List[PointId],
    with_payload: Optional[WithPayloadType] = None,
    with_vector: Optional[WithVectorType] = None,
) -> List[Record]
```

```rust
fn retrieve(&self, request: RetrieveRequest) -> OperationResult<Vec<Record>>
```

**Returns** a list of `Record`. Points that do not exist are omitted rather than reported as errors.

| Parameter | Type | Description |
|---|---|---|
| `point_ids` | list of `PointId` | IDs to fetch. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |

Python takes these as three arguments, while Rust collects them into a `RetrieveRequest`.

### count

Counts the points matching a filter.

```python
def count(self, count: CountRequest) -> int
```

```rust
fn count(&self, request: CountRequest) -> OperationResult<usize>
```

**Returns** the number of matching points.

| Parameter | Type | Description |
|---|---|---|
| `filter` | `Filter` | Conditions the counted points must satisfy. Omit to count every point. |
| `exact` | `bool` | Count exactly rather than estimating. Defaults to `True` in Python. |

### facet

Returns the most common values of a payload field, with a count for each.

```python
def facet(self, facet: FacetRequest) -> FacetResponse
```

```rust
fn facet(&self, request: FacetRequest) -> OperationResult<FacetResponse>
```

**Returns** a `FacetResponse` whose `hits` each carry a `value` and its `count`.

| Parameter | Type | Description |
|---|---|---|
| `key` | `JsonPath` | Payload field to facet on. Required. |
| `limit` | `int` | Maximum number of distinct values to return. Default: `10`. |
| `exact` | `bool` | Compute exact counts rather than estimating. Default: `False`. |
| `filter` | `Filter` | Restrict faceting to matching points. |

<aside role="status">Faceting and filtering both benefit from a payload index on the field. Refer to <a href="/documentation/edge/edge-quickstart/#create-a-payload-index">Create a Payload Index</a>.</aside>

### info

Returns metadata about the shard's contents.

```python
def info(self) -> ShardInfo
```

```rust
fn info(&self) -> OperationResult<ShardInfo>
```

`ShardInfo` carries the following fields:

| Field | Type | Description |
|---|---|---|
| `segments_count` | `int` | Number of segments in the shard. |
| `points_count` | `int` | Number of points stored. |
| `indexed_vectors_count` | `int` | Number of vectors that have been added to a vector index. |
| `payload_schema` | map of field name to `PayloadIndexInfo` | The shard's payload indexes. |

A `indexed_vectors_count` well below `points_count` means segments are still waiting to be optimized. Refer to [Optimization](#optimization).

## Snapshots

Snapshots move data between an Edge Shard and a Qdrant server collection. This section covers the methods; for how to combine them, refer to [Data Synchronization Patterns](/documentation/edge/edge-data-synchronization-patterns/).

### unpack_snapshot

Unpacks a snapshot archive on disk so it can be loaded as a shard. A static method in Python and an associated function in Rust, so it needs no shard instance.

```python
@staticmethod
def unpack_snapshot(snapshot_path: str, target_path: str) -> None
```

```rust
pub fn unpack_snapshot(snapshot_path: &Path, target_path: &Path) -> OperationResult<()>
```

| Parameter | Type | Description |
|---|---|---|
| `snapshot_path` | `str` (Python) / `&Path` (Rust) | Path to the downloaded snapshot file. |
| `target_path` | `str` (Python) / `&Path` (Rust) | Directory to unpack into. |

After unpacking, open the directory with `load`. The resulting shard keeps the configuration and file layout of the collection the snapshot came from, including its vector and payload indexes.

### snapshot_manifest

Returns the shard's snapshot manifest, which describes its segments and their metadata. Pass it to a server when requesting a partial snapshot so the server sends only the segments that have changed.

```python
def snapshot_manifest(self) -> Any
```

```rust
pub fn snapshot_manifest(&self) -> OperationResult<SnapshotManifest>
```

**Returns** a JSON-like value in Python, and a `SnapshotManifest` in Rust.

### Apply a Snapshot

Applies a snapshot to a shard that already holds data. The two languages differ in shape here.

```python
def update_from_snapshot(
    self,
    snapshot_path: str,
    tmp_dir: Optional[str] = None,
) -> None
```

```rust
pub fn recover_partial_snapshot(
    shard_path: &Path,
    current_manifest: &SnapshotManifest,
    snapshot_path: &Path,
    snapshot_manifest: &SnapshotManifest,
) -> OperationResult<EdgeShard>
```

Python applies the snapshot to the open shard in place, optionally extracting through `tmp_dir`. Rust takes the shard's path and both manifests, and returns a new `EdgeShard` for the merged result, so the existing instance must be dropped first.

| Parameter | Type | Description |
|---|---|---|
| `snapshot_path` | `str` (Python) / `&Path` (Rust) | Path to the snapshot to apply. |
| `tmp_dir` | `str` | Directory to extract through. Python only. |
| `shard_path` | `&Path` | Path to the shard being updated. Rust only. |
| `current_manifest` | `&SnapshotManifest` | Manifest of the shard as it stands. Rust only. |
| `snapshot_manifest` | `&SnapshotManifest` | Manifest of the incoming snapshot. Rust only. |

<aside role="status">Applying a snapshot rewrites files in the shard directory. Pause or buffer writes for the duration, and make sure any queued updates have already reached the server, so local changes are not lost. Refer to <a href="/documentation/edge/edge-synchronization-guide/">Synchronize with a Server</a>.</aside>

## Optimization

### optimize

Removes data marked for deletion, merges segments, and builds indexes. Qdrant Edge has no background optimizer, so optimization happens only when you call this method. It runs synchronously and blocks until no further optimization is planned.

```python
def optimize(self) -> bool
```

```rust
pub fn optimize(&self) -> OperationResult<bool>
```

**Returns** `True` if any segment was optimized, and `False` if the shard was already optimal.

Call `optimize` at a point when blocking is acceptable, such as after a batch of upserts or during an idle period. What it does is governed by [`EdgeOptimizersConfig`](#optimizer-parameters). Until it runs, newly written vectors are searchable but not yet indexed, which shows up as an `indexed_vectors_count` below `points_count` in [`info`](#info).

<!--

TO DO

Open questions:

- [ ] Decide whether to keep inline signature blocks or move to runnable
      code-snippet blocks under headless/snippets/edge/api/.

-->
