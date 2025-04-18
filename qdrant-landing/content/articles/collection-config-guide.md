---
title: "Qdrant Collection Configuration Guide"  
short_description: "A comprehensive guide to configuring Qdrant collections with all available options and best practices."  
description: "Explore all the configuration options available when creating Qdrant collections, including vector types, HNSW indexing, quantization, optimization settings, and more. Learn how to configure your collections for different use cases and optimize performance."  
preview_dir: /articles_data/collection-config-guide/preview
social_preview_image: /articles_data/collection-config-guide/social-preview.png  
weight: -156
author: Sabrina Aquino  
date: 2025-04-16T00:00:00.000Z  
category: vector-search-manuals
---

# The Anatomy of a Qdrant Collection

In Qdrant, a **collection** defines both the structure of your data and how that data is indexed, stored, and searched. Every configuration choice matters. Vector structure, memory layout, indexing parameters, optimizer thresholds. Each one carries operational weight. These settings shape your system’s behavior across performance, accuracy, memory efficiency, fault tolerance, and scalability.

At small scale, defaults are fine. But as you scale with hybrid retrieval, multimodal inputs, millions of points, and latency-sensitive applications, *you need more control.* 

If you’ve inspected a collection in production, you’ve probably seen something like this:

```json
{
  "status": "green",
  "optimizer_status": "ok",
  "vectors_count": null,
  "indexed_vectors_count": 13954,
  "points_count": 18198,
  "segments_count": 21,
  "config": {
    "params": {
      "vectors": {
        "content": {
          "size": 1024,
          "distance": "Cosine",
          "hnsw_config": {
            "m": 0,
            "ef_construct": 128,
            "max_indexing_threads": 16,
            "on_disk": false,
            "payload_m": 16
          },
          "quantization_config": {
            "scalar": {
              "type": "int8",
              "quantile": 0.99,
              "always_ram": true
            }
          },
          "on_disk": true
        }
      },
      "shard_number": 1,
      "sharding_method": "custom",
      "replication_factor": 1,
      "write_consistency_factor": 1,
      "on_disk_payload": true
    },
    "hnsw_config": {
      "m": 0,
      "ef_construct": 128,
      "full_scan_threshold": 10000,
      "max_indexing_threads": 16,
      "on_disk": false,
      "payload_m": 16
    },
    "optimizer_config": {
      "deleted_threshold": 0.2,
      "vacuum_min_vector_number": 100000,
      "default_segment_number": 1,
      "max_segment_size": null,
      "memmap_threshold": 0,
      "indexing_threshold": 5000,
      "flush_interval_sec": 5,
      "max_optimization_threads": null
    },
    "wal_config": {
      "wal_capacity_mb": 32,
      "wal_segments_ahead": 0
    },
    "quantization_config": null,
    "strict_mode_config": {
      "enabled": false
    }
  }
}
```

Every field here has implications on performance, memory, latency, fault tolerance, indexing behavior, and more. 

In this article, we’ll walk through each part of this configurations. What the settings mean. What happens if you leave them at default. What tradeoffs you’re implicitly making. And how to adjust them for your needs.

## Vector Configurations

Vector configuration is the foundation of any Qdrant collection. It defines the structure of your vector data, how similarity is calculated, and the fundamental properties of your search space. The configuration decisions you make here will cascade through your entire search pipeline.

Qdrant supports multiple types of vector representations within the same collection, each with its own mathematical properties and performance characteristics:

| Type | Description | Best For |
|------|-------------|----------|
| **Dense** | Fixed-length float vectors | General embeddings from encoders like BERT, OpenAI, etc. |
| **Sparse** | Efficiently stored vectors with many zeros | TF-IDF, SPLADE, or keyword-based retrieval |
| **Multivector** | Multiple same-sized vectors per point | Token-level processing, late interaction models |


## Configuring Vector Fields

### 1. Dense Vectors

Dense vectors are fixed-length arrays of floating-point numbers that encode the semantic meaning of data in a high-dimensional space. The dimensionality and distance metrics you choose have profound effects on both accuracy and performance.

These parameters control how dense vectors operate:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `size` | Yes | Dimensionality of the vector (must match embedding model output) |
| `distance` | Yes | Similarity metric: `COSINE`, `DOT`, or `EUCLID` |
| `on_disk` | No | When `true`, stores vectors on disk instead of RAM |
| `hnsw_config` | No | Field-specific HNSW graph configuration |
| `quantization_config` | No | Controls memory/performance trade-offs |
| `datatype` | No | Storage type: `float32` (default), `float16`, or `uint8` |

You can specify a vector `datatype` (e.g. `uint8`) for compact storage as an **alternative to quantization** for saving memory.

Here's how to create a simple collection with dense vectors:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    )
)
```

### 2. Multivectors

Multivectors extend dense vectors to store multiple same-sized vectors within a single point. This enables sophisticated retrieval patterns like token-level matching or multi-part similarity scoring that would otherwise be impossible with standard vectors.

Beyond the standard dense vector parameters, multivectors require:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `multivector_config` | Yes | Configuration for handling multiple vectors per point |
| `comparator` | Yes | How to compare vectors: `max_sim` (maximum similarity) |

Here's how to create a collection with multivector configuration:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=128,
        distance=models.Distance.COSINE,
        multivector_config=models.MultiVectorConfig(
            comparator=models.MultiVectorComparator.MAX_SIM
        )
    )
)
```

### 3. Sparse Vectors

Instead of dense embeddings with distributed meaning, sparse vectors directly encode discrete tokens as non-zero values at specific positions. They're ideal for **keyword-based** or **token-based** representations.

The sparse vector configuration focuses on efficient storage and retrieval of these mostly-zero vectors:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `index.on_disk` | No | When `true`, stores sparse index on disk |
| `index.full_scan_threshold` | No | For small segments (less than 10,000 vectors), uses brute-force scoring |
| `index.datatype` | No | Storage type: `float32` (default), `float16`, or `uint8` |
| `modifier` | No | Applies preprocessing like `idf` weighting |

Here's how to create a collection for sparse vectors:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    sparse_vectors_config={
        "text_sparse": models.SparseVectorParams(
            index=models.SparseIndexParams(
                on_disk=False,
                full_scan_threshold=1000,
                datatype="float16"
            ),
            modifier="idf"
        )
    }
)
```

Sparse vectors **must be explicitly named** and cannot share a name with a dense vector field.

### 4. Named Vectors

Qdrant allows you to define multiple [named vector](https://qdrant.tech/documentation/concepts/vectors/?q=named+vec#named-vectors) fields in a single collection. Each vector field operates independently with its own configuration (size, distance metric, indexing behavior, etc), and even representation type (dense, sparse, or multivector):

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense_text": models.VectorParams(size=1536, distance=models.Distance.COSINE),
        "token_embeddings": models.VectorParams(
            size=128, 
            distance=models.Distance.DOT,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            )
        )
    },
    sparse_vectors_config={
        "keywords": models.SparseVectorParams(modifier="idf")
    }
)
```

#### Best Practices

1. **Dimensionality**: Always match the `size` parameter to your embedding model's output dimensions
2. **Distance Metrics**: Choose the appropriate distance metric for your embedding model:
   - `COSINE`: For **most text embeddings** where magnitude isn't meaningful
   - `DOT`: For embeddings trained with dot-product similarity
   - `EUCLID`: For spatial data or when absolute distances matter
3. **Memory Management**: Use `on_disk=True` for large collections to conserve RAM
4. **Quantization**: Consider quantization for large production deployments to reduce memory footprint
5. **Sparse vs. Dense**: Use sparse vectors for keyword-based search and dense vectors for semantic search

Read More: [Vectors Documentation](https://qdrant.tech/documentation/concepts/vectors/)

## HNSW Configuration

Qdrant uses the HNSW (Hierarchical Navigable Small World) algorithm for fast approximate nearest neighbor search. The HNSW configuration directly impacts search speed, accuracy, and resource usage.

The HNSW indexing configuration can be applied at two levels:

- Globally for the entire collection
- Per vector field to override global settings

The key parameters that control HNSW behavior:

| Parameter | Default | Description | When to Adjust |
|-----------|---------|-------------|----------------|
| `m` | 16 | Connections per node | Higher (32-64) for better recall; Lower (8) to reduce memory |
| `ef_construct` | 100 | Search width during indexing | Higher (200-300) for better search quality; Lower for faster indexing |
| `full_scan_threshold` | 10000 | Skip indexing below this count | Higher for faster inserts; Lower to force indexing for small segments |
| `on_disk` | false | Store index on disk | `true` when index exceeds available RAM |
| `max_indexing_threads` | 0 | Parallelism during indexing | 2-4 for multi-core systems; 1 for shared environments |
| `payload_m` | Same as `m` | Connections optimized for payload filtering | Raise (32+) if you rely heavily on filtering; reduce if filters are minimal |

Here’s a visual breakdown of what these parameters affect inside the HNSW graph:

<img src="/articles_data/collection-config-guide/hnsw-parameters.png" width="600">

### Vector-Level HNSW Configuration

You can override HNSW settings for specific vector fields by including an `hnsw_config` inside the `VectorParams`:

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import (Distance, VectorParams, HnswConfig)

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "default": VectorParams(
            size=1536,
            distance=Distance.COSINE,
            hnsw_config=HnswConfig(
                m=16,
                ef_construct=200,
                full_scan_threshold=10_000
            )
        )
    }
)
```

These configurations apply only to the `default` vector field and override any global HNSW settings. Note that `on_disk` and `max_indexing_threads` are not available at the vector level.

### Global HNSW Configuration

Global HNSW settings are defined at the collection level and apply to all vector fields that don't have their own configuration:

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import (Distance, VectorParams, HnswConfig)

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "default": VectorParams(
            size=1536,
            distance=Distance.COSINE
        )
    },
    hnsw_config=HnswConfig(
        m=16,
        ef_construct=100,
        full_scan_threshold=10_000,
        max_indexing_threads=4,
        on_disk=True
    )
)
```

The global configuration provides additional parameters **not** available at the vector level:

| Parameter | Purpose |
|-----------|---------|
| `on_disk` | When `true`, stores the graph structure on disk instead of RAM |
| `max_indexing_threads` | Controls parallel processing during index construction |

All HNSW settings can be adjusted after collection creation.

Read More: [HNSW Documentation](https://qdrant.tech/documentation/concepts/indexing/#vector-index)

## Quantization Configuration

[Vector Quantization](https://qdrant.tech/articles/what-is-vector-quantization/) compresses vectors to reduce memory usage with minimal accuracy loss. As collections grow to millions of vectors, quantization becomes essential for resource-efficient deployments.

Like HNSW, quantization settings can be applied:

- Globally for the entire collection
- Per vector field to override global settings

### Vector-Level Quantization Configuration

Apply quantization to a specific vector field using `quantization_config` inside `VectorParams`.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "default": models.VectorParams(
            size=1536,
            distance=models.Distance.COSINE,
            quantization_config=models.ScalarQuantization(
                scalar=models.ScalarQuantizationConfig(
                    type="int8",
                    quantile=0.99,
                    always_ram=True
                )
            )
        )
    }
)
```

### Global Quantization Configuration

Set a default quantization strategy for the entire collection. This applies to all vector fields unless they override it.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "default": models.VectorParams(
            size=1536,
            distance=models.Distance.COSINE
        )
    },
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(
            always_ram=True
        )
    )
)
```

Qdrant supports three quantization methods, each with distinct performance characteristics:

| Method | Reduction | Accuracy Impact | Speed Gain | Best For |
|--------|-----------------|----------------|-----------------|----------|
| **Scalar** | 4× | Low (0.99) | Up to 4× faster | General purpose, balanced approach |
| **Binary** | 32× | Model-dependent (0.95) | Up to 40× faster | Maximum speed, compatible models |
| **Product** | Up to 64× | Moderate to high (0.7) | Up to 2× faster | Maximum compression tolerance |

#### Scalar Quantization

[Scalar quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-scalar-quantization) maps `float32` values to smaller integer types like `int8`, shrinking memory usage by 75% while maintaining high accuracy. Each vector dimension is scaled to fit the range of the smaller type.

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `type` | Bit depth for quantized values | `int8` for 4× reduction, `int16` for 2× reduction |
| `quantile` | Trims outliers in the distribution | `0.99` standard, excludes extreme 1% of values |
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

#### Binary Quantization

[Binary quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-binary-quantization) offers maximum compression and speed by reducing each dimension to a single bit (0 or 1). Values greater than zero become 1, and values less than or equal to zero become 0. For example, this reduces a 1536-dimensional vector from 6 KB to just 192 bytes (a 32× reduction):

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

Binary quantization is exceptionally fast because it enables the use of highly optimized CPU instructions (XOR and Popcount) for distance computations, offering up to 40× speed improvement. [Read more about Binary Quantization - Vector Search, 40x Faster](https://qdrant.tech/articles/binary-quantization/).

Important: Binary quantization is most effective with embeddings that have **at least 1024 dimensions**. Known compatible models include:
- OpenAI's `text-embedding-ada-002`, `text-embedding-3-small` and `text-embedding-3-large`.
- Cohere AI `embed-english-v3.0`.

#### Product Quantization

[Product quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-product-quantization) segments vectors into subvectors and compresses each subvector using codebooks. Instead of storing raw values, each subvector is represented by an index pointing to its nearest centroid.

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `compression` | Compression ratio | Powers of 2: `8`, `16`, `32`, `64` |
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

This method can compress a 1024-dimensional vector down to 128 bytes. The tradeoff is significant loss in accuracy, especially for high-precision tasks.

Read More: [Quantization Documentation](https://qdrant.tech/documentation/guides/quantization/)

## Optimizer Configuration

The optimizer in Qdrant is responsible for maintaining the internal health of your collection. As data is inserted, updated, and deleted over time, the underlying storage becomes fragmented. Segments accumulate deleted entries, grow unevenly, or fail to meet indexing thresholds. The optimizer runs in the background to merge segments, clean up deleted points, and keep indexing performant.

<img src="/articles_data/collection-config-guide/optimization.svg" width="800">

Unlike HNSW or quantization settings, optimizer parameters don’t affect the search algorithm itself. They affect the infrastructure of the search system: memory usage, latency during insertions, and long-term scalability.

These settings define how aggressively Qdrant manages its internal segments and memory:

| Parameter                   | Default | Description                                                  | When to Adjust                                                   |
|----------------------------|---------|--------------------------------------------------------------|------------------------------------------------------------------|
| `deleted_threshold`        | `0.2`   | Fraction of deleted points in a segment before cleanup       | Lower to clean up more frequently if you delete often            |
| `vacuum_min_vector_number` | `1000`  | Segments with fewer vectors than this are merged aggressively| Lower to reduce fragmentation in small datasets                  |
| `default_segment_number`   | `2`     | Initial number of segments for a new collection              | Increase to enable more parallel ingestion at startup            |
| `max_segment_size`         | `50000` | Upper limit on segment size before it stops growing          | Raise for fewer but larger segments on high-memory systems       |
| `memmap_threshold`         | `20000` | Segments above this size are memory-mapped                   | Lower on memory-constrained systems                              |
| `indexing_threshold`       | `20000` | Segments larger than this get HNSW indexes                   | Increase to delay indexing and speed up insert-heavy workloads   |
| `flush_interval_sec`       | `5`     | How often data is flushed to disk (in seconds)               | Lower for better durability, higher to reduce write pressure     |
| `max_optimization_threads` | `0`     | Threads for background segment optimization                  | Increase on multi-core systems to accelerate segment merging     |

Set these parameters during collection creation to control how Qdrant merges segments, handles deletes, and manages indexing in the background.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    optimizers_config=models.OptimizersConfigDiff(
        deleted_threshold=0.2,
        vacuum_min_vector_number=1000,
        default_segment_number=2,
        max_segment_size=50000,
        memmap_threshold=20000,
        indexing_threshold=25000,
        flush_interval_sec=10,
        max_optimization_threads=2
    )
)
```

#### Best Practices

- **For ingestion-heavy workloads**, set a higher `default_segment_number` (e.g. 4–8) to spread incoming data across multiple segments and reduce contention. Increasing `max_segment_size` will delay compactions, improving write throughput by minimizing early merges.
- **For high-delete workloads**, lower `deleted_threshold` to trigger cleanup sooner and reduce tombstone overhead. Also reduce `vacuum_min_vector_number` to ensure even small segments are eligible for optimization. This helps keep your index lean and responsive.
- **On memory-constrained systems**, decrease `memmap_threshold` so that large segments are stored as memory-mapped files instead of fully in RAM. This saves memory with only a slight increase in access latency.
- **To maximize indexing performance**, raise `indexing_threshold` to delays HNSW index creation, which allows faster bulk writes. Useful for high-throughput imports, but expect increased memory pressure and slower queries until indexing completes.

This configuration doesn't directly affect query latency but plays a critical role in maintaining throughput, stability, and predictable performance as your dataset evolves.

Read More: [Optimizer Documentation](https://qdrant.tech/documentation/concepts/optimizer/)

## WAL (Write-Ahead Log) Configuration

The Write-Ahead Log (WAL) is Qdrant’s durability backbone. It ensures that no data is lost in the event of a crash. Before any insert, update, or delete is applied to the in-memory state or persisted to disk, it is first written to the WAL.

If Qdrant is interrupted mid-operation, it can safely restore the latest state by replaying the WAL entries in order. This recovery mechanism is especially critical in write-heavy scenarios or when operating in environments without strong external persistence guarantees.

There are two key parameters that control WAL behavior:

| Parameter             | Default | Description                                           | When to Adjust                                             |
|----------------------|----------------|-------------------------------------------------------|------------------------------------------------------------|
| `wal_capacity_mb`    | `32`           | Size of a single WAL segment in megabytes            | Increase for high-write workloads to reduce I/O frequency  |
| `wal_segments_ahead` | `0`            | Number of WAL segments pre-allocated ahead of time   | Increase to optimize performance under sustained ingestion |

Configure how Qdrant buffers and persists operations by tuning WAL parameters during collection creation.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    wal_config=models.WalConfigDiff(
        wal_capacity_mb=32,
        wal_segments_ahead=0
    )
)
```

#### Best Practices

- **For ingestion-heavy pipelines**, raise `wal_capacity_mb` to reduce the rate at which WAL segments are flushed to disk.
- **To smooth out performance under continuous load**, allocate more segments ahead with `wal_segments_ahead`. This minimizes delays due to WAL segment rotation.
- **For low-latency or embedded use**, you can keep both values low to reduce memory pressure, as long as your ingestion rate is modest.

The WAL configuration doesn’t directly impact search performance, but it plays a foundational role in system stability, especially when paired with frequent writes and delayed flushing.

## Sharding and Replication

[Sharding](https://qdrant.tech/documentation/guides/distributed_deployment/?q=sharding#sharding) and [replication](https://qdrant.tech/documentation/guides/distributed_deployment/?q=sharding#replication) allow Qdrant to scale collections across multiple nodes while maintaining availability and fault tolerance. These features are **essential** for production environments that require horizontal scalability, high availability, or write resilience.

![](/articles_data/collection-config-guide/shards.png)

- **Sharding** splits your data into separate partitions called **shards**. Each shard holds a subset of the collection and is stored and indexed independently. This allows Qdrant to distribute data and load across multiple nodes, enabling parallel search, faster ingestion, and better use of system resources. Shard count is what determines *how* your data is divided and processed.
- **Replication** makes copies of existing shards and places them on different nodes. It protects against data loss or downtime if a node fails. Replication does not split your data or increase query parallelism, it only creates redundant copies of the current shards. 

To scale performance, you need to increase the number of shards. To improve fault tolerance, you increase the replication factor.

These parameters control how Qdrant distributes and protects your data:

| Parameter                   | Default  | Description                                                               | When to Adjust                                                    |
|----------------------------|----------|---------------------------------------------------------------------------|-------------------------------------------------------------------|
| `shard_number`             | `1`      | Number of shards to divide the collection into                            | Increase to parallelize across more nodes or cores                |
| `replication_factor`       | `1`      | Number of replicas per shard                                              | Use `2` or `3` for fault-tolerant production clusters             |
| `write_consistency_factor` | `1`      | Number of replicas that must confirm a write                              | Raise to ensure stronger consistency during writes                |
| `sharding_method`          | `"auto"` | Distribution strategy: `auto` spreads evenly, `custom` uses a shard key   | Use `custom` when sharding based on user ID or domain logic       |


How to create a collection with sharding and replication: 

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    shard_number=3,
    replication_factor=2,
    write_consistency_factor=1,
    sharding_method=models.ShardingMethod.AUTO
)
```

#### Best Practices
- **For large-scale deployments**, use higher `shard_number` to spread the load across nodes and cores. Keep in mind that more shards can increase overhead if your dataset is small.
- **For high availability (HA) setups**, set `replication_factor=2` or more to tolerate node outages without downtime.
- **For consistency-sensitive applications**, increase `write_consistency_factor` to ensure more replicas acknowledge a write before it is confirmed.
- **Use `custom` sharding** if you want to colocate related data (e.g. all vectors from the same user or tenant) on the same shard for latency or isolation reasons.

Note: Dynamic resharding is only supported on Qdrant Cloud (including Hybrid and Private Cloud). If you're using self-hosted Qdrant, you must define `shard_number` and `replication_factor` at the time of collection creation and they cannot be changed later.

Read More: [Sharding and Replication Documentation](https://qdrant.tech/documentation/guides/distributed_deployment/)

## Storage Configuration

In Qdrant, each collection is composed of **segments**, which are the core units of storage and indexing. Every segment maintains its own vector data, payloads, and associated indexes. Segments operate independently, which enables Qdrant to scale efficiently, optimize incrementally, and recover reliably.

There are two key types of data stored in a segment:

- Vectors, which we covered earlier in the [Vector Configuration](#vector-configurations) section.
- Payloads, which can be kept in memory or offloaded to disk depending on your needs.

### Payload Storage

While small payloads can remain in RAM, large documents or rich metadata fields can quickly consume memory at scale.

To manage this, Qdrant allows you to offload payloads to disk. The primary parameter here is:

| Parameter | Default | When to use it |
|-----------|---------------|----------------|
| `on_disk_payload` | false | When `true`, stores payloads on disk instead of RAM. Saves memory but adds slight latency on access. |

If you do not explicitly set `on_disk_payload=True` during collection creation, Qdrant will store all payloads in memory by default. **This setting is fixed at collection creation and cannot be changed later.**

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    on_disk_payload=True
)
```

Read More: [Storage Documentation](https://qdrant.tech/documentation/concepts/storage/)

## Strict Mode Configuration

Strict mode is a safeguard against operations that could overload your system or degrade performance. It enforces hard limits on queries, timeouts, search parameters, and access rates. This is especially useful in shared environments, multi-tenant clusters, or production systems exposed to external traffic.

When enabled, strict mode helps maintain system stability by rejecting operations that exceed pre-defined constraints. It’s a proactive way to protect Qdrant from unbounded requests, misconfigured clients, or unindexed queries that would otherwise bypass indexing optimizations.

These parameters control strict mode behavior:

| Parameter                      | Default | Description                                                  | When to Adjust                                                  |
|-------------------------------|---------|--------------------------------------------------------------|-----------------------------------------------------------------|
| `enabled`                     | `false` | Activates strict mode enforcement                            | Enable in production or shared environments                    |
| `max_query_limit`             | `None`  | Upper limit on number of points returned per query           | Set to avoid accidental full scans                             |
| `max_timeout`                 | `None`  | Maximum allowed timeout in seconds for any request           | Lower to restrict long-running operations                      |
| `unindexed_filtering_retrieve` | `true` | Allow filtering on unindexed payload fields                  | Set to `false` to avoid slow scans                             |
| `search_max_hnsw_ef`          | `None`  | Cap on the `ef` parameter during search                      | Limit to prevent high memory usage during searches             |
| `search_allow_exact`          | `true`  | Permit exact search when no HNSW index is present            | Set to `false` to block brute-force fallback                   |
| `read_rate_limit`             | `None`  | Max reads per minute per replica                             | Use to throttle high-QPS environments                          |
| `write_rate_limit`            | `None`  | Max writes per minute per replica                            | Use to prevent ingestion spikes                                |

How to enable and configure strict mode:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    strict_mode_config=models.StrictModeConfigDiff(
        enabled=True,
        max_query_limit=10000,
        max_timeout=30,
        unindexed_filtering_retrieve=False,
        search_max_hnsw_ef=1000,
        search_allow_exact=True,
        read_rate_limit=1000,
        write_rate_limit=500
    )
)
```

#### Best Practices
- **Always enable strict mode** in production-facing deployments to avoid runaway operations.
- **Use** `unindexed_filtering_retrieve=False` to ensure filters only run against indexed fields. This protects against slow scans.
- **Cap** `search_max_hnsw_ef` to prevent large in-memory search operations from overwhelming nodes.
- **Rate limits** (`read_rate_limit`, `write_rate_limit`) help protect replicas from overload, especially under unpredictable load.

Strict mode doesn’t affect how Qdrant stores or indexes data, it governs what kinds of operations are allowed at runtime, based on defined safety limits.

## Collection Runtime Status

After creation and use, every Qdrant collection exposes a set of runtime fields that describe its current health, indexing progress, and internal layout. These are read-only, live indicators useful for debugging ingestion, monitoring optimization, and planning for scale.

Each field helps answer a specific operational question:

| Field                    | Description                                                                 | What to Watch For                                                                 |
|-------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `status`                | Indexing readiness of the collection                                        | `"yellow"` means indexing is ongoing. `"green"` means all points are searchable. |
| `optimizer_status`      | Whether background optimization is active (merges, cleanup)                 | Long `"optimizing"` under low load may signal config issues.                     |
| `points_count`          | Total active points (includes both indexed and unindexed)                   | Should track inserts. Sudden drops may indicate deletions.                       |
| `vectors_count`         | Count of stored vectors, per field                                          | May be `null` early on. Useful for checking named vector ingestion.              |
| `indexed_vectors_count` | Vectors that are fully indexed and searchable                               | If this lags far behind `points_count`, indexing is catching up.                 |
| `segments_count`        | Number of data segments in the collection                                   | High segment count can hurt performance. Optimizer will gradually reduce it.     |

If indexed_vectors_count < points_count, some vectors haven’t been picked up by the optimizer yet. This can happen right after ingestion or if the indexing_threshold hasn’t been reached.

## Final Thoughts

By now, you’ve seen how each part of Qdrant’s collection configuration contributes to the overall performance, scalability, and reliability of your vector search system. From choosing the right vector types to configuring indexing, quantization, sharding, and safety limits, every setting plays a role in shaping how your system behaves at scale.

**Don’t try to memorize this guide**, it intended to be a reference. Whether you’re optimizing for recall, ingestion speed, memory efficiency, or distributed resilience, Qdrant’s collection API gives you the knobs to make those tradeoffs explicit and observable.

Qdrant is built to be fast, reliable, and flexible, but it performs best when your configuration matches the realities of your use case.