---
title: "Memory Tiers in Qdrant: What to Use and When"
short_description: "Guidance on choosing a Qdrant memory tier layout, backed by benchmarks from 1.8M to 9.5M points."
description: "Which Qdrant memory tier layout to use and why, backed by benchmarks scaling from 1.8M to 9.5M points."
social_preview_image: /articles_data/memory-tiers-in-qdrant-what-to-use-and-when/preview/social_preview.jpg
preview_dir: /articles_data/memory-tiers-in-qdrant-what-to-use-and-when/preview
author: Clelia Bertelli
author_link: https://qdrant.tech
date: 2026-08-14T10:00:00+02:00
draft: false
keywords:
  - memory tiers
  - caching
  - disk
  - scaling
  - benchmark
category: production-ops
weight: 8
---

A growing vector collection eventually outgrows the RAM it started with: Qdrant handles that by letting you assign dense vectors, the HNSW graph, quantized vectors, payloads, and payload indexes each to whichever memory tier that structure supports, instead of forcing one RAM-versus-disk trade-off onto the whole collection.

Qdrant's [memory tiers documentation](/documentation/ops-configuration/memory-tiers/) already describes those tiers qualitatively. To put numbers on the trade-offs, we built a benchmark harness:

- **Data.** MS MARCO passage embeddings, replaying the same 1,677-query search benchmark against every layout.
- **Hardware.** A local baseline on a single 14-core node with 32 GB of RAM, then three Qdrant Cloud runs, first on an 8-vCPU, 32 GB cluster, then on a 64 GB cluster once the dataset outgrew the smaller one.
- **Scale.** Five tier layouts, each measured at 1.8 million points locally, then at 3.8 million, 5.6 million, and 9.5 million points on Qdrant Cloud.

## How Qdrant's Memory Tiers Work

RAM is fast and expensive, disk is slow and cheap, and a growing collection outgrows its RAM budget long before it outgrows its disk budget. Qdrant gives you three tiers to manage that trade-off:

- **Pinned.** Lives on the heap and never gets evicted, so access is always fast.
- **Cached.** Memory-mapped and pre-warmed into the OS page cache at startup, so it starts fast too, but the OS can push it out under memory pressure.
- **Cold.** Also memory-mapped, without the pre-warming, so the first read of any page comes from disk.

Not every structure supports every tier: dense vectors and payloads can't be pinned, and sparse vector structures follow their own rules. For the full breakdown, see the [memory tiers documentation](/documentation/ops-configuration/memory-tiers/).

![Qdrant's three memory tiers, pinned, cached, and cold, and how each relates to RAM and disk](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/memory-tiers-visual.png)

Quantization is one of the main tools that makes the cold and pinned tiers practical at real scale. Compressing vectors to int8 or lower shrinks them enough to fit a small, fixed amount of RAM. A search can then score most candidates against that compressed copy instead of paging in the full-precision ones.

Every layout in this piece uses scalar quantization, which compresses vectors to int8. Qdrant does not rescore against the original vectors by default for scalar quantization, and this benchmark leaves that default in place. So the numbers below reflect quantized-only search rather than a rescored one.

Rescoring is on by default only for binary quantization and low-precision TurboQuant.

## How We Tested Memory Tiers

The local round measured every preset right after upload, so cold-tier presets started from a genuinely empty page cache rather than a warmed one: the realistic worst case for a freshly restored collection, not its long-run steady state. The three cloud rounds then tracked the same five presets as the dataset, and eventually the cluster, grew.

The five layouts we tested each combined the three memory tiers with quantization differently:

1. **Full Cached, No Quantization.** Dense vectors and the HNSW graph both cached.
2. **Full Cached, With Quantization.** The same, plus a compressed copy of the vectors also cached, overriding Qdrant's default of pinning that copy instead.
3. **Full Cold, No Quantization.** Dense vectors and the graph both memory-mapped without pre-warming.
4. **Full Cold, With Quantization.** The cold tier, plus a compressed copy that's also left cold, matching Qdrant's own default for that combination.
5. **Pinned Quantized Vectors.** Dense vectors kept cold, but the compressed copy explicitly pinned in RAM. This is the layout Qdrant's optimization docs recommend for high-speed search with a low memory footprint.

Here's how the five layouts compare on paper:

![Tradeoffs, on paper, for the five memory presets used in this article](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/tradeoffs-on-paper.png)

Four of the five layouts leave their memory cost up to the OS: how much of that expected footprint actually stays resident depends on what else is competing for RAM. **Only Pinned Quantized Vectors turns its footprint into a guarantee.**

## Pin Quantized Vectors for Predictability

Pin the compressed copy once a collection is large enough that RAM headroom, not raw speed, becomes the binding constraint. Pinned Quantized Vectors is the only layout of the five we tested whose memory cost is a fixed reservation rather than something the OS negotiates on the fly.

That property is what kept it safe across every dataset and cluster size in this benchmark, while every other layout eventually hit a point where the OS ran out of slack to give it.

At 9.5 million points, Pinned Quantized Vectors **tied Full Cached, No Quantization on raw search speed while using about a third of its memory footprint**. A few million points earlier, at 5.6 million, the comparison looked different: Full Cached, With Quantization and Full Cold, No Quantization had both spiked toward the cluster's memory ceiling, while Pinned Quantized Vectors' footprint barely moved.

![Mean latency versus memory footprint for five memory-tier presets at 9.5 million points; Pinned Quantized Vectors matches the fastest preset's speed while using about one third of the total memory footprint](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/charts/efficiency-corner.png)

<aside role="status">A fixed memory reservation stays safe as a collection grows. A footprint the OS negotiates on the fly only stays safe as long as there's slack in the cluster's RAM, and that slack might run out when scaling the dataset but not the hardware.</aside>

On a collection small enough to fit entirely in the cached tier with room to spare, skip pinning: we saw no speed advantage to it, since Full Cached, No Quantization matched it on latency at every scale tested here while requiring no extra configuration.

## Avoid The Cold Tier Without Quantization In Latency-Sensitive Workloads

Add quantization before going cold if disk footprint matters more than raw speed. Every first touch on a cold, unquantized structure comes from disk, and a single HNSW traversal touches enough pages that a rare query can stretch far past its typical latency.

In the local round, most queries against Full Cold, No Quantization came back fine, but **the worst one took over thirty seconds**, an outlier none of the other four presets came close to producing.

Giving the search a small compressed copy to score against, instead of paging full-precision vectors in from a cold file, removes most of the tail-latency risk even before anything gets pinned.

![Search latency percentiles (min, p50, p95, p99, max) for five memory-tier presets at 1.8 million points; Full Cold, No Quantization spikes past 30 seconds at max](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/charts/1.8m-latency-percentiles.png)

<aside role="status">Full Cold, No Quantization is the preset to avoid for anything latency-sensitive.</aside>

## Cache Only if Everything Fits in RAM

Don't cache a compressed copy alongside full-precision vectors unless RAM has room for both. It doubles the resident working set instead of shrinking it, since Qdrant's default is to pin that compressed copy rather than cache it.

Caching the full-precision vectors alone is fast and simple as long as RAM has room for it. But at the 5.6 million point mark on the 32 GB cloud cluster, Full Cached, With Quantization went from a near-winner at 3.8 million points to nearly the worst performer, with **mean latency roughly tripling** and its worst-case queries stretching past **seven seconds**.

The failure wasn't the tier logic breaking, but the cluster running out of memory to keep that much data warm at once: a sizing problem rather than a caching one, but the cached tier is uniquely exposed to it.

![Mean search latency for five memory-tier presets from 3.8 million to 5.6 million points; Full Cached, With Quantization and Full Cold, No Quantization both spike while Pinned Quantized Vectors barely moves](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/charts/3.8m-to-5.6m-jump.png)

<aside role="status">Re-check RAM headroom as the collection grows, not just at initial setup: Full Cached, With Quantization went from a near-winner to nearly the worst performer within a few million points on the same cluster.</aside>

## Watch HNSW Inline Storage For Disk Space

Test HNSW inline storage with quantization at your real vector dimensionality and graph connectivity before relying on it in production. Qdrant's inline HNSW storage removes a random-access read by copying vector data directly into the graph file: a full-precision copy per point, plus a compressed copy for every edge into it.

That second cost scales with edge count and vector size, not point count, so it can grow far faster than the collection does. In the local round, combining inline storage with quantization pushed on-disk graph size to roughly **172 GB**, about **470 times larger** than the same layouts without inline storage, well past Qdrant's own guidance of 3 to 4 times the disk of the same graph without it.

This dataset's connectivity and vector size push that per-edge cost further than most workloads will see, so treat 470x as an upper bound rather than a typical figure.

Swapping in TurboQuant at a smaller compressed size **cut the blow-up roughly in half**, in line with the mechanism: half the bytes per edge, half the extra disk. It didn't remove the problem, which is why every other layout in this piece leaves inline storage off.

![On-disk footprint versus memory footprint for five memory-tier presets at 1.8 million points; the two layouts combining HNSW inline storage with quantization balloon to roughly 172GB on disk](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/charts/memory-and-disk-footprint.png)

<aside role="status">The disk footprint blow-up scales with edges and vector size, not point count, so a small dataset can hide a much larger problem at scale.</aside>

## Treat RAM as a Limiting Factor

Size each layout against how much of the cluster's RAM its working set occupies right now, not how many points the collection holds or the headroom you had at initial setup. A single preset can look fine, fail, and recover again, purely because the ratio between dataset size and available RAM shifts underneath it.

Full Cached, With Quantization looked competitive at 3.8 million points, then fell apart at 5.6 million points once its working set neared the cluster's entire memory budget. It looked fine again at 9.5 million points, but only once the cluster was upgraded from 32 GB to 64 GB of RAM.

A story built only on point count, where more data always means a worse tail, doesn't predict a recovery like that.

![Memory footprint as a percentage of cluster RAM for five memory-tier presets across 3.8 million, 5.6 million, and 9.5 million point runs; Full Cached, With Quantization and Full Cold, No Quantization both spike at 5.6M, then drop back down once the cluster was upgraded to 64GB](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/charts/ram-saturation.png)

<aside role="status">Re-check the ratio between dataset size and cluster RAM at every scaling step, not just once at setup.</aside>

## Takeaways

- Pin the compressed copy once RAM headroom, not raw speed, becomes the binding constraint. Skip it on collections small enough to fit entirely in the cached tier.
- Add quantization before going cold if disk footprint matters more than raw speed; never leave dense vectors cold and unquantized in a latency-sensitive workload.
- Don't cache a compressed copy alongside full-precision vectors unless the cluster has RAM to spare for both.
- Test HNSW inline storage with quantization at your real vector dimensionality and graph connectivity before trusting it in production.
- Re-check RAM headroom against the working set at every scaling step, not just at initial setup.

## Caveats

The cloud runs moved from a 32 GB to a 64 GB cluster partway through, at the same point the tested dataset scaled from 5.6 million to 9.5 million points. That recovery reflects both changes together, not either one in isolation.

The 470x inline-storage blow-up came from one dataset's connectivity and vector dimensionality. Treat it as an upper bound, not a general multiplier.

The 9.5 million point comparison isn't perfectly normalized either: Pinned Quantized Vectors is the only layout that left payload and payload-index storage at Qdrant's server defaults, while the other four explicitly pinned them to match their dense-vector tier. Control for payload settings before generalizing this as the best overall choice.

## Adjacent Work

- [Memory tiers documentation](/documentation/ops-configuration/memory-tiers/): the full set of tier and quantization options per structure.
- [Storage documentation](/documentation/manage-data/storage/): how collections, segments, and storage structures fit together on disk.
- [qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained): the benchmark code, dataset setup, and raw results behind every chart in this piece.
