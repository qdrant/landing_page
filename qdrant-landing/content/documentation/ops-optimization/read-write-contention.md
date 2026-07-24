---
title: Read-Write Contention
short_description: "Tune Qdrant under continuous ingestion to reduce optimizer contention and keep query latency low."
description: "A step-by-step guide to reducing read-write contention in Qdrant when the background optimizer competes with search queries under continuous write load."
weight: 15
---

# Troubleshoot Read-Write Contention

Qdrant is designed to index and optimize data as it arrives. While serving search queries, Qdrant's [background optimizer](/documentation/ops-optimization/optimizer/) continuously builds [HNSW indexes](/documentation/manage-data/indexing/#vector-index), merges segments, and applies quantization. Queries and the background optimizer compete for the same CPU time, memory bandwidth, and I/O (read-write contention). Qdrant's defaults don't prioritize either, but you can make several configuration changes to shift the balance.

This guide walks through a set of configuration changes to improve read latency under heavy write load. The steps are ordered by impact: start with step 1 and stop when your latency target is met. After each step, measure read latency and write throughput. If a change doesn't improve latency enough or causes unacceptable throughput loss, revert it and move to the next step.

## Step 1: Prevent Reads from Large Unindexed Segments

*Requires Qdrant v1.17.1 or later. `prevent_unoptimized` is an experimental feature.*

Under heavy write load, the optimizer can fall behind. When that happens, searches need to perform a full scan over large unindexed segments, which increases query latency. The [`prevent_unoptimized` setting](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments) addresses this. Set it to `true` to prevent searching over unindexed data.

Enable this setting per collection or globally in the configuration file.

{{< code-snippet path="/documentation/headless/snippets/update-collection/prevent-unoptimized/" >}}

### Set `wait=false` on All Write Requests

Several Qdrant clients (Python, TypeScript, JavaScript, .NET, and Java) default to setting the [`wait` parameter](/documentation/manage-data/points/#awaiting-result) to true on write requests. This makes writes synchronous: the write request returns only after the update has been applied and is visible in search results.

Enabling `prevent_unoptimized` changes the semantics of `wait=true`: it waits until every deferred point, including the current update and all preceding deferred points, has been indexed. Under continuous writes, this can take a long time and will likely cause client-side timeouts.

Worse, a blocked `wait=true` request delays all subsequent `wait=true` updates behind it: head-of-line blocking that can stall the entire update pipeline.

**[Set `wait=false` on all write requests when `prevent_unoptimized` is enabled.](/documentation/ops-optimization/optimizer/#effect-on-waittrue)**

For clients that default to `wait=true`, you'll need to override this explicitly. The Go and Rust clients and the REST API already default to `wait=false`.

## Step 2: Try Smaller Batch Sizes

When ingesting data into Qdrant, batching upserts is a best practice that significantly improves throughput by reducing the per-request overhead of individual insertions. The optimal batch size depends on your vector dimensions, payload size, and hardware.

Reducing batch size shortens each individual write operation, which tightens the window of contention with reads. The tradeoff is more round trips to Qdrant, which adds a small amount of network overhead.

A smaller batch size is especially worth trying when your payloads are large. A batch of 100 points with 10 KB payloads each is a much heavier write than the same number of points with minimal payload: it takes longer to process and consumes more memory during the transaction.

**Start by halving your current batch size** and measure the effect on read latency and write throughput. If latency improves without unacceptable throughput loss, halve again.

## Step 3: Lower the Optimizer's CPU Budget

By default, Qdrant auto-selects the number of CPU threads the optimizer can use, typically leaving one or two cores free and giving the rest to the optimizer. Under write pressure, this can leave little headroom for queries. Use the `optimizer_cpu_budget` setting to lower the optimizer's CPU budget.

`optimizer_cpu_budget` is a node-level setting in the Qdrant configuration file, under `performance`:

```yaml
performance:
  # If positive, use exactly this many CPU threads for optimization.
  # If negative, subtract from available CPUs.
  # If 0, auto-select (default).
  optimizer_cpu_budget: 2
```

On Qdrant Cloud, it's available under **Advanced Optimizations** in the cluster **Configuration** tab.

A good starting point is **50% of your available vCPUs**. On an eight-vCPU node, that's four threads for the optimizer and four for queries. On a 16-vCPU node, set it to eight.

Tune from there. If indexing falls too far behind ([watch the deferred point count](/documentation/ops-optimization/optimizer/#monitoring-deferred-points)), increase the budget. If query latency is still too high, lower it further.

Because this is a node-level setting, it requires a rolling restart to take effect: after applying the configuration change, restart one node at a time.

## Step 4: Tune the Number of Optimizer Threads

Two settings give you finer control over optimizer CPU usage than `optimizer_cpu_budget` alone. They work at different levels:

* **`max_optimization_threads`**: The maximum number of optimization jobs that can run in parallel per shard. Defaults to `null` (no limit; saturates available CPU).
* **`max_indexing_threads`**: The number of threads each optimization job uses to build the HNSW index. Defaults to `0` (auto-select).

The total CPU consumed by indexing on a shard is roughly `max_optimization_threads × max_indexing_threads`. Reducing either value leaves more headroom for queries.

### Recommended Starting Point

Set `max_optimization_threads` to `1` per shard. This serializes optimization work rather than running multiple jobs in parallel, which smooths out CPU spikes and makes optimizer resource usage more predictable.

Configure it per collection without needing a restart:

{{< code-snippet path="/documentation/headless/snippets/update-collection/max-optimization-threads/" >}}

Keep `max_indexing_threads` below 16. If your node has fewer than eight cores, leave it at `0` and let Qdrant auto-select.

{{< code-snippet path="/documentation/headless/snippets/update-collection/max-indexing-threads/" >}}

### Relationship to `optimizer_cpu_budget`

`optimizer_cpu_budget` (step 3) sets the node-wide CPU ceiling for all optimizer work. `max_optimization_threads` and `max_indexing_threads` control how that budget is distributed across jobs and shards. Use Step 3 to cap the total, and Step 4 to shape how work is scheduled within that cap.

## Step 5: Use Delayed Fan-Outs

*Requires replicas. Available as of v1.17.0.*

This step applies only if your collection has a replication factor greater than one. If you're running without replicas, skip to step 6.

Under write pressure, some replicas may respond slower than others. They may be catching up on indexing, flushing to disk, or be under heavier load. When a single slow replica raises your 95th or 99th percentile latency, that's tail latency: one outlier that degrades the experience for a small but visible fraction of requests.

The [`read_fan_out_delay_ms` setting](/documentation/search/low-latency-search/#use-delayed-fan-outs) addresses this. When set, if a replica hasn't responded within the specified threshold, Qdrant sends the same read request to a second replica and uses whichever response comes back first. The slow replica still processes its request, but its response is discarded if the other replica responds faster.

Enable it per collection:

{{< code-snippet path="/documentation/headless/snippets/update-collection/read-fan-out-delay-ms/" >}}

Replace `100` with your collection's measured p95 read latency.

### Choosing a Threshold

Set the threshold to the **95th percentile of your current read latency**. This means roughly 5% of requests trigger a fan-out, adding only a small amount of extra load while mitigating the worst of the tail. Setting it too low (for example, at the median) causes almost every request to fan out, doubling read load without meaningful benefit.

To disable, set `read_fan_out_delay_ms` back to `0`.

## Step 6: Try Async I/O

*Linux only. Requires kernel support.*

If your vectors or HNSW index are on disk, enabling the [async scorer](/articles/io_uring/) can reduce the time Qdrant spends waiting on disk reads. By default, Qdrant reads vectors synchronously: it sends a request, waits for the response, then sends the next. With Async I/O enabled, it batches disk requests and waits for them in parallel, saturating disk bandwidth instead of leaving it idle between reads.

This is most relevant during rescoring: when Qdrant retrieves candidate vectors from disk to rerank results, async I/O allows it to fetch all of them concurrently rather than one by one.

Enable it in the config file by setting `async_scorer` to `true`:

```yaml
storage:
  performance:
    async_scorer: true
```

Or via an environment variable:

```bash
QDRANT__STORAGE__PERFORMANCE__ASYNC_SCORER=true
```

On Qdrant Cloud, it's available under **Advanced Optimizations** in the cluster **Configuration** tab.

If your data is entirely in memory, this setting has no effect. And because it relies on `io_uring`, it only works on Linux with a kernel that supports it. Verify kernel support before enabling in production.

## Step 7: Lower the Maximum Segment Size

<aside role="status">
Lowering the maximum segment size <b>can reduce query throughput</b>. This is a deliberate tradeoff: improved read latency under write load at the cost of overall query throughput.
</aside>

Qdrant builds an [HNSW index](/documentation/manage-data/indexing/#vector-index) per segment. By default, `max_segment_size` is auto-selected based on available CPUs, which tends to favor large segments: better for query throughput but slower to index. Under heavy write load, a large segment takes longer to rebuild, meaning the optimizer holds onto CPU and I/O for longer stretches, increasing contention with queries.

The `max_segment_size` setting caps how large a segment can be after the optimizer merges and indexes it. Smaller segments rebuild faster, returning CPU to queries sooner. The tradeoff is that more segments mean more work per query: each search fans out across all segments, so query throughput decreases.

Configure it per collection, specified in KB:

{{< code-snippet path="/documentation/headless/snippets/update-collection/max-segment-size/" >}}

As a reference point: 1 KB ≈ one vector of 256 dimensions. A value of `100000` (roughly 100 MB) is a reasonable starting point for collections with high write rates. Tune downward if indexing jobs are still too long, and upward if query throughput degrades noticeably.

## Step 8: Scale Horizontally with Replicas

The previous steps all operate within a fixed hardware budget: they reallocate CPU between the optimizer and queries. If you've exhausted those options and latency is still too high, the answer is more capacity.

[Adding nodes to your cluster](/documentation/distributed_deployment/) and increasing the replication factor distributes read traffic across more peers. Because every replica of a shard contains the same data, Qdrant can route read requests to any of them. More replicas mean more vCPUs available to serve queries, and the optimizer on each node only contends with the query load that node carries instead of the full cluster load.

For example, a collection with three shards and a replication factor of two has six replicas total. On a three-node cluster, each node handles two replicas. A read request hits one replica per shard, so query load is spread evenly across all three nodes.

The tradeoff is cost and write latency. Every write must be replicated to all replicas of a shard before it's acknowledged, so a higher replication factor increases write latency. Adding nodes also means more hardware to provision and operate. Find the balance that fits your latency budget and write throughput requirements.

## Step 9: Scale Vertically

Like Step 8, this step adds capacity rather than reallocating it. Where horizontal scaling distributes load across more nodes, vertical scaling gives each node more resources to work with.

**CPU.** More vCPUs mean the optimizer and queries share a larger pool. The ratios from Steps 3 and 4 still apply, but with 32 vCPUs instead of eight, even a 25% optimizer budget leaves more absolute cores for queries. Vertical CPU scaling amplifies the effect of the tuning you've already done.

**RAM.** This is often the highest-leverage upgrade. When vectors and the HNSW index are [loaded](/documentation/ops-configuration/memory-tiers/) in RAM, disk I/O drops out of the picture: the optimizer and queries no longer compete for it. If you're currently keeping vectors in the `cold` tier because your dataset outgrew RAM, adding memory may let you move them to the `cached` tier and eliminate a whole class of contention.

**Input/Output Operations per Second (IOPS).** If vectors or the HNSW index are stored on disk, disk throughput is a shared resource between the optimizer and queries. The optimizer continuously reads and writes segment data: merging segments, flushing the write-ahead log, and rebuilding indexes. Higher IOPS lets it complete that work faster, shortening the window of I/O contention.

## Read More

- [Optimizer](/documentation/ops-optimization/optimizer/) covers all optimizer settings referenced in this guide, including how to monitor deferred points.
- [Low-Latency Search](/documentation/search/low-latency-search/) covers delayed fan-outs and other techniques for reducing search latency.
- [Qdrant under the Hood: io_uring](/articles/io_uring/) explains how async I/O works in Qdrant.
- [Distributed Deployment](/documentation/distributed_deployment/) covers horizontal scaling with shards and replicas.
- [Bulk Operations](/documentation/tutorials-develop/bulk-upload/) covers best practices for high-throughput ingestion.
