---
title: Capacity Planning
short_description: "Size a Qdrant cluster by balancing RAM and disk for vectors, payload, indexes, replication, and quantization workloads."
description: "Plan Qdrant cluster capacity: estimate RAM and disk for vectors, payloads, indexes, replication, and quantization to match your workload."
partition: deploy
weight: 115
aliases:
  - capacity
  - /documentation/cloud/capacity-sizing
  - /documentation/capacity-planning
  - /documentation/operations/capacity-planning
---
# Capacity Planning

Sizing a Qdrant cluster means estimating how much storage and memory your collections need and deciding how to distribute that load across nodes. The right setup depends on a few things:

- The number of vectors, their dimensions, and their datatype.
- Payload sizes and their payload indexes.
- Which memory tier you use for vectors, indexes, and payloads.
- Your collections' replication settings.
- Whether you're using quantization and how you’ve set it up.

<aside role="status">To size your deployment interactively, try the <a href="https://sizing.qdrant.tech/">Qdrant Sizing Calculator</a>.</aside>

## Calculating RAM and Disk Size

Estimate how much RAM and disk each collection needs. Do this for each collection in your cluster, then sum the results to get a total for the cluster.

A Qdrant collection consists of several independent structures that are persisted to disk. For faster search, you can load individual structures into RAM by configuring a [memory tier](/documentation/ops-configuration/memory-tiers/) for each of them: either `pinned` (heap RAM, never evicted), `cached` (memory-mapped, pre-warmed into RAM at startup), or `cold` (memory-mapped, loaded on demand). As a consequence, each structure contributes to disk and RAM, depending on the tier you choose.

Capacity planning for a collection starts with your **base unit**: the number of points in your collection multiplied by the replication factor. This is the total number of points that will be stored across all replicas:

```text
base = number_of_points * replication_factor
```

### Dense Vectors

#### Original Vectors

[Dense vectors](/documentation/manage-data/vectors/#dense-vectors) are the original representations of the embeddings you search over. The amount of RAM and disk they consume depends on the base number, the vector dimensionality, and their datatype:

```text
dense_size = base * dimensions * bytes_per_dim
```

Where `bytes_per_dim` depends on the [datatype](/documentation/manage-data/vectors/#datatypes): `float32` = 4 bytes (default), `float16` = 2 bytes, `uint8` = 1 byte, `turbo4` = 0.5 bytes. Dense vectors count toward RAM if the vectors are in the default `cached` tier. If you move them to `cold`, only actively-read pages get cached by the OS opportunistically, so you don't need to budget RAM for them up front.

Example: one million points, 768 dimensions, a replication factor of two, `float32`, default `cached` tier:

```text
base = 1,000,000 * 2 = 2,000,000
dense_size = 2,000,000 * 768 * 4 bytes ≈ 5.72 GB
```

If your points carry [multiple named vectors](/documentation/manage-data/vectors/#named-vectors), apply this formula for each named vector and sum the results. Each named vector has its own dimensions, datatype, memory tier, and HNSW vector index, so a collection with a 1536-dimension `float32` vector and a 384-dimension `uint8` vector needs both sized separately.

#### Quantized Vectors

[Quantization](/documentation/manage-data/quantization/) creates a compressed copy of your vectors that speeds up search and shrinks memory use, at some cost to accuracy.

If you enable quantization, Qdrant stores this compressed copy alongside the original vectors:

```text
quantized_size = base * dimensions * quant_bytes
```

`quant_bytes` depends on the [quantization method and its compression ratio](/documentation/manage-data/quantization/#how-to-choose-the-right-quantization-method).

By default, the quantized copy's tier depends on the original vectors' tier: `pinned` if the originals are `cached`, `cold` if the originals are `cold`. Explicitly setting the quantized vectors to `pinned` keeps them in RAM even when the originals are `cold`, so search only has to touch disk to rescore the top candidates. This is what lets quantization cut RAM usage while disk usage stays close to the same.

For example, with 4-bit TurboQuant (8x compression, 0.5 bytes per dimension), originals moved to `cold`, and quantized vectors `pinned`, RAM for dense vectors drops from 5.72 GB to:

```text
quantized_size = 2,000,000 * 768 * 0.5 bytes ≈ 0.72 GB
```

<aside role="status">Only use quantization if the resulting search quality is acceptable. Some embedding models don't quantize efficiently, so verify recall against unquantized results. See <a href="/documentation/manage-data/quantization/#accuracy-tuning">Accuracy Tuning</a> and <a href="/documentation/tutorials-search-engineering/ann-recall/">Measuring ANN Recall</a>.</aside>

#### HNSW Vector Indexes

[The HNSW vector index](/documentation/manage-data/indexing/#vector-index) is the graph structure built over dense vectors that makes approximate nearest-neighbor search fast. Each dense vector defined in a collection's schema has its own HNSW index, which is sized as follows:

```text
hnsw_size = base * m * 2 * 4 bytes * 1.2
```

The HNSW graph consists of `m` edges per node (default 16). The graph's top layer stores `2 * m` connections per point, each a 4-byte reference. The `1.2` factor covers the lower layers and bookkeeping.

For example, with one million points, a replication factor of two, and default `m = 16`:

```text
hnsw_size = 2,000,000 * 16 * 2 * 4 bytes * 1.2 ≈ 0.29 GB
```

The HNSW vector index memory tier defaults to the `cached` tier. Avoid moving it to `cold` if you can, since graph traversal does many small random reads that suffer badly from disk latency.

Each named vector has its own HNSW vector index. If you have multiple named vectors, size each index separately and sum the results.

### Sparse Vectors

[Sparse vectors](/documentation/manage-data/vectors/#sparse-vectors) back keyword-style [full-text search](/documentation/search/text-search/full-text-search/). They also have an index, which is an inverted-index-style structure.

If you're using sparse vectors, size them separately using their non-zero element count (`nnz`) instead of `dimensions`:

```text
sparse_size  = base * nnz * bytes_per_dim
sparse_index = base * nnz * bytes_per_dim * 1.5
```

Sparse vectors can't be cached in RAM; they only require disk space. Sparse vector indexes default to `pinned`, which keeps them in RAM and on disk.

If you have multiple sparse vectors, size each one separately and sum the results.

### Payloads

#### Payload Storage

Each point can carry a [payload](/documentation/manage-data/payload/), arbitrary JSON data stored alongside the vector. Its size depends entirely on the [structure and content of your data](/documentation/manage-data/payload/#payload-types): text fields scale with length and encoding, numbers are fixed at 8 bytes, and booleans at one byte. To estimate payload size, use a JSON size calculator.

Once you know the average payload size per point, the total depends on the memory tier:

```text
disk_size = base * avg_payload_size * 1.5
ram_size  = base * avg_payload_size * 1.5 * 3   # if cached
```

The `1.5` factor covers backend storage overhead. Payloads default to the `cold` tier, which is good enough for most use cases.

Example: one million points with a 1KB average payload, replication factor of two, and a `cold` (default) tier:

```text
disk_size = 2,000,000 * 1,024 bytes * 1.5 ≈ 2.86 GB
```

If your payload has several fields that differ in size or in whether they're indexed, size each field separately and sum the results instead of applying one average across the whole document. A single 4KB text field you never filter on and a 12-byte integer you filter on constantly have very different cost profiles.

#### Payload Indexes

A [payload index](/documentation/manage-data/indexing/#payload-index) is a per-field structure that speeds up filtering. Creating a payload index adds an additional structure on top of the payload itself. It defaults to the `pinned` tier, costing extra RAM (as well as disk).

As a coarse estimate, budget roughly **2x the size of the fields you index**:

```text
payload_index_size ≈ indexed_payload_size * 2
```

Only index the fields you filter on: indexing everything wastes RAM.

### ID Tracker

The ID tracker maps each point's external ID to its internal storage location and current version. Qdrant persists it on disk and keeps it resident in RAM at all times:

```text
id_tracker_size = base * 52 bytes
```

For example, with one million points and a replication factor of two:

```text
id_tracker_size = 2,000,000 * 52 bytes ≈ 0.10 GB
```

## Putting It Together

Add up the components that apply to your setup, based on the tiers you've chosen:

- **RAM**: anything in the `pinned` or `cached` tier:
  - Dense vectors (`cached` by default)
  - The HNSW vector indexes (`cached` by default)
  - Quantized vectors and the sparse indexes (`pinned` by default)
  - Payload indexes (`pinned` by default)
  - The ID tracker, which is always resident
- **Disk**: everything, regardless of tier:
  - Dense vectors and quantized vectors
  - The HNSW vector indexes
  - Sparse vectors and their indexes
  - All payload and payload indexes
  - The ID tracker

Qdrant persists every structure to disk. The memory tier only controls what Qdrant additionally keeps in RAM.

Then add **~20% headroom** on top of your final RAM and disk totals. On the RAM side, this covers the OS page cache, Qdrant's runtime overhead, and temporary work during optimization. On disk it covers WAL, snapshots, and temporary segments created by the optimizer.

For example: one million vectors and the HNSW vector index `cached`, no quantization, payloads `cold` and unindexed:

```text
RAM  = dense_size + hnsw_size + id_tracker_size
     = 5.72 + 0.29 + 0.10 ≈ 6.11 GB
     * 1.2 headroom ≈ 7.33 GB to plan for

Disk = dense_size + hnsw_size + disk_size (payload) + id_tracker_size
     = 5.72 + 0.29 + 2.86 + 0.10 ≈ 8.97 GB
     * 1.2 headroom ≈ 10.76 GB to plan for
```

These are still estimates. For exact numbers on your own data, use the [Qdrant Sizing Calculator](https://sizing.qdrant.tech/) or test with a representative sample.

Repeat this calculation for every collection, then sum the RAM and disk totals across all of them to size the cluster as a whole.

## Cluster Topology

The formulas in the previous section tell you how much RAM and disk your data needs. They don't tell you how many nodes and shards to spread it across. That's driven by different considerations: fault tolerance and room for future growth.

### Node Count

Start from the RAM total you calculated in [Calculating RAM and Disk Size](#calculating-ram-and-disk-size) and divide by the usable RAM per node, keeping each node under roughly 80% of its physical memory so the OS has room for page cache and temporary optimizer work:

```text
nodes = ceil(total_ram_estimate / (node_ram * 0.8))
```

As a sanity check on that number, a single node typically tops out around 100 million vectors. Treat this as a rough ceiling rather than a target: the real limit depends heavily on dimensionality, datatype, and whether you're using quantization, so a 3072-dimension `float32` collection will hit it far sooner than a 384-dimension `uint8` one.

Node count is also driven by [fault tolerance](/documentation/scaling/resilience). For high availability in production, use at least three nodes and a replication factor of two or higher. See [How many Qdrant nodes should I run?](/documentation/scaling/horizontal-scaling/#how-many-qdrant-nodes-should-i-run).

### Shard Count

Each Qdrant collection consists of a number of [shards](/documentation/scaling/horizontal-scaling/#sharding). Each of these shards can be [replicated](/documentation/scaling/horizontal-scaling/#replication). Shards distribute a collection across nodes so each node handles a subset of writes, increasing write throughput. Replicas are copies of a shard placed on other nodes: they keep the collection available if a node is lost. Each replica can serve read requests, so they increase read throughput as well.

The number of shards defaults to the number of nodes at collection creation time and can't be changed afterward without recreating the collection, except in Qdrant Cloud, where [resharding](/documentation/cloud/cluster-scaling/#resharding) is available. That makes shard count worth deciding up front.

Shard count is a tradeoff between scalability headroom and per-node efficiency:

- **Planning for growth**: create at least two shards per node so you can add nodes without having to reshard. 12 shards are a common choice because they divide evenly as you scale from 1 node up to 2, 3, 4, 6, and 12.
- **Optimizing for throughput on a small cluster**: each shard adds overhead. Avoid creating too many shards.

Qdrant can't split a shard across nodes, so a shard count that isn't a multiple of your node count leaves capacity unused. See [Choosing the right number of shards](/documentation/scaling/distributed_deployment/#choosing-the-right-number-of-shards).

## Choosing Disk over RAM

Only frequently accessed data should be cached in RAM. The rest can be offloaded to disk. For example, payload fields that you don't use for filtering don't need a payload index that's pinned in RAM. 

### Storage-Focused Configuration

If your priority is to handle large volumes of vectors with average search latency, it's recommended to move vectors to the [`cold` memory tier](/documentation/ops-configuration/memory-tiers/). In this setup, vectors are stored on disk in memory-mapped files, and only the most recently accessed pages get cached in RAM by the OS.

The amount of available RAM greatly impacts search performance. As a general rule, if you store half as many vectors in RAM, search latency will roughly double.

Disk speed is also crucial. [Contact us](/documentation/support/) if you have specific requirements for high-volume searches in our Cloud.

### Subgroup-Oriented Configuration

If your use case involves splitting vectors into multiple collections or subgroups based on payload values (for example, serving searches for multiple users, each with their own subset of vectors), we recommend the `cold` memory tier.

In this scenario, only the active subset of vectors will be cached in RAM, allowing for fast searches for currently active users. You can estimate the required RAM by replacing `number_of_points` with the actual active number of points in the base number calculation for RAM, instead of the full collection:

```text
base_ram = active_number_of_points * replication_factor
```

See the [multitenancy](/documentation/manage-data/multitenancy/) documentation for more details on partitioning data in Qdrant.

### Scaling Disk Space in Qdrant Cloud

Clusters supporting vector search require substantial disk space compared to other search systems. If you're running low on disk space, you can use the UI at [cloud.qdrant.io](https://cloud.qdrant.io/) to scale your cluster.

<aside role="status">Note: If you increase disk space via the Qdrant UI, you can't reduce it later.</aside>

When running low on disk space, consider the following benefits of scaling up:

- **Larger Datasets**: Supports larger datasets, which can improve the relevance and quality of search results.
- **Improved Indexing**: Enables the use of advanced indexing strategies like HNSW.
- **Caching**: Enhances speed by having more RAM, allowing more frequently accessed data to be cached.
- **Backups and Redundancy**: Facilitates more frequent backups, which is a key advantage for data safety.

Use the [Putting It Together](#putting-it-together) guidance to estimate your full RAM and disk needs, including the ~20% headroom for WAL, snapshots, and temporary segments created by the optimizer.

## Disclaimers

- These calculations are approximations. Always test with a sample of your actual data for more precise numbers.
- [Migration scenarios](/documentation/migration-recovery-options/) require more headroom than normal operations. When using the Migration Tool or restoring a snapshot, the target cluster needs twice the disk space currently used by the source collection. When using the Migration Tool, it also needs twice the RAM currently in use. To determine the current disk and RAM usage of your collection, check the [Web UI](/documentation/ops-monitoring/memory-usage/) or use the [API](/documentation/ops-monitoring/memory-usage/#api).