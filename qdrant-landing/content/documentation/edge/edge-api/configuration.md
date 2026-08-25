---
title: "Configuration"
short_description: "Configure a Qdrant Edge Shard with EdgeConfig: vector params, quantization, optimizers, WAL, and search threads."
description: "Reference for Qdrant Edge configuration: EdgeConfig, dense and sparse vector parameters, optimizer settings and the optimize method, WAL options, and changing configuration on a live shard."
weight: 20
---

# Configuration

`EdgeConfig` describes the vectors an Edge Shard stores and the parameters that govern how it indexes, stores, and searches them. Pass it to `create`/`new` when starting a new shard, and optionally to `load` when reopening one.

Every parameter except `vectors` and `sparse_vectors` is optional. A parameter left unset is "not specified" rather than "set to the default": when loading an existing shard, each unspecified parameter resolves through *provided - persisted in `edge_config.json` - derived from the existing segments - default*, so it keeps whatever the shard already has. This is why a configuration that sets only `wal_options` leaves the rest of the shard's configuration untouched.

## EdgeConfig

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

| Parameter | Description |
|---|---|
| `vectors` | Dense vector configuration. In Python, a single `EdgeVectorParams` configures the default unnamed vector. Optional if `sparse_vectors` is given. |
| `sparse_vectors` | Sparse vector configuration. |
| `on_disk_payload` | Store payload on disk with mmap rather than in RAM. Defaults to on-disk. |
| `hnsw_config` | Global HNSW parameters, used when building the HNSW index. Override per vector with `EdgeVectorParams.hnsw_config`. |
| `quantization_config` | Global quantization. Override per vector with `EdgeVectorParams.quantization_config`. Refer to [Quantization](/documentation/manage-data/quantization/). |
| `optimizers` | Optimizer parameters. Refer to [Optimizer Parameters](#optimizer-parameters). |
| `max_search_threads` | Size of the shard's search thread pool, which runs per-segment reads in parallel. Defaults to a count derived from the number of CPUs. |
| `search_pool_core` | Pin every search pool thread to this CPU core, bounding the shard's search compute to one core while keeping the pool's I/O overlap. Best-effort. Defaults to OS scheduling. |
| `wal_options` | A `WalOptions` value carrying the write-ahead log parameters. Rust only. Refer to [WAL Options](#wal-options). |

A new shard must define at least one of `vectors` or `sparse_vectors`, as these describe the data stored in the shard. Both are validated against the existing segments on `load`.

The Python and Rust bindings handle this differently. In Python, `EdgeConfig` validates the configuration at construction time and raises a `ValueError` if both `vectors` and `sparse_vectors` are empty, even if the configuration is only meant to be passed to load. As a result, changing a tunable parameter on an existing shard also requires redeclaring its vectors. In Rust, `EdgeConfigBuilder` does not apply this validation. It can build a configuration that only sets tunable parameters, and `load` reads the vector configuration from the shard itself.

## Dense Vector Parameters

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

| Parameter | Description |
|---|---|
| `size` | Vector dimension. Required. |
| `distance` | Distance metric. Required. |
| `on_disk` | Store vectors on disk with mmap rather than in RAM. |
| `multivector_config` | Multi-vector configuration, for late-interaction models. |
| `datatype` | Storage datatype for the vector. |
| `quantization_config` | Per-vector quantization, overriding the global setting. |
| `hnsw_config` | Per-vector HNSW parameters, overriding the global setting. |

## Sparse Vector Parameters

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

| Parameter | Description |
|---|---|
| `full_scan_threshold` | Threshold below which a full scan is used instead of the sparse index. |
| `on_disk` | Store the sparse index on disk rather than in RAM. |
| `modifier` | Score modifier. Set to `Modifier.Idf` for BM25 scoring. Refer to [BM25 with Qdrant Edge](/documentation/edge/edge-bm25/). |
| `datatype` | Storage datatype for the vector. |

## Optimizer Parameters

`EdgeOptimizersConfig` controls what the [`optimize`](#optimize) method does when you call it. It is a subset of the server-side collection optimizer config: it omits `flush_interval_sec`, because an Edge Shard does not flush on a timer, and `max_optimization_threads`, because optimization is invoked manually.

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

In Rust, `EdgeOptimizersConfig` has no builder. Construct it as a struct literal, leaving the rest at their defaults:

```rust
pub struct EdgeOptimizersConfig {
    pub deleted_threshold: Option<f64>,
    pub vacuum_min_vector_number: Option<usize>,
    pub default_segment_number: Option<usize>,
    pub max_segment_size: Option<usize>,
    pub indexing_threshold: Option<usize>,
    pub prevent_unoptimized: Option<bool>,
}
```

```rust
let optimizers = EdgeOptimizersConfig {
    indexing_threshold: Some(20_000),
    ..Default::default()
};
```

| Parameter | Description |
|---|---|
| `deleted_threshold` | Minimum fraction of deleted vectors in a segment required to run vacuum. Default: `0.2`. |
| `vacuum_min_vector_number` | Minimum number of vectors in a segment required to run vacuum. Default: `1000`. |
| `default_segment_number` | Target number of segments. `0` chooses automatically from the CPU count. |
| `max_segment_size` | Maximum segment size in KB. Derived from the CPU count when unset. |
| `indexing_threshold` | Size in KB above which a segment gets an HNSW index. |
| `prevent_unoptimized` | Store points written to unoptimized segments larger than the indexing threshold as deferred points: they are persisted but excluded from reads and searches until the segments are optimized. |

## optimize

Applies the optimizer parameters above: removes data marked for deletion, merges segments, and builds indexes. Qdrant Edge has no background optimizer, so optimization happens only when you call this method. It runs synchronously and blocks until no further optimization is planned.

```python
def optimize(self) -> bool
```

```rust
pub fn optimize(&self) -> OperationResult<bool>
```

**Returns** `True` if any segment was optimized, and `False` if the shard was already optimal.

Call `optimize` at a point when blocking is acceptable, such as after a batch of upserts or during an idle period. Until it runs, newly written vectors are searchable but not yet indexed, which shows up as an `indexed_vectors_count` below `points_count` in [`info`](/documentation/edge/edge-api/shard-lifecycle/#info).

## WAL Options

*Rust only*

Qdrant Edge records every update in a write-ahead log before applying it to storage. `WalOptions` is available in Rust only, and is set through `EdgeConfig.wal_options`.

```rust
pub struct WalOptions {
    pub segment_capacity: usize,
    pub segment_queue_len: usize,
    pub retain_closed: NonZeroUsize,
}
```

| Parameter | Description |
|---|---|
| `segment_capacity` | WAL segment capacity in bytes. Default: 32 MiB. |
| `segment_queue_len` | Number of segments to pre-create so appends never wait on segment creation. Default: `0`. |
| `retain_closed` | Number of closed WAL files to retain. Default: `1`. |

The WAL file is pre-allocated to `segment_capacity`, which inflates backup sizes and OS storage reports. Reduce it for embedded and mobile deployments where 32 MiB is too large. Refer to [Custom WAL Size](/documentation/edge/edge-quickstart/#custom-wal-size).

## Change Configuration on a Live Shard

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
