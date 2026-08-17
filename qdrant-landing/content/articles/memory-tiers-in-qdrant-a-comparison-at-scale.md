---
title: "Memory Tiers in Qdrant: A Comparison at Scale"
short_description: "A benchmark measuring how Qdrant's memory tiers configuration affect search latency and resource usage."
description: "We measured search latency and disk/RAM footprint across 5 different memory tiers configuration at an increasing dataset scale (from 1.8M to 9.5M points) to understand the trade offs of each configuration at scale."
social_preview_image: /articles_data/turboquant/preview/social_preview.png
preview_dir: /articles_data/turboquant/preview
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

A collection's data doesn't have to live in one place. Qdrant lets you place dense vectors, the
Hierarchical Navigable Small World (HNSW) graph, quantized vectors, payloads, and payload indexes
into whichever memory tier each one supports, so a 10&nbsp;GB collection and a 10&nbsp;TB collection
can use completely different storage strategies under the same API. This piece walks through what
those tiers are, then through four rounds of benchmarks against the MS&nbsp;MARCO v2.1 passage
dataset: a 1.8&nbsp;million-point local baseline, and three Qdrant Cloud runs at 3.8&nbsp;million,
5.6&nbsp;million, and 9.5&nbsp;million points.

## Why Memory Tiers Exist

RAM is fast and expensive, disk is slow and cheap, and a growing collection outgrows its RAM budget
long before it outgrows its disk budget. Qdrant lets you place dense vectors, the HNSW graph,
quantized vectors, payloads, and payload indexes each into whichever of three memory tiers that
structure supports: pinned, held on the heap and never evicted; cached, memory-mapped and pre-warmed
into the OS page cache at startup; or cold, memory-mapped but not pre-warmed, so the first read of
any page comes from disk. Not every structure supports every tier (dense vectors and payloads, for
example, cannot be pinned), and sparse vector structures follow their own rules. Only pinned
guarantees the data stays resident. Cached and cold sit on the same memory-mapped file and can both
end up reading from disk under memory pressure, the difference between them is only whether Qdrant
warms the page cache upfront.

Quantization is one of the main tools for making the cold and pinned tiers practical at large scale.
Compressing vectors to int8 or lower shrinks them enough to fit a small, fixed amount of RAM, so a
search can score most candidates against that compressed copy instead of paging in the
full-precision ones. By default, Qdrant still rescores the top candidates against the original
vectors, so the full-precision copy stays in the read path. Every run in this piece, including the
TurboQuant follow-up in the 1.8M section, leaves rescoring at that default; skipping it is only an
option with binary quantization or low-precision TurboQuant, and this benchmark never turns it off.
That's the mechanism behind most of the results that follow.

For which structures support which tiers and how Qdrant picks defaults for each, see the
[memory tiers documentation](/documentation/ops-configuration/memory-tiers/).

## How the Benchmark Works

Each run creates a Qdrant collection with a chosen memory-tier layout using the `collection-setup`
CLI from [qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained),
uploads the MS&nbsp;MARCO v2.1 passage embeddings (Cohere's `embed-english-v3`), and then replays
the same 1,677-query sequential benchmark against it, reporting throughput in queries per second
(QPS) alongside median (p50) and 99th-percentile (p99) latency. Five presets recur across every
dataset size:

- **Full Cached, No Quantization**: dense vectors, payloads, and payload indexes all cached.
- **Full Cached, With Quantization**: the same, plus scalar int8 quantized vectors. Qdrant's own
  default would pin the quantized copy once the base vectors are cached; this preset overrides that
  default and keeps the quantized copy cached too.
- **Full Cold, No Quantization**: everything on the cold tier.
- **Full Cold, With Quantization**: cold tier, plus scalar int8 quantized vectors, also cold.
- **Pinned Quantized Vectors**: cold dense vectors, quantized vectors explicitly pinned in RAM
  instead of the cold tier Qdrant would default to, payload tier left at the server default. This
  follows the same overall layout Qdrant's optimization docs recommend for high-speed search with a
  low memory footprint.

Every ranking in the sections that follow is scoped to that run's cluster memory budget and disk
performance. A different instance size or dataset shape could change which layout comes out ahead,
and, as the later sections show, the cluster itself is not held fixed across every run either.

## 1.8M Points: A Local Baseline

> The local machine used for this benchmark was a 14-core Intel CPU with
> 32&nbsp;GB of RAM (shared with other local processes). Note that colocating the
> uploading client with the Qdrant instance cut out the network latency a remote client would see.

The first run was local, single-node, and measured after upload and optimizations finished, so that the cold-tier presets
would start from an empty page cache rather than a warmed one.
That's the realistic worst case for a freshly restored collection, not its long-run steady state,
and it shows in how wide the spread is.

| Preset | QPS | p50 (ms) | p99 (ms) | Max (ms) |
| --- | --- | --- | --- | --- |
| Cached | 94.3 | 10.7 | 13.1 | 15.6 |
| Cached + quantized | 99.2 | 6.7 | 121.8 | 316.8 |
| Cold | 5.4 | 11.3 | 582.5 | 30,542.9 |
| Cold + quantized | 21.5 | 33.7 | 50.8 | 8,954.8 |
| Pinned quantized | 37.6 | 26.6 | 38.0 | 68.1 |

Of the five presets, cached holds up best: p99 stays under 13.1&nbsp;ms and the single worst query
ever seen takes 15.6&nbsp;ms, because the whole 9.2&nbsp;GB working set fits in the page cache and
nothing during this run pushed the OS to evict any of it. That's a property of this run's memory
pressure, not a guarantee cached carries on its own.
Adding quantization to that same cached tier improves the median (6.7&nbsp;ms) but widens the tail
(max 316.8&nbsp;ms): the cache was still warming mid-run and some fraction of queries paid a real
disk cost despite being nominally cached.

Cold, with nothing quantized, is the worst case by a wide margin: 5.4&nbsp;qps, and one query that
took 30.5&nbsp;seconds. Over the benchmark, the page cache grew from 429&nbsp;MB to 7.6&nbsp;GB and
pulled 123.4&nbsp;GB off disk to answer 1,677 queries, an 18x read amplification consistent with
repeated cold-page HNSW traversal rather than a one-time warm-up cost. Quantization is what fixes
that: cold-with-quantization recovers to 21.5&nbsp;qps and cuts disk reads to essentially zero
(0.01&nbsp;GB), because scoring now touches the small quantized vectors instead of the cold
full-precision ones. Pinning those quantized vectors goes one step further, holding p99 to
38.0&nbsp;ms and the max to 68.1&nbsp;ms with no multi-second spikes at all, at the cost of the
slowest upload of the five (1,096&nbsp;seconds).

That last preset also surfaced a disk-footprint problem serious enough to flag before scaling up.
Combining inline HNSW storage with quantization inflated the graph's on-disk size roughly 470x:
about 346&nbsp;MB in every other preset versus 162&nbsp;GB here, for the same 1.76&nbsp;million
points. Total collection disk followed the same pattern (about 172&nbsp;GB against 9 to 11&nbsp;GB
elsewhere).

The cause is inline storage doing what it's designed to do, at a larger scale than expected here. A
cold HNSW graph normally stores only the links between points, and fetches each neighbor's vector
from a separate, memory-mapped storage file as it traverses the graph. Inline storage removes that
extra random-access read by copying vector data directly into the graph file instead: a
full-precision copy per point, plus a quantized copy for every edge into it. The more connected the
graph and the larger the vectors, the more that per-edge cost adds up, so the total scales with graph
connectivity and vector dimensionality, not with point count alone (see the
[dedicated documentation](/documentation/ops-optimization/optimize/#inline-storage-in-hnsw-index) for
how inline storage is configured). Qdrant's own optimization guidance puts inline storage at roughly
3 to 4x the disk of the same graph without it. What shows up here is well past that ratio, consistent
with this dataset's connectivity and vector size pushing the same per-edge cost further than usual,
rather than something specific to this one run.

A follow-up run swapped scalar int8 quantization for TurboQuant, one of Qdrant's other quantization
methods, set to 4 bits per dimension, on the two quantized presets alone. The effect held up: TurboQuant won on every search metric (cached-tier p99 down from 121.8&nbsp;ms to
28.3&nbsp;ms; cold-tier max down from 9.0&nbsp;seconds to 1.19&nbsp;seconds) and roughly halved the
inline-storage blow-up (172.9&nbsp;GB to 95.6&nbsp;GB). That halving lines up with the mechanism
just described: the quantized copy stored per edge shrinks by about half when moving from 8-bit to 4-bit
quantization, while the full-precision copy stored once per point doesn't change, so the total
dropping to a little over half its previous size is exactly what the per-edge cost predicts. The
cloud runs that follow sidestep the issue entirely: neither one enables inline HNSW storage, and
their disk footprints stay in the tens of gigabytes rather than the hundreds.

## 3.8M Points: Onto Qdrant Cloud

The next run moved to a single Qdrant Cloud cluster, sized at 8&nbsp;vCPUs, 32&nbsp;GB of RAM, and
160&nbsp;GB of disk, and roughly doubled the dataset, to 3,750,897 points. The 5.6M run in the next
section reuses the same cluster, but this 32&nbsp;GB budget is not fixed for the rest of the
article: it becomes the limiting factor by 5.6M, which is why the 9.5M run later moves to a larger
machine. Comparing across scales further on means comparing a larger dataset on a larger cluster, not
the same box under more load.

| Configuration | QPS | Mean (ms) | p99 (ms) | Total footprint (GB) |
| --- | --- | --- | --- | --- |
| Full Cached, No Quantization | 3.6 | 278.0 | 326.9 | 19.38 |
| Full Cached, With Quantization | 4.0 | 247.7 | 737.5 | 22.99 |
| Full Cold, No Quantization | 2.4 | 424.9 | 3,933.8 | 16.48 |
| Full Cold, With Quantization | 3.1 | 326.0 | 1,664.6 | 4.99 |
| Pinned Quantized Vectors | 4.8 | 206.2 | 236.0 | 6.23 |

Pinned Quantized Vectors is the clear winner on this cluster: the best mean latency, the best
throughput, and a p50 and p99 within 15% of each other, all for 6.23&nbsp;GB of guaranteed RAM. Full Cached, With Quantization comes close on mean latency
(247.7&nbsp;ms) but needs 22.99&nbsp;GB resident in OS page cache to get there, 3.7x the memory for a
slower and far less predictable result. Full Cold, No Quantization is the one to avoid: worst on every latency measure,
and its page cache still grew from 961&nbsp;MB to 16.3&nbsp;GB over the run anyway, so it doesn't
even keep its promised low footprint once queries start arriving.

## 5.6M Points: One Configuration Falls Apart

The same five configurations, rerun at roughly 1.5x the 3.8M scale (5,649,026 points), produce a
ranking that looks nothing like the one at 3.8M.

| Configuration | QPS | Mean (ms) | p99 (ms) | Total footprint (GB) |
| --- | --- | --- | --- | --- |
| Full Cached, No Quantization | 4.9 | 204.7 | 329.2 | 25.92 |
| Full Cached, With Quantization | 1.6 | 635.6 | 7,574.8 | 30.10 |
| Full Cold, No Quantization | 0.8 | 1,295.8 | 18,739.5 | 24.85 |
| Full Cold, With Quantization | 2.1 | 473.9 | 7,987.6 | 7.50 |
| Pinned Quantized Vectors | 4.0 | 253.0 | 566.6 | 9.36 |

Full Cached, With Quantization was the second-best mean-latency configuration at 3.8M points. At
5.6M, it's the second-worst: mean latency jumps from 247.7&nbsp;ms to 635.6&nbsp;ms, and p99 balloons
past 7.5&nbsp;seconds. Its own memory footprint explains why. This preset keeps both the
full-precision and the quantized vectors on the cached tier rather than letting the quantized copy
default to pinned, so neither copy is guaranteed to stay resident once the OS needs that memory
elsewhere. The combined working set the kernel has to keep warm grows with the dataset
(22.99&nbsp;GB to 30.10&nbsp;GB), and at 5.6M points this cluster can no longer hold all of it
without contention. Full Cold, No Quantization, already the worst performer at 3.8M, gets worse
still: mean latency more than triples to 1,295.8&nbsp;ms, with a max of nearly 27&nbsp;seconds.

Pinned Quantized Vectors is the one configuration whose behavior barely moved. Mean latency rose
from 206.2&nbsp;ms to 253.0&nbsp;ms and its footprint from 6.23&nbsp;GB to 9.36&nbsp;GB, a change
roughly in line with the 50% growth in data rather than a cliff. It drops from first to second place
on raw throughput, edged out by Full Cached, No Quantization's 4.9&nbsp;qps. That configuration also
keeps its own worst case contained (max 898.1&nbsp;ms), but it does so while holding 25.92&nbsp;GB
resident, 2.8x pinned quantized vectors' footprint. Among the configurations built around
quantization, Pinned Quantized Vectors still has the smallest gap between typical and worst-case
latency by a wide margin: p99 at 566.6&nbsp;ms and a max that never crosses 1.1&nbsp;seconds.

## 9.5M Points: More Headroom Changes the Order Again

This run moves to a larger cluster, 8&nbsp;vCPUs, 64&nbsp;GB of RAM, and 288&nbsp;GB of disk, because
the previous one had run out of room: at 5.6M points, Full Cached, With Quantization already needed
30.10&nbsp;GB out of the old cluster's 32&nbsp;GB of RAM, a 94% saturation of the whole memory budget.
Pushing the dataset further on that same cluster would have measured memory pressure more than the
memory-tier layout itself, so the same five configurations were scaled to roughly 9.5&nbsp;million
points on the new machine instead.

| Configuration | QPS | Mean (ms) | p99 (ms) | Total footprint (GB) |
| --- | --- | --- | --- | --- |
| Full Cached, No Quantization | 4.9 | 205.5 | 219.1 | 49.04 |
| Full Cached, With Quantization | 3.3 | 298.9 | 1,637.7 | 56.19 |
| Full Cold, No Quantization | 1.4 | 733.5 | 9,595.8 | 41.78 |
| Full Cold, With Quantization | 2.2 | 458.4 | 3,982.4 | 12.62 |
| Pinned Quantized Vectors | 4.9 | 205.4 | 224.0 | 15.77 |

Even though the dataset grew by another 70% over the 5.6M run, none of the five configurations look
worse than their 5.6M selves, and two look substantially better. Full Cached, With Quantization's
mean latency drops from 635.6&nbsp;ms back to 298.9&nbsp;ms and its p99 from 7,574.8&nbsp;ms to
1,637.7&nbsp;ms. Full Cold, No Quantization's mean drops from 1,295.8&nbsp;ms to 733.5&nbsp;ms and
its p99 roughly halves, from 18,739.5&nbsp;ms to 9,595.8&nbsp;ms. Both are still the two worst
performers at 9.5M, and neither recovers to its 3.8M form, but a story built only on point count
(more data, more contention, a monotonically worse tail) does not predict a recovery like this.

The cluster's memory headroom does. Full Cached, With Quantization's 30.10&nbsp;GB footprint used
94% of the 32&nbsp;GB cluster at 5.6M; its 56.19&nbsp;GB footprint uses 88% of the 64&nbsp;GB cluster
at 9.5M, despite holding nearly twice as many points. The cluster upgrade added more RAM than the
dataset added data, so the same tier layout is working with more slack even though its absolute
footprint grew. Full Cold, No Quantization shows the same shape at lower absolute saturation: 78% of
the 32&nbsp;GB cluster at 5.6M, 65% of the 64&nbsp;GB cluster at 9.5M.

Pinned Quantized Vectors benefits from that slack without ever having depended on it. Its footprint
stays the smallest of the five at every scale, 24.6% of the cluster at 9.5M against 29.3% at 5.6M,
and at 9.5M it ties Full Cached, No Quantization on both throughput (4.9&nbsp;qps) and p99
(224.0&nbsp;ms against 219.1&nbsp;ms), while using less than a third of the memory (15.77&nbsp;GB
against 49.04&nbsp;GB).

## What Holds Up as Data Grows

Point count alone does not predict the ranking at any given scale. What predicts it is how much of
the cluster's RAM a configuration's working set occupies. Full Cached, With Quantization traces the
point across all three cloud runs: 72% of a 32&nbsp;GB cluster at 3.8M, 94% of the same cluster at
5.6M, then 88% of a 64&nbsp;GB cluster at 9.5M once the hardware was upgraded, tracking its mean
latency almost exactly as it spikes and partially recovers.

Full Cold, No Quantization repeats the shape at lower saturation (52%, 78%, 65%). Neither
configuration is reading the size of the dataset; both are reading how much room the OS has left to
keep their working set resident.

Pinned Quantized Vectors never depended on that room. Its footprint is a fixed, guaranteed allocation
rather than an opportunistic cache, so it stays under 30% of cluster RAM at every scale tested. Its
latency scales with the data instead of with how full the cluster happens to be, which is why it
catches up to Full Cached, No Quantization on raw speed at 9.5M while using a third of the memory.

A configuration built around the OS opportunistically keeping a growing working set resident is only
as good as the RAM the cluster has left over for it, and that number can move in either direction as
the dataset and the hardware both change. A configuration that pins its memory cost instead scales
predictably regardless of which way the cluster's headroom moves. What matters is how much slack the
cluster has left, not whether a configuration caches or quantizes.
