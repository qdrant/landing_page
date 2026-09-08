---
title: "Sizing and Capacity Planning for Qdrant"
description: "How to size RAM, shards, and nodes for Qdrant on your own Kubernetes cluster, and when to scale vertically versus horizontally."
social_preview_image: /articles_data/sizing-and-capacity-planning/social_preview.jpg
preview_dir: /articles_data/sizing-and-capacity-planning/preview
author: Clelia Bertelli
author_link: https://qdrant.tech
date: 2026-09-08T00:00:00+00:00
draft: false
keywords:
  - scaling
  - kubernetes
  - resource estimation
  - private cloud
  - hybrid cloud
category: production-ops
---

Running Qdrant on your own Kubernetes cluster, whether through Hybrid Cloud or Private Cloud, puts the sizing decisions in your hands: you need to choose the node shapes, the shard count, and when to add capacity. 

Getting those choices wrong might result either in high costs for oversized resource allocations or in a cluster slowdown under a workload it could have handled with a different layout.

This guide offers guidance for those decisions: how to estimate RAM before you provision anything, how quantization changes that estimate, how many shards to start with, how to efficiently approach multitenancy, and which scaling lever to pull for a given symptom.

## Is Your Cluster Enough?

None of the sizing discussed below matters if the underlying Kubernetes cluster isn't set up for it. Before estimating anything or applying any modification, confirm with your Hybrid Cloud or Private Cloud environment that:

- Your CSI driver's StorageClass supports volume expansion, which vertical disk scaling depends on.
- Your CSI driver supports CSI volume snapshots, which backups and restores depend on.
- Node pools have the CPU and memory headroom the pod's resource requests need, since Kubernetes reserves some capacity for the kubelet and system daemons on every node.

You configure node placement for Qdrant's database pods, including node selectors, tolerations, and topology spread constraints, in the Kubernetes Configuration section during cluster creation or later on the [cluster detail page](https://qdrant.tech/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/).

## Estimate RAM Before You Provision

Qdrant stores vectors as 32-bit floats by default, so a single number costs 4 bytes and a 512-dimensional vector costs 2 KB before any overhead. Add the HNSW graph on top, and Qdrant's own rule of thumb for total memory is:

```text
memory_size = 1.5 * number_of_vectors * vector_dimension * 4 bytes
```

The 1.5x multiplier covers the graph overhead, but does not take into account payloads or write-ahead log storage, so you should treat it as a floor rather than a final number.

[Quantization](/documentation/manage-data/quantization/ ) changes that formula directly, because it changes how many bytes each vector needs:

| Method | Compression | What it costs you |
|---|---|---|
| Scalar (int8) | Up to 4x | Minimal accuracy loss, up to 2x faster search |
| TurboQuant | Up to 32x, tunable by bit depth | Works with any embedding distribution; queries stay full precision |
| Binary | Up to 32x | Needs a centered vector distribution and works best with tested embedding models |
| Product | Up to 64x | The largest accuracy loss of the three |

Qdrant 1.18 added [TurboQuant](/articles/turboquant-quantization/), a rotation-based quantization method from Google Research. It rotates each vector before compression, spreading the information evenly across coordinates, which makes it work well on any embedding distribution, including ones where binary quantization struggles. Queries are still scored at full precision. Its default 4-bit setting lands close to scalar quantization on recall, at roughly twice the compression.

TurboQuant still keeps a full-precision copy on disk for rescoring, so it adds a second copy of every vector. Qdrant 1.19 introduced [`turbo4`](/documentation/manage-data/vectors/#turbo4) for when that second copy isn't worth the space: it stores only the 4-bit representation, no float32 copy at all, a ninefold reduction in storage. The tradeoff is no rescoring against the original vectors (thus lower recall). Reach for it when disk is the binding constraint, especially on [multi-vector, ColBERT-style](/documentation/tutorials-search-engineering/turbo4-multivector-search/) collections.

A single node can hold roughly 100 million vectors, depending on dimensionality and whether quantization is enabled. RAM usage climbing toward 80% of available memory is the signal to [resize](/documentation/scaling/vertical-scaling/): past that point, the operating system starts evicting pages from cache, and the performance drop will be sharp and noticeable (no gradual degradation).

## Pick a Futureproof Shard Count

[Shards](/documentation/scaling/horizontal-scaling/#sharding) are the unit Qdrant distributes across nodes, and you can only select the shard count once (at collection creation): modifications through the standard [Collections Update API](/documentation/manage-data/collections/#update-collection) have no effect on it. A shard can't be split across nodes, so a two-shard collection can never use more than two nodes no matter how many you add.

![Same six nodes, two shard-count plans](/articles_data/sizing-and-capacity-planning/visuals/shard-ceiling-mechanism.png)

The general advice is to always create at least two shards per node so the cluster can grow without resharding, since resharding can be an expensive operation that might degrade the performance of your cluster, and is only available in Qdrant Cloud deployment modes. 

If you expect significant data growth, 12 shards is a common starting point, since it divides evenly from 1 node up to 2, 3, 6, and 12.

Hybrid Cloud and Private Cloud both run the same Qdrant Operator that Managed Cloud uses, so both get [resharding](/documentation/cloud/cluster-scaling/#resharding), automatic shard [rebalancing](/documentation/cloud/configure-cluster/#shard-rebalancing), and replica management without you having to script the shard-drain-and-rejoin sequence yourself.

![A node joins, shards move on their own](/articles_data/sizing-and-capacity-planning/visuals/shard-rebalancing-mechanism.png)

## Scale Vertically First

Vertical scaling, adding CPU, RAM, or disk to existing nodes, is the simpler move and the one to reach for first. It avoids the network overhead of a distributed layout and is easy to reverse. Scale vertically when:

- RAM usage is approaching 80% of available memory.
- CPU is saturated during query serving or indexing.
- Disk space is running low for on-disk vectors and payloads.

When you already have more than one node, the resize runs as a rolling restart: each node restarts in turn while the others keep serving traffic. That's zero downtime only if [`replication_factor` is 2 or higher](/documentation/scaling/distributed_deployment/#replication-factor), so other replicas can cover for the node that's currently down. On any collection without replication you should expect a short downtime window during the resize. 

Disk can be expanded online, provided your Kubernetes CSI driver and storage class support volume expansion, but it can't be shrunk afterward, because of block storage limitation on most cloud providers.

Move to horizontal scaling once your data no longer fits on your current node budget, even with quantization applied, or once you're bottlenecked on disk I/O.

## Tailor the Fix to the Symptom

Different bottlenecks call for different fixes, and reaching for the wrong one might end up wasting money and time.

**Growing data volume.** Try quantization and moving cold vectors to disk before adding nodes. If the collection still doesn't fit, add nodes and let the shard count you planned for absorb the growth.

**Disk space is the constraint, not RAM or CPU.** Reach for `turbo4` before adding storage or nodes, especially on multi-vector collections. It stores each dimension as 4 bits with no float32 copy, a ninefold reduction over keeping both, at the cost of not being able to rescore against full-precision vectors. If you need that rescoring for recall, use TurboQuant quantization with full-precision storage instead.

**Rising queries per second.** Each replica of a shard can serve read requests independently, so more peers plus a higher `replication_factor` spreads read load across more hardware. That only pays off behind a load balancer, though: a client hitting one node directly gets served from that node's local replicas alone, leaving every other replica idle, so you pay the storage and write cost of replication without gaining any read throughput.

It is also worth noting that replication isn't free: it increases storage, resource usage and write traffic, so you should always consider the tradeoffs before adopting it for your cluster.

**Rising latency on filtered queries.** Compare filtered against unfiltered latency on the same query. A large gap points to a missing payload index rather than a resourcing problem, and adding nodes won't fix it.

## Not Every Sizing Problem Is a Resource Problem
 
Everything we've seen up to now comes down to managing disk, RAM and CPU, but some sizing problems are more about data modeling than system resources.

Multitenancy is a perfect example: if you get the data model wrong, no amount of available resources in your system will fix it.
 
Your instinct might be to give each tenant its own collection, since that's the cleanest isolation boundary, but that is very hard scale. Every collection carries fixed overhead, from its own HNSW index and payload indexes to its own set of shards and replicas, and that overhead is paid per collection regardless of how small the tenant is. 

Qdrant Cloud deployment modes cap clusters at 1,000 collections by default, and in practice performance degrades well before you approach that ceiling, since the cluster is managing thousands of small indexes instead of a few large, efficient ones.

![Isolation boundary versus per-tenant overhead](/articles_data/sizing-and-capacity-planning/visuals/multitenancy-mechanism.png)
 
The fix is a single collection per use case, with tenants logically partitioned by a payload field and an index on that field, rather than by collection boundary. This keeps per-tenant overhead close to zero: a new tenant is just a new value in an indexed field, not a new set of data structures for the cluster to maintain. 

For tenants that outgrow that shared setup, typically past around 20,000 points, you can apply [tiered multitenancy](/documentation/manage-data/multitenancy/#tiered-multitenancy): promote them to their own dedicated shard, which restores physical isolation without giving up the shared-collection model for everyone else.
 
## Next Steps

The formulas above get you a reasonable starting point, but they're not an absolute guarantee. Validate them against your own vector count, dimensionality, and query patterns before committing to a node size, and revisit them as you scale.

Here are some related readings you should consider going through next:

- [Scaling & Resilience](/documentation/scaling/)
- [Multitenancy](/documentation/manage-data/multitenancy/)
- [Quantization](/documentation/manage-data/quantization/)
