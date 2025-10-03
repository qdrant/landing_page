---
title: Vertical and Horizontal Scaling
weight: 1
---

{{< date >}} Day 6 {{< /date >}}

# Vertical and Horizontal Scaling

Scaling is matching the shape of your workload to the shape of your infrastructure. In Qdrant, that means knowing what truly drives memory and CPU on a single machine, and recognizing the moment when distributing a collection across nodes becomes the cleaner way to hit your latency, throughput, and availability goals.

## Scale up vs. scale out

There are two levers. Scaling up strengthens one node with more RAM, more CPU, and faster NVMe. It shines when a single machine can keep vectors, [HNSW](https://qdrant.tech/articles/filtrable-hnsw/), and hot payloads in memory with comfortable headroom. Scaling out adds nodes and lets Qdrant split a collection with sharding and replication. It is the better tool when your working set outgrows one box or you need high availability across failure domains.

A practical rule: scale up until you hit a clear local ceiling (RAM for vectors and graph, CPU under higher ef or heavy filters, SSD IOPS during ingestion). When the working set no longer fits or p95 increases under normal load, introduce sharding and add replicas for resilience.

<img src="/documentation/guides/collection-config-guide/shards.png" width="720" alt="Sharding fan-out and merge diagram">

## How Qdrant uses resources

Memory is first order: dense vectors plus the HNSW graph dominate RAM usage, and keeping both in memory is what keeps tail latency low. Dropping to float16 or using scalar/binary quantization cuts footprint substantially with a measured recall trade‑off (see Day 4). Payloads can live in RAM or on disk; setting `on_disk_payload=true` frees memory at a small cost when reading payloads.

CPU goes to HNSW traversal and scoring, and it grows with higher query `ef` and predicate filtering. Storage matters for WAL, snapshots, and any on‑disk data structures - NVMe lowers both indexing and search costs when on‑disk access is involved. In distributed clusters, expect extra work for network fan‑out and result merging on reads, and replication traffic on writes.

## When to scale up

Prefer a bigger node when the data and index fit with room to grow and latency problems correlate with CPU saturation rather than network hops. Start by adding RAM (the single most impactful lever to keep vectors and HNSW hot), then increase CPU to sustain higher `ef` and heavier filters, and move WAL and any on‑disk paths to fast NVMe.

Align background work with the machine profile. During bulk loads, delay index creation with `indexing_threshold` and spread writes across more initial segments with `default_segment_number`. After ingestion, let the optimizer compact segments and build indexes. If recall targets allow it, use float16 or quantization to create headroom without changing topology. The trade‑off: one node is simple, but also a single failure domain unless you add replication on the same class.

## When to scale out

Choose distribution when the dataset plus indexes no longer fit even with compression, when sustained QPS saturates CPU on a strong node, or when you need availability across zones or regions. Sharding divides a collection into partitions served in parallel; replication keeps copies of shards on different nodes so queries continue through failures. You pay a coordination cost for fan‑out and merge, and a write cost for replication.

Design the topology to the workload. Pick a shard count that matches expected parallelism without creating many tiny shards. Use `replication_factor=2` or more for availability and tune `write_consistency_factor` for durability. When locality matters, choose a custom shard key like tenant or user so related data stays together and caches work in your favor.

## Capacity planning, end to end

Start with memory math and validate with a sample. A 768‑dimensional float32 vector is about 3 KB (768 × 4 bytes). One hundred million points is roughly 307 GB of raw vectors. Moving to float16 halves that to ~153 GB. The HNSW graph adds overhead that depends on `m`, `payload_m`, and segment sizes - plan 0.5×–1.5× on top, then measure with your real embeddings. If payloads are large, move them to disk to keep RAM for vectors and the graph.

Turn the estimate into a plan. If the total fits with headroom, scale up. If not, shard across nodes so each shard keeps its vectors and index hot in memory. Keep shards large enough to amortize index and optimizer work, but not so large that any single shard becomes the bottleneck. Finally, size for concurrency and recall - higher `ef` improves recall at a CPU cost; complex filters add CPU and memory access cost. In a distributed setup, provision CPU and network so fan‑out does not dominate tail latency.

## Reading the signals

Production gives you clear pointers: shrinking RAM headroom, page‑fault spikes with mmap, or CPU parked above 80% while p95 rises are all signs to act. If `indexed_vectors_count` lags behind `points_count` outside bulk loads, revisit indexing thresholds and segment sizes. If writes slow under higher replication, tune consistency or adjust placement. Those observations tell you whether to pick a larger node or to add shards and replicas.

## Takeaways

Scale up until you hit a clear ceiling - prefer RAM, then CPU, then SSD. Scale out when data or traffic exceed one node or when you need availability. Use datatypes and quantization to reduce memory before adding nodes. Plan shards and replicas to match parallelism and failure domains, then tune indexes and segments to the real workload profile. 