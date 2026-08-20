---
title: "Memory Tiers in Qdrant: What to Use and When"
short_description: "Guidance on choosing a Qdrant memory tier layout, backed by benchmarks from 1.8M to 9.5M points."
description: "Which Qdrant memory tier layout to use and why, backed by benchmarks from 1.8M to 9.5M points."
social_preview_image: /articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/preview/social_preview.png
preview_dir: /articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/preview
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

This piece walks through what those tiers mean in practice, and how you can scale them across growing collections to find the best balance for memory, disk space and query latency.

## How Qdrant's Memory Tiers Work

RAM is fast and expensive, disk is slow and cheap, and a growing collection outgrows its RAM budget long before it outgrows its disk budget. Qdrant gives you three tiers to manage that trade-off:

- **Pinned** data lives on the heap and never gets evicted, so access is always fast.
- **Cached** data is memory-mapped and pre-warmed into the OS page cache at startup, so it starts fast too, but the OS can push it out under memory pressure.
- **Cold** data is also memory-mapped, without the pre-warming, so the first read of any page comes from disk.

Not every structure supports every tier: dense vectors and payloads can't be pinned, and sparse vector structures follow their own rules. For the full breakdown, see the [memory tiers documentation](/documentation/ops-configuration/memory-tiers/).

![Qdrant's three memory tiers, pinned, cached, and cold, and how each relates to RAM and disk](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/visuals/memory-tiers-visual.png)

Quantization is one of the main tools that makes the cold and pinned tiers practical at real scale. Compressing vectors to int8 or lower shrinks them enough to fit a small, fixed amount of RAM, so a search can score most candidates against that compressed copy instead of paging in the full-precision ones.

Every layout in this piece uses scalar quantization, which compresses vectors to int8. Qdrant does not rescore against the original vectors by default for scalar quantization, and this benchmark leaves that default in place, so the numbers below reflect quantized-only search rather than a rescored one. Rescoring is on by default only for binary quantization and low-precision TurboQuant.

## How We Tested Memory Tiers

The five layouts in this piece put the three memory tiers, plus quantization, together in different combinations, and the charts throughout the article refer to them.

- **Full Cached, No Quantization**: dense vectors and the HNSW graph both cached.
- **Full Cached, With Quantization**: the same, plus a compressed copy of the vectors also cached, overriding Qdrant's default of pinning that copy instead.
- **Full Cold, No Quantization**: dense vectors and the graph both memory-mapped without pre-warming.
- **Full Cold, With Quantization**: the cold tier, plus a compressed copy that's also left cold, matching Qdrant's own default for that combination.
- **Pinned Quantized Vectors**: dense vectors kept cold, but the compressed copy explicitly pinned in RAM. This is the layout Qdrant's optimization docs recommend for high-speed search with a low memory footprint.

Here's how the five layouts compare on paper, before any of them have touched real data:

| Layout | Expected Speed | Expected Memory Footprint | Memory Cost |
| --- | --- | --- | --- |
| Full Cached, No Quantization | Fast | High | Opportunistic |
| Full Cached, With Quantization | Fast | High | Opportunistic |
| Full Cold, No Quantization | Slow, unpredictable | Low | Opportunistic |
| Full Cold, With Quantization | Moderate | Moderate | Opportunistic |
| Pinned Quantized Vectors | Fast | Moderate | Fixed |

Four of the five layouts leave their memory cost up to the OS: how much of that expected footprint actually stays resident depends on what else is competing for RAM. **Only Pinned Quantized Vectors turns its footprint into a guarantee.**

## Pin Quantized Vectors for Predictability

**Pinned Quantized Vectors is the only layout of the five we tested whose memory cost is a fixed reservation** rather than something the OS negotiates on the fly. That single property is what kept it safe across every dataset and cluster size in this benchmark, while every other layout eventually hit a point where the OS ran out of slack to give it.

At 9.5 million points, Pinned Quantized Vectors **tied Full Cached, No Quantization on raw search speed while using about a third of its memory footprint**. A few million points earlier, at 5.6 million, the comparison looked different: Full Cached, With Quantization and Full Cold, No Quantization had both spiked toward the cluster's memory ceiling, while Pinned Quantized Vectors' footprint barely moved.

![Mean latency versus memory footprint for five memory-tier presets at 9.5 million points; Pinned Quantized Vectors matches the fastest preset's speed while using about one third of the total memory footprint](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/efficiency-corner.png)

<aside role="status">A fixed memory reservation stays safe as a collection grows. A footprint the OS negotiates on the fly only stays safe as long as there's slack in the cluster's RAM, and that slack might run out when scaling the dataset but not the hardware.</aside>

Pinning the compressed copy only pays off once the collection is large enough that RAM headroom, not raw speed, is the binding constraint. On a collection small enough to fit entirely in the cached tier with room to spare, we saw no speed advantage to pinning, since Full Cached, No Quantization matched it on latency at every scale tested here while requiring no extra configuration.

## Avoid The Cold Tier Without Quantization In Latency-Sensitive Workloads

Every first touch on a cold, unquantized structure comes from disk, and a single HNSW traversal touches enough pages that a rare query can stretch far past its typical latency. In our tests, most queries against Full Cold, No Quantization came back fine, but **the worst one took over thirty seconds**, an outlier none of the other four presets came close to producing.

**Quantization closes most of that gap.** Giving the search a small compressed copy to score against, instead of paging full-precision vectors in from a cold file, removes most of the tail-latency risk even before anything gets pinned.

![Search latency percentiles (min, p50, p95, p99, max) for five memory-tier presets at 1.8 million points; Full Cold, No Quantization spikes past 30 seconds at max](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/1.8m-latency-percentiles.png)

<aside role="status">Full Cold, No Quantization is the preset to avoid for anything latency-sensitive. If disk footprint matters more than raw speed, add quantization before going cold.</aside>

## Cache Only if Everything Fits in RAM

Caching the full-precision vectors is fast and simple as long as RAM has room for it, but **caching a compressed copy alongside it doubles the resident working set instead of shrinking it**, since Qdrant's default is to pin that compressed copy rather than cache it. In our cloud benchmark, Full Cached, With Quantization went from a near-winner at 3.8 million points to nearly the worst performer at 5.6 million points on the same cluster, with **mean latency roughly tripling** and its worst-case queries stretching past **seven seconds**.

The failure wasn't the tier logic breaking. It was the cluster running out of memory to keep that much data warm at once, which is a sizing problem more than a caching one, but one the cached tier is uniquely exposed to.

![Mean search latency for five memory-tier presets from 3.8 million to 5.6 million points; Full Cached, With Quantization and Full Cold, No Quantization both spike while Pinned Quantized Vectors barely moves](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/3.8m-to-5.6m-jump.png)

<aside role="status">Cached is a good default only while the whole working set comfortably fits in RAM. Re-check that assumption as the collection grows, not just at initial setup, since Full Cached, With Quantization went from a near-winner to nearly the worst performer within a few million points on the same cluster.</aside>

## Watch HNSW Inline Storage For Disk Space

Qdrant's inline HNSW storage removes a random-access read by copying vector data directly into the graph file: a full-precision copy per point, plus a compressed copy for every edge into it. That second cost scales with edge count and vector size, not point count, so it can grow far faster than the collection does. In our local tests, combining inline storage with quantization pushed on-disk graph size to roughly **172 GB**, about **470 times larger** than the same layouts without inline storage, well past Qdrant's own guidance of 3 to 4 times the disk of the same graph without it.

This dataset's connectivity and vector size push that per-edge cost further than most workloads will see, so treat 470x as an upper bound rather than a typical figure. Swapping in TurboQuant at a smaller compressed size **cut the blow-up roughly in half**, in line with the mechanism: half the bytes per edge, half the extra disk. It didn't remove the problem, which is why every other layout in this piece leaves inline storage off.

![On-disk footprint versus memory footprint for five memory-tier presets at 1.8 million points; the two layouts combining HNSW inline storage with quantization balloon to roughly 172GB on disk](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/memory-and-disk-footprint.png)

<aside role="status">Test HNSW inline storage with quantization at your real vector dimensionality and graph connectivity before relying on it in production. The blow-up scales with edges and vector size, not point count, so a small dataset can hide a much larger problem at scale.</aside>

## Treat RAM as a Limiting Factor

**A single preset can look fine, fail, and recover again**, purely because the ratio between dataset size and available RAM shifts underneath it. In our cloud runs, Full Cached, With Quantization looked competitive at 3.8 million points, fell apart at 5.6 million points once its working set neared the cluster's entire memory budget, then looked fine again at 9.5 million points once the cluster was upgraded from 32 GB to 64 GB of RAM. A story built only on point count, where more data always means a worse tail, doesn't predict a recovery like that.

What predicts it is how much of the cluster's RAM each preset's working set actually occupies at the moment you measure it, not how many points the collection holds.

![Memory footprint as a percentage of cluster RAM for five memory-tier presets across 3.8 million, 5.6 million, and 9.5 million point runs; Full Cached, With Quantization and Full Cold, No Quantization both spike at 5.6M, then drop back down once the cluster was upgraded to 64GB](/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/ram-saturation.png)

<aside role="status">What determines whether a preset is still safe is how much of the cluster's RAM its working set occupies right now, not the point count from your last benchmark or the headroom you had at initial setup.</aside>

## Adjacent Work

- [Memory tiers documentation](/documentation/ops-configuration/memory-tiers/): the full set of tier and quantization options per structure.
- [Storage documentation](/documentation/manage-data/storage/): how collections, segments, and storage structures fit together on disk.
- [qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained): the benchmark code, dataset setup, and raw results behind every chart in this piece.
