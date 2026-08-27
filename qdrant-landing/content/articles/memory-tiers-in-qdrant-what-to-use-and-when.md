---
title: "Memory Tiers in Qdrant: What to Use and When"
short_description: "A guide to choosing a Qdrant memory tier layout as your collection grows."
description: "Which Qdrant memory tier layout to use and when, and why, backed by benchmarks."
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

This article will give you practical guidance over which combination of tiers and quantization to reach for at each stage of a collection's growth, and the reasons behind the choice.

## How Qdrant's Memory Tiers Work

RAM is fast and expensive, disk is slow and cheap, and a growing collection outgrows its RAM budget long before it outgrows its disk budget. Qdrant gives you three tiers to manage that trade-off:

- **Pinned.** Lives on the heap and never gets evicted, so access is always fast.
- **Cached.** Memory-mapped and pre-warmed into the OS page cache at startup, so it starts fast too, but the OS can push it out under memory pressure.
- **Cold.** Also memory-mapped, without the pre-warming, so the first read of any page comes from disk.

Not every structure supports every tier: dense vectors and payloads can't be pinned, and sparse vector structures follow their own rules. For the full breakdown, see the [memory tiers documentation](/documentation/ops-configuration/memory-tiers/).

![Qdrant's three memory tiers, pinned, cached, and cold, and how each relates to RAM and disk](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/memory-tiers-visual.png)

Quantization is one of the main tools that makes the cold and pinned tiers practical at real scale. Compressing vectors to int8 or lower shrinks them enough to fit a small, fixed amount of RAM. A search can then score most candidates against that compressed copy instead of paging in the full-precision ones. Rescoring is on by default only for binary quantization and low-precision TurboQuant.

## Combining Tiers and Quantization

Tiers and quantization combine into a handful of configurations that cover most collections, from a small one that fits entirely in RAM to one too large for RAM at any budget:

- **Full Cached, No Quantization.** Dense vectors and the HNSW graph both cached. The simplest option, and a good default as long as the whole working set fits comfortably in RAM.
- **Full Cached, With Quantization.** The same, plus a compressed copy of the vectors also cached, overriding Qdrant's default of pinning that copy instead. This keeps two copies of the vector data warm at once, so it only makes sense with RAM to spare for both.
- **Full Cold, No Quantization.** Dense vectors and the graph both memory-mapped without pre-warming. Minimizes RAM use, but every first touch on a page comes from disk.
- **Full Cold, With Quantization.** The cold tier, plus a compressed copy that's also left cold, matching Qdrant's own default for that combination. Lower disk-read cost than the unquantized cold tier, since most candidates score against the small compressed copy instead.
- **Pinned Quantized Vectors.** Dense vectors kept cold, but the compressed copy explicitly pinned in RAM. This is the configuration Qdrant's optimization docs recommend for high-speed search with a low memory footprint, and the one to reach for once RAM headroom becomes the binding constraint.

![Tradeoffs, on paper, for the five memory configurations covered in this article](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/tradeoffs-on-paper.png)

Four of these five configurations leave their memory cost up to the OS: how much of that expected footprint actually stays resident depends on what else is competing for RAM. Only pinning turns that footprint into a fixed reservation instead.

## Pin Quantized Vectors for Predictability

Pin the compressed copy once a collection is large enough that RAM becomes the binding constraint, not just raw speed. That fixed reservation is what keeps pinning safe as a collection keeps growing, well past the point where the other configurations start running out of memory headroom.

![A latency-versus-memory scatter with an "efficient corner" of fast, low-memory configurations shaded; the pinned configuration sits in that corner, matching the fastest configuration's speed with far less memory](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/efficiency-corner-mechanism.png)

Pinning tends to land in that efficient corner: it matches the fastest configuration's search speed while using a fraction of its memory footprint. The configurations that leave their footprint up to the OS spike toward the cluster's memory ceiling as a collection grows, while the pinned one's footprint barely moves.

<aside role="status">A fixed memory reservation stays safe as a collection grows. A footprint the OS negotiates on the fly only stays safe as long as there's slack in the cluster's RAM, and that slack might run out when scaling the dataset but not the hardware.</aside>

On a collection small enough to fit entirely in the cached tier with room to spare, skip pinning: it adds configuration for no speed advantage, since caching the full-precision vectors matches pinning on latency as long as everything actually fits.

## Use The Cold Tier With Quantization

Add quantization before going cold if disk footprint matters more than raw speed. Every **first touch on a cold, unquantized structure comes from disk**, and a single HNSW traversal touches enough pages that a rare query can stretch far past its typical latency.

Giving the search a small compressed copy to score against, instead of paging full-precision vectors in from a cold file, removes most of the tail-latency risk even before anything gets pinned.

![A disk page holding a handful of full-precision vectors next to one holding many compressed vectors; a query's per-hop read cost stays low and even with the compressed copy, but spikes sharply on an uncached, unquantized page miss](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/cold-tier-page-fault-mechanism.png)

A disk page holds only a handful of full-precision vectors, so most candidates a traversal touches need their own read. A compressed copy packs many more vectors onto the same page, so one read serves far more of the candidates a query needs. 

Most queries against an unquantized cold tier still come back fine: the risk is in the tail, where a rare hop lands on a page that isn't already cached and pays for that read in full, a condition the quantized configurations don't reproduce.

<aside role="status">An <strong>unquantized cold tier</strong> is the configuration to avoid for anything latency-sensitive.</aside>

## When To Cache Everything

Don't cache a compressed copy alongside full-precision vectors unless RAM has room for both. It doubles the resident working set instead of shrinking it, since Qdrant's default is to pin that compressed copy rather than cache it.

Caching the full-precision vectors alone is fast and simple as long as RAM has room for it. The risk shows up once the working set stops fitting: a configuration that performed close to the fastest option at a smaller scale can fall to nearly the worst as its resident data approaches the cluster's memory budget.

![Two RAM budget tracks: caching the full-precision vectors alone leaves headroom, while also caching the compressed copy pushes the resident working set past the cluster's RAM budget](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/double-in-ram-copy.png)

The failure isn't the tier logic breaking, but the cluster running out of memory to keep that much data warm at once: a sizing problem rather than a caching one, but the cached tier is uniquely exposed to it.

In these cases, the latency can increase by multiple times, and its worst-case queries stretch far past normal, as its working set is very close to the cluster's memory ceiling.

<aside role="status">Re-check RAM headroom as the collection grows, not just at initial setup: a caching configuration can go from a top performer to nearly the worst one within a few million points on the same cluster.</aside>

## HNSW Inline Storage and Disk Space

Test HNSW inline storage with quantization at your real vector dimensionality and graph connectivity before relying on it in production. Qdrant's inline HNSW storage removes a random-access read by copying vector data directly into the graph file: a full-precision copy per point, plus a compressed copy for every edge into it.

That second cost scales with edge count and vector size, not point count, so it can grow far faster than the collection does.

![A standard HNSW graph stores a link per edge; inline storage attaches a compressed vector copy to every edge instead, so on-disk graph size grows with edge count, not just point count, and the gap between the two widens as a collection scales](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/hnsw-storage-blowup.png)

Combining inline storage with quantization can push on-disk graph size to many times larger than the same graph without inline storage. Dense, high-dimensional graphs push the per-edge cost further than sparse, low-dimensional ones, so treat any single multiplier you measure as workload-specific rather than universal. A smaller compressed vector size shrinks it: fewer bytes per edge means less extra disk, though it won't remove the problem entirely.

<aside role="status">The disk footprint blow-up scales with edges and vector size, not point count, so a small dataset can hide a much larger problem at scale.</aside>

## Treat RAM as a Limiting Factor

Size each configuration against how much of the cluster's RAM its working set occupies right now, not how many points the collection holds or the headroom you had at initial setup. A single configuration can look fine, fail, and recover again, purely because the ratio between dataset size and available RAM shifts underneath it.

![Working set as a percentage of cluster RAM against collection scale: a caching configuration's line climbs toward a 100% ceiling, spikes into a danger zone, then drops back to a safe margin once the cluster's RAM budget grows](/articles_data/memory-tiers-in-qdrant-what-to-use-and-when/visuals/ram-ceiling-mechanism.png)

A story built only on point count, where more data always means a worse tail, doesn't hold up: a caching configuration that looks competitive at a smaller scale can fall apart at a bigger one, once its working set comes near the cluster's entire memory budget, then look fine again as soon as the cluster's own RAM budget grows to match.

<aside role="status">Re-check the ratio between dataset size and cluster RAM at every scaling step, not just once at setup.</aside>

## Takeaways

- Pin the compressed copy once RAM headroom, not raw speed, becomes the binding constraint. Skip it on collections small enough to fit entirely in the cached tier.
- Add quantization before going cold if disk footprint matters more than raw speed; never leave dense vectors cold and unquantized in a latency-sensitive workload.
- Don't cache a compressed copy alongside full-precision vectors unless the cluster has RAM to spare for both.
- Test HNSW inline storage with quantization at your real vector dimensionality and graph connectivity before trusting it in production.
- Re-check RAM headroom against the working set at every scaling step, not just at initial setup.

## Adjacent Work

- [Memory tiers documentation](/documentation/ops-configuration/memory-tiers/): the full set of tier and quantization options per structure.
- [Storage documentation](/documentation/manage-data/storage/): how collections, segments, and storage structures fit together on disk.
- [qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained): the benchmark code and raw results behind the guidance in this piece.
