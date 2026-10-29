---
title: Vertical Scaling
short_description: "Scale Qdrant by increasing CPU, RAM, or disk on existing nodes, with RAM sizing guidelines and signs it's time to scale horizontally instead."
description: "Learn when and how to scale Qdrant vertically by resizing node resources, including RAM sizing, Qdrant Cloud and self-hosted resize steps, and the signals that mean it's time to scale horizontally instead."
weight: 5
---

# Vertical Scaling

Vertical scaling means resizing CPU, RAM, or disk on an existing node. It's simpler than horizontal scaling, avoids distributed system complexity, and is reversible, which makes it the recommended first step whenever a single node's resources are the bottleneck.

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

The resize runs as a rolling restart. If your collections have a replication factor of two or higher, the restart completes with no downtime, since other replicas keep serving traffic while each node restarts in turn. Set replication factor to two or higher before resizing if you need to avoid downtime.

Scaling up is generally safe. Scaling down needs more care: if your working set no longer fits in RAM after downsizing, performance degrades severely due to cache eviction. Load test before scaling down.

## How to Scale Vertically Self-Hosted

For self-hosted deployments, resize the underlying VM or container resources directly, then restart the affected nodes. If your collections have a replication factor of two or higher, you can resize nodes one at a time without downtime.

## RAM Sizing Guidelines

RAM is the resource that most directly affects Qdrant's search performance, since search is fastest when vectors and indexes fit in memory.

How much RAM a collection needs depends on its vector dimensions and datatype, quantization, the replication factor, and which structures you keep in RAM with [memory tiers](/documentation/ops-configuration/memory-tiers/). To estimate it, follow [Capacity Planning](/documentation/capacity-planning/#calculating-ram-and-disk-size), which sizes each structure separately. To turn the cluster total into RAM per node, see [Node Count](/documentation/capacity-planning/#node-count).

Monitor actual memory usage before and after resizing. See [Monitor Collection Memory Usage](/documentation/ops-monitoring/memory-usage/).

## When Vertical Scaling Is No Longer Enough

These signals mean it's time to scale horizontally instead of resizing further:

- Your data volume exceeds what a single node can hold, even with quantization.
- CPU on your largest available node size is already maxed out with unacceptable query latency.
- Disk I/O is saturated. Adding nodes gives you more independent disk throughput.
- You need fault tolerance, which requires replicating data across nodes.

When you hit these limits, see [Horizontal Scaling](/documentation/scaling/horizontal-scaling/) and [Distributed Deployment](/documentation/scaling/distributed_deployment/) for how to scale out.

## Best Practices

- Load test before scaling down RAM. Cache eviction after downsizing can cause a latency regression.
- Keep RAM usage below 80%. Memory pressure in Qdrant causes a performance cliff, not a gradual slowdown.
- Set the replication factor to two or higher before resizing in Qdrant Cloud. A rolling restart without replicas causes downtime.
- Diagnose the bottleneck before adding CPU. Workloads bound on disk I/O won't improve from additional cores.
