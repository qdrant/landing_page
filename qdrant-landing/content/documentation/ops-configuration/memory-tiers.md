---
title: Memory Tiers
short_description: "Control whether vectors, indexes, quantized data, and payloads live on disk, in a warm disk cache, or in pinned RAM."
description: "Learn how Qdrant's memory parameter (cold, cached, pinned) controls RAM residency for vectors, indexes, quantized data, and payloads."
weight: 12
aliases:
  - disk-vs-ram
---

# Memory Tiers

Qdrant persists all collection data to disk. For faster search, you can also load individual structures into RAM, but keeping everything in memory isn't always cost-effective. The per-structure `memory` parameter lets you control whether data lives in pinned RAM, a warm disk cache, or on disk.

This page covers how to control where data structures live, the different placement tiers available, and how to optimize for disk-based retrieval.

## Configuring Memory Tiers

<aside role="status">
This page covers the <code>memory</code> parameter introduced in Qdrant v1.19. If you're using an older version, see the <a href="#legacy-settings">Legacy Settings</a> section for how to map the new parameter to the old ones.
</aside>

Each collection in Qdrant is backed by several independent structures:

- **[Dense vectors](/documentation/manage-data/vectors/)** hold the original floating-point vectors for a collection or named vector.
- **The [HNSW graph index](/documentation/manage-data/indexing/#vector-index)** is a graph structure built over dense vectors that makes approximate nearest-neighbor search fast.
- **[Quantized vectors](/documentation/manage-data/quantization/)** are compressed copies of the original vectors, used to speed up search and shrink memory use.
- **The [sparse vector index](/documentation/manage-data/indexing/#sparse-vector-index)** is an exact, inverted-index-style structure built over sparse vectors.
- **[Payloads](/documentation/manage-data/collections/#create-a-collection)** are the JSON documents attached to each point.
- **[Payload indexes](/documentation/manage-data/indexing/#payload-index)** are per-field indexes that speed up filtering.

Each of these structures accepts a `memory` parameter that determines whether it lives in pinned RAM, in a warm disk cache, or on disk. The available tiers are:

- **`pinned`**: Qdrant loads the data onto the heap and never evicts it. Requests stay fast, but the structure must fit in RAM at all times. Because it allocates data on the heap, it's [only available for structures that support a heap-backed in-RAM representation](#limitations).
- **`cached`**: Qdrant pre-loads the data into the disk cache when it starts up, so the first request is fast. Under memory pressure, the operating system can evict this data if it decides another component's data is used more often.
- **`cold`**: Qdrant doesn't pre-load the data into RAM. The first request against it may be slower, since Qdrant reads from disk, but the operating system caches pages as they're accessed.

`cold` and `cached` both back the data with a memory-mapped file; the only difference is whether Qdrant proactively warms the operating system's page cache on load. The OS evicts both tiers using the same criteria, so `cached` data gets no priority over `cold` data under memory pressure.

### Limitations

- Qdrant rejects `pinned` for dense vectors and payloads, since both only support a memory-mapped in-RAM representation (`cached` or `cold`).
- For sparse vectors, only the sparse vector index has a `memory` parameter. Raw sparse vector values always live on disk. Qdrant doesn't offer an in-RAM option for them, since their values aren't read during the index search step itself, only when a point is fetched.

## Default Tiers

If you don't explicitly set `memory` on a structure, Qdrant defaults to the following tiers:

| Data structure | Default tier |
|---|---|
| Dense vectors | `cached` |
| HNSW graph index | `cached` |
| Quantized vectors | Depends on the placement of the original dense vectors: `pinned` if original vectors are `cached`, `cold` if original vectors are `cold`. |
| Sparse vector index | `pinned` |
| Payloads | `cold` |
| Payload indexes | `pinned` |

[Low Memory Mode](/documentation/ops-configuration/administration/#low-memory-mode) can degrade these defaults at startup under memory constraints, without changing the persisted collection configuration.

## Example

This example configures a collection so the vectors are cached in RAM, the HNSW graph is cold, the quantized vectors are pinned, and the payload is cached:

{{< code-snippet path="/documentation/headless/snippets/create-collection/with-memory-tiers/" >}}

## Optimizing for Disk-Based Retrieval

When structures are in the `cold` tier, retrieval may involve reading from disk. Use these techniques to keep search fast despite the extra disk I/O.

### Quantization

[Quantization](/documentation/manage-data/quantization/) compresses vectors into a smaller representation. The quantized copy fits comfortably in RAM even when the original vectors are `cold`. This enables Qdrant to score most candidates against the quantized copy and only read the original vectors from disk to rescore the top results. Quantization cuts down on how much data needs to come from disk during search, at the cost of the small accuracy loss it introduces.

Keep the quantized vectors in RAM by setting `memory: "pinned"` in the `quantization_config`. Without pinning, the quantized copy may be evicted under memory pressure, forcing Qdrant to read both the quantized and original vectors from disk.

If the accuracy loss is acceptable, you can disable rescoring against the original vectors entirely by setting `rescore: false` in the `quantization_config`. This avoids any disk reads during search.

### Async I/O

Enable `async_scorer` in the [storage configuration](/documentation/ops-configuration/configuration/) to let Qdrant issue disk reads concurrently during rescoring, instead of one at a time:

```yaml
storage:
  performance:
    async_scorer: true
```

This uses [io_uring](/articles/io_uring/), a Linux kernel interface for asynchronous I/O, and requires a kernel that supports it. Async I/O helps most when the original vectors are `cold` and quantization is enabled, since rescoring the top candidates against the on-disk originals is where sequential disk reads would otherwise add up.

### Local NVMe/SSD Storage

On-disk retrieval benefits from fast, local storage. If you're self hosting Qdrant, use NVMe or SSD drives attached directly to the machine. Avoid network-attached storage. It is too slow for the sequential reads that vector search requires.

### Inline Storage

*Available as of v1.16.0*

Avoid putting the HNSW index in the `cold` tier. If you must store it on disk and use quantization, consider enabling [inline storage](/documentation/ops-optimization/optimize/#inline-storage-in-hnsw-index). This reduces I/O operations at the cost of three to four times more disk usage.

## Legacy Settings

Before version 1.19, memory placement was controlled by a different set of parameters. These parameters are deprecated. If you're on a version older than 1.19, you can use the following tables to map the new `memory` parameter to the legacy parameters.

### Dense Vectors

The legacy parameter is `on_disk`.

| `memory` | Legacy value |
|---|---|
| `cached` | `on_disk: false` |
| `cold` | `on_disk: true` |

### HNSW Graph Index

The legacy parameter is `on_disk`, set in `hnsw_config`.

| `memory` | Legacy value |
|---|---|
| `pinned` | No legacy equivalent |
| `cached` | `on_disk: false` |
| `cold` | `on_disk: true` |

### Quantized Vectors

The legacy parameter is `always_ram`. `always_ram: true` always resolves to `pinned`. Otherwise, quantized vectors inherit the original vectors' placement: `pinned` if the vectors are in RAM, `cold` if they're on disk.

| `memory` | Legacy value |
|---|---|
| `pinned` | `always_ram: true`, or inherited from the original vectors |
| `cached` | No legacy equivalent |
| `cold` | Inherited from the original vectors |

### Sparse Vector Index

The legacy parameter is `on_disk`.

| `memory` | Legacy value |
|---|---|
| `pinned` | `on_disk: false` |
| `cached` | No legacy equivalent |
| `cold` | `on_disk: true` |

### Payloads

The legacy parameter is `on_disk_payload`, set on the collection.

| `memory` | Legacy value |
|---|---|
| `cached` | `on_disk_payload: false` |
| `cold` | `on_disk_payload: true` |

### Payload Indexes

The legacy parameter is `on_disk`, set on each field index.

| `memory` | Legacy value |
|---|---|
| `pinned` | `on_disk: false` |
| `cached` | No legacy equivalent |
| `cold` | `on_disk: true` |
