---
title: Collection Parameters
weight: 150
aliases:
  - guides/collection-parameters
---

# The Anatomy of a Qdrant Collection

In Qdrant, a [collection](https://qdrant.tech/documentation/concepts/collections/) defines both the structure of your data and how that data is **indexed** and **retrieved**. Every configuration decision has system-wide impact. Settings like HNSW graph parameters, quantization, on-disk storage, and optimizer thresholds directly affect retrieval **accuracy**, **latency**, **memory usage**, and **scalability** under load.

If you expect to deal with hybrid retrieval, multimodal inputs, large datasets, or latency-sensitive workloads, it’s worth configuring things carefully from the start. Some parameters can’t be changed later, so getting them right early helps avoid surprises down the line.

If you've examined a collection in production, you might have seen something like this:

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

Let’s break down how each setting influences your vector search, what configuration options are available, and what trade-offs you’re making when you choose to tune them or leave them at their defaults.

## Vector Parameters

Your vector configurations define the structure of your data, the method of similarity calculation, and the fundamental properties of your search space. The configuration decisions you make here will cascade through your entire search pipeline.

Qdrant supports **3 types** of vector representations:

| Type | Description | Best For |
|------|-------------|----------|
| **Dense** | Fixed-length float vectors | General embeddings from encoders like BERT, OpenAI, etc. |
| **Sparse** | Efficiently stored vectors with many zeros | BM25, TF-IDF, or SPLADE, usually for keyword-based retrieval |
| **Multivector** | Multiple same-sized vectors per point | Token-level processing, late interaction models |

Depending on the vector type, different configuration parameters control how vectors are [indexed](https://qdrant.tech/documentation/concepts/indexing/), and [searched](https://qdrant.tech/documentation/concepts/search/). Settings like **datatype** and **on_disk** serve the same purpose across vector types, even though they appear in different parts of the configuration schema (`VectorParams` for dense and multivector vectors, `SparseVectorParams` for sparse).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `datatype` | No | Storage type: `float32` (default), `float16`, or `uint8` |
| `on_disk` | No | When `true`, stores vectors on disk instead of RAM |

These settings must be defined at the vector field level. They cannot be set globally at the collection level.

When choosing the best datatype, `float16` provides a 50% memory reduction versus `float32` (2 bytes/dimension vs. 4 bytes) with minimal recall impact (<1% typical degradation) - no quantization required. 

When using the `uint8` datatype for dense vectors in Qdrant, the vectors must be pre-quantized into 8-bit unsigned integer values before they are ingested. Some embedding providers offer pre-quantized embeddings that are compatible with this format. 

Read more: [Datatypes](https://qdrant.tech/documentation/concepts/vectors/#datatypes).


### 1. Dense Vectors

[Dense Vectors](https://qdrant.tech/documentation/concepts/vectors/?q=dense#dense-vectors) are fixed-length arrays of floating-point numbers that encode the semantic meaning of data in a high-dimensional space. The settings you define in each vector field’s configuration determine how vectors are stored, indexed, and searched.

You can fine-tune the following parameters inside the `VectorParams` configuration::

| Parameter | Required | Description |
|-----------|----------|-------------|
| `size` | Yes | Dimensionality of the vector (must match embedding model output) |
| `distance` | Yes | Similarity metric: `Cosine`, `Dot`, `Euclid`, or `Manhattan` |
| `quantization_config` | No | Controls memory/performance trade-offs |
| `hnsw_config` | No | Field-specific HNSW graph configuration |  

Example: defining a collection with a single dense vector field:

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

[Multivectors](https://qdrant.tech/documentation/concepts/vectors/?q=multi#multivectors) extend dense vectors by allowing you to store multiple vectors per point, all with the same dimensionality. It enables late interaction models like ColBERT or ColPALI, where relevance is computed not over a single embedding but across multiple token-level representations.

They share the same core parameters as dense vectors (`size`, `distance`, `hnsw_config`, etc.), but also require:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `multivector_config` | Yes | Configuration for handling multiple vectors per point |
| `comparator` | Yes | How to compare vectors: `max_sim` (maximum similarity) |

Example: creating a simple collection with multivector configuration:

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

Multivectors are indexed and searched the same way as dense vectors, but Qdrant automatically applies the comparator during scoring. Your global `hnsw_config` settings will apply to your multivectors, unless explicitly configured differently per vector field. We'll cover how to do that in the [HNSW Configuration](#hnsw-configuration) section.

### 3. Sparse Vectors

[Sparse Vectors](https://qdrant.tech/documentation/concepts/vectors/?q=sparse#sparse-vectors) represent data as a set of token-position pairs, where only **non-zero** values are stored. Unlike dense embeddings, which distribute meaning across all dimensions, sparse vectors are ideal for **keyword-based retrieval**.

Sparse vectors have their own configuration block, `SparseVectorParams`, where you can customize indexing and preprocessing behavior:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `index.full_scan_threshold` | No | For small segments (less than 10,000 vectors), uses brute-force scoring |
| `modifier` | No | Enables [idf](https://qdrant.tech/documentation/concepts/indexing/?q=idf#idf-modifier) weighting based on token rarity in the collection |

Example: creating a collection with a sparse vector field named `text_sparse`

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

Qdrant lets you define multiple vector fields within a single collection using [Named Vectors](https://qdrant.tech/documentation/concepts/vectors/?q=named+vec#named-vectors). Each field is assigned a unique name and can be configured independently, including its size, distance metric, indexing settings, and vector type (dense, sparse, or multivector).

Example: creating a collection with three named vector fields: `dense_text` (dense), `token_embeddings` (multivector), and `keywords` (sparse)

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense_text": models.VectorParams(
            size=1536, 
            distance=models.Distance.COSINE
        ),
        "token_embeddings": models.VectorParams(
            size=128, 
            distance=models.Distance.DOT,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            )
        )
    },
    sparse_vectors_config={
        "keywords": models.SparseVectorParams(
            modifier="idf"
        )
    }
)
```

#### Best Practices

1. **Dimensionality**: Always match the `size` parameter to your embedding model's output dimensions
2. **Distance Metrics**: It's usually best to match the distance metric to what your embedding model was trained for. If you're unsure:

   - `COSINE`: For **most text embeddings** where magnitude isn't meaningful
   - `DOT`: For embeddings trained with dot-product similarity
   - `EUCLID`: For spatial data or when absolute distances matter
   - `MANHATTAN` Used in some tabular models and cases where features contribute independently
3. **Memory Management**: Use `on_disk=True` for large collections to conserve RAM but expect higher latency during search and indexing.
4. **Quantization**: Consider quantization for large production deployments to reduce memory footprint
5. **Sparse vs. Dense**: Use sparse vectors for keyword-based search and dense vectors for semantic search

Read More: [Vectors Documentation](https://qdrant.tech/documentation/concepts/vectors/)

## HNSW Configuration

Qdrant uses the **HNSW (Hierarchical Navigable Small World)** algorithm to enable fast, approximate nearest neighbor search for dense vectors. The HNSW configuration plays a key role in balancing search speed, accuracy, and resource consumption, which makes it one of the most important areas to tune for performance.

The HNSW indexing configuration can be applied at two levels:

- **Globally** for the entire collection
- **Per vector field** to override global settings

The key parameters that control HNSW behavior:

| Parameter | Default | Description | When to Adjust |
|-----------|---------|-------------|----------------|
| `m` | 16 | Connections per node | Higher (32-64) for better recall; Lower (8) to reduce memory |
| `ef_construct` | 100 | Search width during indexing | Higher (200-300) for better search quality; Lower for faster indexing |
| `full_scan_threshold` | 10000 | Skip indexing below this count | Higher for faster inserts; Lower to force indexing for small segments |
| `on_disk` | false | Store index on disk | `true` when index exceeds available RAM |
| `max_indexing_threads` | 0 | Parallelism during indexing | 2-4 for multi-core systems; 1 for shared environments |
| `payload_m` | Same as `m` | Connections optimized for payload filtering | Raise (32+) if you rely heavily on filtering; reduce if filters are minimal |

Here's a visual breakdown of what these parameters affect inside the HNSW graph:

<img src="/documentation/guides/collection-config-guide/hnsw-parameters.png" width="600">

Read more: [Vector Index](https://qdrant.tech/documentation/concepts/indexing/#vector-index).


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

**Note:** All HNSW settings can be adjusted after collection creation.

Read More: [HNSW Documentation](https://qdrant.tech/documentation/concepts/indexing/#vector-index)

## Quantization Configuration

[Vector Quantization](https://qdrant.tech/articles/what-is-vector-quantization/) compresses vectors to reduce memory usage with minimal accuracy loss. As collections grow to millions of vectors, quantization becomes essential for resource-efficient deployments.

Qdrant supports three quantization methods, each with distinct performance characteristics:

| Method | Reduction | Accuracy Impact | Speed Gain | Best For |
|--------|-----------------|----------------|-----------------|----------|
| **Scalar** | 4× | Low (0.99) | Up to 4× faster | General purpose, balanced approach |
| **Binary** | 32× | Model-dependent (0.95) | Up to 40× faster | Maximum speed, compatible models |
| **Product** | Up to 64× | Moderate to high (0.7) | Up to 2× faster | Maximum compression tolerance |

**Note:** You can update the Quantization settings of an existing collection without recreating it. 

#### Scalar Quantization

[Scalar Quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-scalar-quantization) maps `float32` values to smaller integer types like `int8`, shrinking memory usage by 75% while maintaining high accuracy. Each vector dimension is scaled to fit the range of the smaller type.

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `type` | Bit depth for quantized values | `int8` for 4× reduction, `int16` for 2× reduction |
| `quantile` | Trims outliers in the distribution | `0.99` standard, excludes extreme 1% of values |
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

#### Binary Quantization

[Binary Quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-binary-quantization) offers maximum compression and speed by reducing each dimension to a single bit (0 or 1). Values greater than zero become 1, and values less than or equal to zero become 0. For example, this reduces a 1536-dimensional vector from 6 KB to just 192 bytes (a 32× reduction):

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

Binary Quantization is exceptionally fast because it enables the use of highly optimized CPU instructions ([XOR](https://en.wikipedia.org/wiki/Exclusive_or) and [Popcount](https://en.wikipedia.org/wiki/Hamming_weight)) for distance computations, offering up to 40× speed improvement. [Read more about Binary Quantization - Vector Search, 40x Faster](https://qdrant.tech/articles/binary-quantization/).

Important: Binary quantization is most effective with embeddings that have **at least 1024 dimensions**. Known compatible models include:
- OpenAI's `text-embedding-ada-002`, `text-embedding-3-small` and `text-embedding-3-large`.
- Cohere AI `embed-english-v3.0`.

#### Product Quantization

[Product Quantization](https://qdrant.tech/documentation/guides/quantization/?q=binary+qunatization+40x#setting-up-product-quantization) segments vectors into subvectors and compresses each subvector using codebooks. Instead of storing raw values, each subvector is represented by an index pointing to its nearest centroid.

| Parameter | Description | Recommended Values |
|-----------|-------------|-------------------|
| `compression` | Compression ratio | Powers of 2: `8`, `16`, `32`, `64` |
| `always_ram` | Keeps vectors in memory | `false` for storage optimization, `true` for speed |

This method can compress a 1024-dimensional vector down to 128 bytes. The tradeoff is significant loss in accuracy, especially for high-precision tasks.

Like HNSW, quantization settings can be applied:

- **Globally** for the entire collection
- **Per vector field** to override global settings

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

Read More: [Quantization Documentation](https://qdrant.tech/documentation/guides/quantization/)

## Optimizer Configuration

The optimizer in Qdrant is responsible for maintaining the internal health of your collection. As data is inserted, updated, and deleted over time, the underlying storage can become fragmented. Segments can  sometimes accumulate deleted entries, grow unevenly, or fail to meet indexing thresholds. The optimizer runs in the background to merge segments, clean up deleted points, and keep indexing performant.

These settings don't impact accuracy directly, but they shape **insertion throughput**, **memory efficiency**, and **long-term scalability**. All parameters are optional and have built-in defaults.

<img src="/documentation/guides/collection-config-guide/optimization.svg" width="800">

Here’s a breakdown of the key settings that control optimizer behavior and their default values:

| Parameter                   | Default | Description                                                  | When to Adjust                                                   |
|----------------------------|---------|--------------------------------------------------------------|------------------------------------------------------------------|
| `deleted_threshold`        | `0.2`   | Proportion of deleted points in a segment that triggers optimization       | Lower to clean up more frequently if you delete often            |
| `vacuum_min_vector_number` | `1000`  | Minimum segment size eligible for merging during optimization | Lower to reduce fragmentation in small datasets                  |
| `default_segment_number`   | `2`     | Initial number of segments for a collection              | Increase to enable more parallel ingestion at startup            |
| `max_segment_size`         | `50000` | Do not create segments larger this size (in kilobytes)          | Raise for fewer but larger segments on high-memory systems       |
| `memmap_threshold`         | `20000` | Threshold at which segments are memory-mapped instead of fully RAM-loaded                   | Lower on memory-constrained systems                              |
| `indexing_threshold`       | `20000` | Segment size at which HNSW indexing is triggered                   | Increase to delay indexing and speed up insert-heavy workloads   |
| `flush_interval_sec`       | `5`     | Interval for flushing in-memory WAL to disk (in seconds)               | Lower for better durability, increase to reduce I/O load     |
| `max_optimization_threads` | `0`     | Number of threads used for background optimization (0 = auto)                  | Set explicitly on multi-core systems to control optimization speed     |

Here’s an example of a Qdrant optimizer configuration tailored for **read-heavy workloads with frequent updates or deletes**, where the goal is to keep segments compact, indexing responsive, and long-term search performance consistent:

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
        deleted_threshold=0.05,             # Frequent cleanup to avoid index pollution
        vacuum_min_vector_number=1000,      # Merge small segments aggressively
        default_segment_number=2,           # Good balance for initial bulk inserts
        max_segment_size=75000,             # Medium-large segments to reduce merge frequency
        memmap_threshold=50000,             # Keep only massive segments off RAM
        indexing_threshold=15000,           # Index fairly early for fast search on fresh data
        flush_interval_sec=3,               # Frequent flushes to reduce WAL loss window
        max_optimization_threads=3          # Take advantage of available CPU for background merges
    )
)
```

#### Best Practices

- **For ingestion-heavy workloads**, set a higher `default_segment_number` (e.g. 4–8) to spread incoming data across multiple segments and reduce write bottlenecks. Increasing `max_segment_size` will delay compactions, improving write throughput by minimizing early merges.
- **For high-delete workloads**, lower `deleted_threshold` to trigger cleanup sooner and reduce the cost of storing deleted points. Also reduce `vacuum_min_vector_number` to ensure even small segments get optimized.
- **On memory-constrained systems**, decrease `memmap_threshold` so that large segments are stored as memory-mapped files instead of fully in RAM. This saves memory with only a slight increase in access latency.
- **To maximize indexing performance**, raise `indexing_threshold` to delay HNSW index creation, which allows faster bulk writes. Useful for high-throughput imports, but expect increased memory pressure and slower queries until indexing completes.

Optimizer configurations do not **directly** influence the latency of a single query. Instead, they control how segments are maintained over time, which impacts long-term throughput, index health, and consistency of search performance as your dataset grows and changes.

Read More: [Optimizer Documentation](https://qdrant.tech/documentation/concepts/optimizer/)

## WAL (Write-Ahead Log) Configuration

The [Write-Ahead Log (WAL)](https://qdrant.tech/documentation/concepts/storage/#versioning) ensures that no data is lost in the event of a crash. Before any insert, update, or delete is applied to the in-memory state or persisted to disk, it is first written to the WAL.

If Qdrant shuts down unexpectedly, it can replay the WAL to restore the last consistent state. Especially important in write-heavy scenarios or when operating in environments without strong external persistence guarantees.

Two key parameters control WAL behavior:

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

## Sharding and Replication

[Sharding](https://qdrant.tech/documentation/guides/distributed_deployment/?q=sharding#sharding) and [Replication](https://qdrant.tech/documentation/guides/distributed_deployment/?q=sharding#replication) allow Qdrant to scale collections across multiple nodes while maintaining availability and fault tolerance. These features are **essential** for production environments that require horizontal scalability, high availability, or write resilience.

![](/documentation/guides/collection-config-guide/shards.png)

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

If you do not explicitly set `on_disk_payload=True` during collection creation, Qdrant will store all payloads in memory by default.

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

You can update this setting later using the [update collection parameters](https://api.qdrant.tech/v-1-14-x/api-reference/collections/update-collection#request.body.params.Collection-Params-Diff.on_disk_payload).

Read More: [Storage Documentation](https://qdrant.tech/documentation/concepts/storage/)

## Strict Mode Configuration

Strict mode is a safeguard against operations that could overload your system or degrade performance. It enforces hard limits on queries, timeouts, search parameters, and access rates. This is especially useful in shared environments, multi-tenant clusters, or production systems exposed to external traffic.

When enabled, strict mode helps maintain system stability by rejecting operations that exceed pre-defined constraints. It's a proactive way to protect Qdrant from unbounded requests, misconfigured clients, or unindexed queries that would otherwise bypass indexing optimizations.

These parameters control strict mode behavior:

| Parameter                      | Default | Description                                                  | When to Adjust                                                  |
|-------------------------------|---------|--------------------------------------------------------------|-----------------------------------------------------------------|
| `enabled`                     | `false` | Activates strict mode enforcement                            | Enable in production or shared environments                    |
| `max_query_limit`             | `None`  | Upper limit on number of points returned per query           | Set to avoid accidental full scans                             |
| `max_timeout`                 | `None`  | Maximum allowed timeout in seconds for any request           | Lower to restrict long-running operations                      |
| `unindexed_filtering_retrieve` | `true`  | Allow filtering on unindexed payload fields                  | Set to `false` to avoid slow scans                             |
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
- **Rate limits** `read_rate_limit` and `write_rate_limit`  help protect replicas from overload, especially under unpredictable load.

Strict mode doesn't affect how Qdrant stores or indexes data, it governs what kinds of operations are allowed at runtime, based on defined safety limits.

## Collection Runtime Status

After creation and use, every Qdrant collection exposes a set of runtime fields that describe its current health, indexing progress, and internal layout. These are read-only, live indicators useful for debugging ingestion, monitoring optimization, and planning for scale.

Each field helps answer a specific operational question:

| Field                    | Description                                                                 | What to Watch For                                                                 |
|-------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `status`                | Indexing readiness of the collection                                        | `🟡 yellow` means indexing is ongoing. `🟢 green` means all points are searchable. `🔴 red` indicates a critical failure (e.g. out-of-disk). |
| `optimizer_status`      | Whether background optimization is active (merges, cleanup)                 | Long `"optimizing"` under low load may signal config issues.                     |
| `points_count`          | Total active points (includes both indexed and unindexed)                   | Should track inserts. Sudden drops may indicate deletions.                       |
| `vectors_count`         | Count of stored vectors, per field                                          | May be `null` early on. Useful for checking named vector ingestion.              |
| `indexed_vectors_count` | Vectors that are fully indexed and searchable                               | If this lags far behind `points_count`, indexing is catching up.                 |
| `segments_count`        | Number of data segments in the collection                                   | High segment count can hurt performance. Optimizer will gradually reduce it.     |

If `indexed_vectors_count` < `points_count`, some vectors haven't been picked up by the optimizer yet. This can happen right after ingestion or if the indexing_threshold hasn't been reached.

## Using This Guide

Vector configuration, indexing strategies, quantization, sharding, and strict mode settings all influence how your Qdrant collection performs at scale. Each setting should reflect the structure of your data and the needs of your application.

You don’t need to memorize every detail. This guide is here to reference when you're tuning for recall, ingestion speed, latency, or resource constraints.

Qdrant is built to be fast, flexible, and it works best when the configuration aligns closely with the shape of your data and the demands of your application.