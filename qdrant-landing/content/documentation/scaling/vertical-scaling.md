---
title: Vertical Scaling
short_description: "Scale Qdrant by increasing CPU, RAM, or disk on existing nodes, with RAM sizing guidelines and signs it's time to scale horizontally instead."
description: "Learn when and how to scale Qdrant vertically by resizing node resources, including RAM sizing formulas, Qdrant Cloud and self-hosted resize steps, and the signals that mean it's time to scale horizontally instead."
weight: 5
---

# Vertical Scaling

Vertical scaling means increasing CPU, RAM, or disk on your existing Qdrant nodes rather than adding more nodes. It's simpler than horizontal scaling, avoids distributed system complexity, and is reversible, which makes it the recommended first step whenever a single node's resources are the bottleneck.

## When to Scale Vertically

Scale vertically when your current node resources are insufficient but your workload doesn't yet require distribution:

- RAM usage is approaching 80% of available memory. Beyond this threshold, the operating system starts evicting pages from cache, which causes a sharp performance drop rather than a gradual one.
- CPU is saturated during query serving or indexing.
- Disk space is running low for on-disk vectors and payloads.
- Your workload is non-production or otherwise tolerant of a single point of failure.

A single node can typically hold up to about 100 million vectors, depending on vector dimensionality and whether quantization is enabled.

## How to Scale Vertically in Qdrant Cloud

Vertical scaling in Qdrant Cloud is managed through the [Cloud Console](https://cloud.qdrant.io/):

1. Select the cluster you want to resize.
2. Choose a larger node configuration, increasing CPU, RAM, or both.
3. Confirm the resize.

The resize runs as a rolling restart. If your collections have a `replication_factor` of two or more, the restart completes with no downtime, since other replicas keep serving traffic while each node restarts in turn. Set `replication_factor` to two or more before resizing if you need to avoid downtime.

Scaling up is generally safe. Scaling down needs more care: if your working set no longer fits in RAM after downsizing, performance degrades severely due to cache eviction. Load test before scaling down.

## How to Scale Vertically Self-Hosted

For self-hosted deployments, resize the underlying VM or container resources directly, then restart the affected nodes. The same rolling-restart guidance applies: a `replication_factor` of two or more lets you resize nodes one at a time without downtime.

## RAM Sizing Guidelines

RAM is the resource that most directly affects Qdrant's search performance, since search is fastest when vectors and indexes fit in memory.

Exact RAM usage is difficult to predict precisely, but this formula gives a reasonable estimate for full-precision vectors kept in RAM:

```text
num_vectors * dimensions * 4 bytes * 1.5
```

Quantization reduces this significantly:

- Scalar quantization (INT8) divides the estimate by about 4.
- Binary quantization divides the estimate by about 32.

On top of the vector data itself, budget for the HNSW index, which typically adds 20% to 30% overhead, along with payload indexes and the write-ahead log. Reserve about 20% headroom for optimizer operations and operating system cache. See [Quantization](/documentation/manage-data/quantization/) for the tradeoffs between quantization methods, and monitor actual memory usage with Prometheus and Grafana before and after resizing (see [Monitoring & Telemetry](/documentation/ops-monitoring/)).

## When Vertical Scaling Is No Longer Enough

These signals mean it's time to scale horizontally instead of resizing further:

- Your data volume exceeds what a single node can hold, even with quantization.
- Disk I/O is saturated, since adding nodes gives you more independent disk throughput.
- You need fault tolerance, which requires replicating data across nodes.
- You need to isolate tenants onto dedicated shards.
- CPU on your largest available node size is already maxed out with unacceptable query latency.

When you hit these limits, see [Horizontal Scaling and Resilience](/documentation/scaling/horizontal-scaling/) and [Distributed Deployment](/documentation/scaling/distributed_deployment/) for how to scale out.

## What Not to Do

- Don't scale down RAM without load testing first. Cache eviction can cause a latency regression that persists for days.
- Don't ignore the 80% RAM threshold. Memory pressure in Qdrant causes a performance cliff, not a gradual slowdown.
- Don't skip replication before resizing in Qdrant Cloud. A rolling restart without replicas causes downtime.
- Don't assume more CPU always helps. Workloads bottlenecked on disk I/O won't improve from additional cores.
