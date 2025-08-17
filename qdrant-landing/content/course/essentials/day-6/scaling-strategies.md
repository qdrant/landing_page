---
title: Vertical and Horizontal Scaling
weight: 1
---

{{< date >}} Day 6 {{< /date >}}

# Vertical and Horizontal Scaling

Scaling is matching the shape of your workload to the shape of your infrastructure. In Qdrant, that means knowing what truly drives memory and CPU on a single machine, and recognizing the moment when distributing a collection across nodes becomes the cleaner way to hit your latency, throughput, and availability goals.

---

## Scale up vs. scale out

There are two levers. Scaling up strengthens one node with more RAM, more CPU, and faster NVMe. It shines when a single machine can keep vectors, HNSW, and hot payloads in memory with comfortable headroom. Scaling out adds nodes and lets Qdrant split a collection with sharding and replication. It is the better tool when your working set outgrows one box or you need high availability across failure domains.

A practical rule: scale up until you hit a clear local ceiling (RAM for vectors and graph, CPU under higher ef or heavy filters, SSD IOPS during ingestion). When the working set no longer fits or p95 increases under normal load, introduce sharding and add replicas for resilience.

<!-- Visual: fan‑out across shards, then merge -->
<img src="/documentation/guides/collection-config-guide/shards.png" width="720" alt="Sharding fan-out and merge diagram">

---

## How Qdrant uses resources

Memory is first order: dense vectors plus the HNSW graph dominate RAM usage, and keeping both in memory is what keeps tail latency low. Dropping to float16 or using scalar/binary quantization cuts footprint substantially with a measured recall trade‑off (see Day 4). Payloads can live in RAM or on disk; setting `on_disk_payload=true` frees memory at a small cost when reading payloads.

CPU goes to HNSW traversal and scoring, and it grows with higher query `ef` and predicate filtering. Storage matters for WAL, snapshots, and any on‑disk data structures—NVMe lowers both indexing and search costs when on‑disk access is involved. In distributed clusters, expect extra work for network fan‑out and result merging on reads, and replication traffic on writes.

---

## When to scale up

Prefer a bigger node when the data and index fit with room to grow and latency problems correlate with CPU saturation rather than network hops. Start by adding RAM (the single most impactful lever to keep vectors and HNSW hot), then increase CPU to sustain higher `ef` and heavier filters, and move WAL and any on‑disk paths to fast NVMe.

Align background work with the machine profile. During bulk loads, delay index creation with `indexing_threshold` and spread writes across more initial segments with `default_segment_number`. After ingestion, let the optimizer compact segments and build indexes. If recall targets allow it, use float16 or quantization to create headroom without changing topology. The trade‑off: one node is simple, but also a single failure domain unless you add replication on the same class.

---

## When to scale out

Choose distribution when the dataset plus indexes no longer fit even with compression, when sustained QPS saturates CPU on a strong node, or when you need availability across zones or regions. Sharding divides a collection into partitions served in parallel; replication keeps copies of shards on different nodes so queries continue through failures. You pay a coordination cost for fan‑out and merge, and a write cost for replication.

Design the topology to the workload. Pick a shard count that matches expected parallelism without creating many tiny shards. Use `replication_factor=2` or more for availability and tune `write_consistency_factor` for durability. When locality matters, choose a custom shard key like tenant or user so related data stays together and caches work in your favor. See parameters and code on {{< relref "sharding-strategies.md" >}}.

---

## Capacity planning, end to end

Start with memory math and validate with a sample. A 768‑dimensional float32 vector is about 3 KB (768 × 4 bytes). One hundred million points is roughly 307 GB of raw vectors. Moving to float16 halves that to ~153 GB. The HNSW graph adds overhead that depends on `m`, `payload_m`, and segment sizes—plan 0.5×–1.5× on top, then measure with your real embeddings. If payloads are large, move them to disk to keep RAM for vectors and the graph.

### Quick reference (768‑dim, per 100M points)

| Datatype | Bytes/Dim | Per‑vector | Total |
|---|---:|---:|---:|
| float32 | 4 | ~3.0 KB | ~307 GB |
| float16 | 2 | ~1.5 KB | ~153 GB |
| int8 (scalar, effective) | 1 | ~0.8 KB | ~76 GB |

Turn the estimate into a plan. If the total fits with headroom, scale up. If not, shard across nodes so each shard keeps its vectors and index hot in memory. Keep shards large enough to amortize index and optimizer work, but not so large that any single shard becomes the bottleneck. Finally, size for concurrency and recall—higher `ef` improves recall at a CPU cost; complex filters add CPU and memory access cost. In a distributed setup, provision CPU and network so fan‑out does not dominate tail latency.

### A tiny memory planner

```python
# quick, back‑of‑the‑envelope planning
from math import ceil

def estimate_collection_gb(num_points:int, dim:int, dtype:str="float32", hnsw_overhead:float=1.0):
    bytes_per = {"float32":4, "float16":2}.get(dtype, 4)
    vectors_gb = (num_points * dim * bytes_per) / (1024**3)
    return vectors_gb * (1.0 + hnsw_overhead)

# example: 100M x 768, float16, ~1.0x HNSW overhead
print(round(estimate_collection_gb(100_000_000, 768, "float16", 1.0), 1), "GB")
```

---

## Tuning that scales

Treat index settings as dials. Raise `m` and `ef_construct` when you need recall. Use `payload_m` and Filterable HNSW when filtering is central. At query time, adjust `ef` to trade search cost for quality.

Plan segments and optimizers to the ingestion profile. During heavy writes, delay index building and use more initial segments; after the load, allow merges and indexing to catch up. Use float16 where supported, and adopt scalar or binary quantization at larger scales when memory and speed win out over the small recall loss. On the storage side, prefer NVMe, size the WAL to the write rate, and schedule snapshots and restore drills. In distributed deployments, set replication and write consistency to match SLOs, and keep clients close to the cluster to avoid cross‑region hops.

### Live dials (query‑time)

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# bump ef on a heavy query path to improve recall
res = client.search(
    collection_name="docs",
    query_vector=qvec,
    limit=20,
    search_params=models.SearchParams(hnsw_ef=256),
    query_filter=models.Filter(must=[models.FieldCondition(key="category", match=models.MatchValue(value="books"))])
)
```

---

## Reading the signals

Production gives you clear pointers: shrinking RAM headroom, page‑fault spikes with mmap, or CPU parked above 80% while p95 rises are all signs to act. If `indexed_vectors_count` lags behind `points_count` outside bulk loads, revisit indexing thresholds and segment sizes. If writes slow under higher replication, tune consistency or adjust placement. Those observations tell you whether to pick a larger node or to add shards and replicas.

---

## Two quick examples

A medium‑scale semantic search (20M points, 768 dim) runs well on a single node with 128 GB RAM and NVMe using float16 and moderate filters. Quantization is optional headroom. CPU dictates how high you push `ef`.

A large product catalog (300M points, 1024 dim) with heavy filtering benefits from binary quantization, eight shards for parallelism, and replication factor two for availability. Custom sharding by tenant improves locality and cache reuse.

---

## Takeaways

Scale up until you hit a clear ceiling—prefer RAM, then CPU, then SSD. Scale out when data or traffic exceed one node or when you need availability. Use datatypes and quantization to reduce memory before adding nodes. Plan shards and replicas to match parallelism and failure domains, then tune indexes and segments to the real workload profile.

---

## Further reading

- [Vector Search Manuals](https://qdrant.tech/articles/vector-search-manuals/)
- [Distributed Deployment](https://qdrant.tech/documentation/guides/distributed_deployment/)
- [Quantization Guide](https://qdrant.tech/documentation/guides/quantization/)
- [Filtering Guide](https://qdrant.tech/documentation/concepts/filters/) 