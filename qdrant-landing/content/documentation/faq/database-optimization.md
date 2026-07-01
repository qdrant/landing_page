---
title: Database Optimization
short_description: "Answers to common Qdrant optimization questions: reducing memory usage, sizing hardware, on-disk storage, and resolving slow queries."
description: "FAQ on optimizing Qdrant: cut memory with quantization and on-disk storage, size machines correctly, and diagnose slow queries with payload indexing."
weight: 2
---

# Frequently Asked Questions: Database Optimization 

### How do I reduce memory usage?

The primary source of memory usage is vector data. There are several ways to address that:

- Configure [Quantization](/documentation/manage-data/quantization/) to reduce the memory usage of vectors.
- Configure on-disk vector storage

The choice of the approach depends on your requirements.
Read more about [configuring the optimal](/documentation/ops-optimization/optimize/) use of Qdrant.

### How do you choose the machine configuration?

There are two main scenarios of Qdrant usage in terms of resource consumption:

- **Performance-optimized** -- when you need to serve vector search as fast (many) as possible. In this case, you need to have as much vector data in RAM as possible. Use our [calculator](https://cloud.qdrant.io/calculator) to estimate the required RAM.
- **Storage-optimized** -- when you need to store many vectors and minimize costs by compromising some search speed. In this case, pay attention to the disk speed instead. More about it in the article about [Memory Consumption](/articles/memory-consumption/).

### I configured on-disk vector storage, but memory usage is still high. Why?

Firstly, memory usage metrics as reported by `top` or `htop` may be misleading. They are not showing the minimal amount of memory required to run the service.
If the RSS memory usage is 10 GB, it doesn't mean that it won't work on a machine with 8 GB of RAM.

Qdrant uses many techniques to reduce search latency, including caching disk data in RAM and preloading data from disk to RAM.
As a result, the Qdrant process might use more memory than the minimum required to run the service.

> Unused RAM is wasted RAM

If you want to limit the memory usage of the service, we recommend using [limits in Docker](https://docs.docker.com/config/containers/resource_constraints/#memory) or Kubernetes.

### My search latency increases under heavy write load. What should I do?

Qdrant's background optimizer runs continuously, building HNSW indexes, merging segments, and applying quantization, while also serving search queries. Under heavy write load, the optimizer and queries compete for the same CPU, memory, and I/O. Here are the main levers to reduce that contention, ordered by impact:

- **Prevent reads from large unindexed segments.** Enable [`prevent_unoptimized`](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments) to block searches over data that hasn't been indexed yet. When you do, also set `wait=false` on all write requests to avoid head-of-line blocking.
- **Try smaller batch sizes.** Smaller batches shorten each write transaction, tightening the window during which it contends with reads.
- **Lower the optimizer's CPU budget.** Use `optimizer_cpu_budget` to cap how many cores the optimizer can use, reserving more headroom for queries. A good starting point is 50% of available vCPUs.
- **Tune optimizer threads.** Set `max_optimization_threads` to `1` per shard to serialize optimizer work and smooth out CPU spikes.
- **Use delayed fan-outs.** If your collection has replicas, set `read_fan_out_delay_ms` to your p95 read latency so slow-replica requests automatically retry against a faster one.
- **Scale out.** If you've exhausted per-node tuning, adding replicas or upgrading to a node with more RAM (so vectors fit in memory) removes entire classes of contention.

For a full step-by-step walkthrough, see [Troubleshoot Read-Write Contention](/documentation/ops-optimization/read-write-contention/).

### My requests are very slow or time out. What should I do?

There are several possible reasons for that:

- **Using filters without payload index** -- If you're performing a search with a filter but you don't have a payload index, Qdrant will have to load whole payload data from disk to check the filtering condition. Ensure you have adequately configured [payload indexes](/documentation/manage-data/indexing/#payload-index).
- **Usage of on-disk vector storage with slow disks** -- If you're using on-disk vector storage, ensure you have fast enough disks. We recommend using local SSDs with at least 50k IOPS. Read more about the influence of the disk speed on the search latency in the article about [Memory Consumption](/articles/memory-consumption/).
- **Large limit or non-optimal query parameters** -- A large limit or offset might lead to significant performance degradation. Please pay close attention to the query/collection parameters that significantly diverge from the defaults. They might be the reason for the performance issues.