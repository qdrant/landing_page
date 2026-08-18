---
title: "Memory Tiers in Qdrant: A Comparison at Scale"
short_description: "A benchmark measuring how Qdrant's memory tiers configuration affect search latency and resource usage."
description: "We measured search latency and disk/RAM footprint across 5 different memory tiers configuration at an increasing dataset scale (from 1.8M to 9.5M points) to understand the trade offs of each configuration at scale."
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

Every growing vector collection eventually asks the same question: does this configuration still
hold up once the data no longer fits comfortably in RAM? Qdrant answers by letting you assign dense
vectors, the HNSW graph, quantized vectors, payloads, and payload indexes each into whichever memory
tier that structure supports, instead of forcing one RAM-versus-disk trade-off onto the whole
collection.

This piece walks through what those tiers mean in practice, why a single small-scale benchmark isn't
enough to trust a configuration choice, and what actually happened when we took five common tier
layouts from a laptop-sized dataset up to 9.5&nbsp;million points on Qdrant Cloud.

## How Qdrant's Memory Tiers Work

RAM is fast and expensive, disk is slow and cheap, and a growing collection outgrows its RAM budget
long before it outgrows its disk budget. Qdrant gives you three tiers to manage that trade-off.
Pinned data lives on the heap and never gets evicted, so access is always fast. Cached data is
memory-mapped and Qdrant pre-warms it into the OS page cache at startup, so it starts fast too, but
the OS can push it out under memory pressure. Cold data is also memory-mapped, just without the
pre-warming, so the first read of any page comes from disk.

Not every structure supports every tier. Dense vectors and payloads, for example, can't be pinned,
and sparse vector structures follow their own rules. For the full breakdown, see the
[memory tiers documentation](https://qdrant.tech/documentation/ops-configuration/memory-tiers/).

Quantization is one of the main tools that makes the cold and pinned tiers practical at real scale.
Compressing vectors to int8 or lower shrinks them enough to fit a small, fixed amount of RAM, so a
search can score most candidates against that compressed copy instead of paging in the full-precision
ones. Qdrant still rescores the top candidates against the original vectors by default, so quantizing
saves memory without giving up recall. Every layout in this piece keeps that default; skipping
rescoring is only an option with binary or low-precision TurboQuant, and none of them use it.

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/visuals/memory-tiers-visual.png" alt="Diagram of Qdrant's three memory tiers: pinned, cached, and cold, and how each relates to RAM and disk" caption="Only the pinned tier guarantees the data stays resident; cached and cold both depend on how much memory pressure the OS is under." width="100%" >}}

## Why We Tested Five Layouts Across Four Scales

The docs describe each tier's behavior in isolation, but the safe choice for a real workload depends
on how several tiers interact with an actual dataset on actual hardware, and that isn't obvious from
reading definitions alone. So we picked five layouts that represent genuinely different bets, and
tested all five at four different scales to see whether the bet that looks safest early stays safe as
the collection grows.

- **Full Cached, No Quantization**: everything kept warm in the OS page cache. The bet is speed
  first, with enough RAM to hold the whole working set.
- **Full Cached, With Quantization**: the same, plus a compressed copy of the vectors also kept
  cached, overriding Qdrant's own default of pinning that copy instead.
- **Full Cold, No Quantization**: everything memory-mapped without pre-warming. The bet is a minimal
  memory footprint, accepting that first-touch reads come from disk.
- **Full Cold, With Quantization**: the cold tier, plus a compressed copy that's also left cold,
  matching Qdrant's own default for that combination.
- **Pinned Quantized Vectors**: cold dense vectors, but the compressed copy explicitly pinned in RAM.
  This follows the overall layout Qdrant's optimization docs recommend for high-speed search with a
  low memory footprint.

Here's how the five layouts compare on paper, before any of them have touched real data:

| Layout | Expected Speed | Expected Memory Footprint | Memory Cost |
| --- | --- | --- | --- |
| Full Cached, No Quantization | Fast | High | Opportunistic |
| Full Cached, With Quantization | Fast | High | Opportunistic |
| Full Cold, No Quantization | Slow, unpredictable | Low | Opportunistic |
| Full Cold, With Quantization | Moderate | Moderate | Opportunistic |
| Pinned Quantized Vectors | Fast | Moderate | Fixed |

Four of the five layouts leave their memory cost up to the OS: how much of that "expected" footprint
actually stays resident depends on what else is competing for RAM. Only the pinned layout turns its
footprint into a guarantee. Whether that difference matters is exactly what the four benchmark rounds
test.

A configuration's safety net, meaning how much RAM headroom is left for it, is a moving target as
both the dataset and the infrastructure change. So rather than run one benchmark, we ran four: a
local, single-node baseline at 1.8&nbsp;million points with no infrastructure variables in play, then
three progressively larger Qdrant Cloud runs at 3.8&nbsp;million, 5.6&nbsp;million, and
9.5&nbsp;million points. Every run replayed the same 1,677-query search benchmark against the same
MS&nbsp;MARCO passage embeddings, using the CLI in
[qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained).

## A Local Baseline: What Happens Before Infrastructure Gets Involved

The first round ran locally on a single node: a 14-core machine with 32&nbsp;GB of RAM, shared with
other processes competing for the same resources, though running the client next to the Qdrant
instance removed the network latency a remote setup would add. Every preset was measured right after
upload, so the cold-tier presets started from a genuinely empty page cache rather than a warmed one:
the realistic worst case for a freshly restored collection, not its long-run steady state.

The results split cleanly along the lines each layout's bet would predict. Cached is fastest and most
consistent, because the whole working set fits in RAM and nothing forces the OS to evict any of it.
Cold, on its own, is the layout to avoid: most queries are fine, but a rare one takes over thirty
seconds, because every first touch has to come from disk and an HNSW traversal touches a lot of
pages. Quantization mostly closes that gap by giving the search a small compressed copy to score
against instead of paging in full-precision vectors from a cold file, and pinning that compressed
copy removes the remaining unpredictability entirely.

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/1.8m-latency-percentiles.png" alt="Line chart of search latency percentiles (min, p50, p95, p99, max) for five memory-tier presets at 1.8 million points" caption="Latency across percentiles for the five presets at 1.8M points. Full Cold, No Quantization spikes past 30 seconds at max." width="100%" >}}

## A Warning Before Scaling Up: Watch HNSW Inline Storage

Two layouts in the local round also surfaced a disk-footprint problem worth flagging before anyone
scales them up. Qdrant's inline HNSW storage exists to remove a random-access read: instead of a cold
graph fetching each neighbor's vector from a separate storage file mid-traversal, inline storage
copies vector data directly into the graph file, a full-precision copy per point, plus a compressed
copy for every edge into it. That second cost scales with how many edges each point has and how large
its vectors are, not with point count alone, so it can grow far faster than the collection does, and
it shows up on disk regardless of which memory tier ends up holding the compressed copy.

Qdrant's own guidance puts inline storage at roughly 3 to 4 times the disk of the same graph without
it. Both layouts that combined inline storage with quantization in our local run, one with the
compressed copy left cold and one with it pinned, saw their on-disk graph size balloon to roughly
172&nbsp;GB, about 470 times larger than the layouts without inline storage. That's well past the baseline guidance and
consistent with this dataset's connectivity and vector size pushing the same per-edge cost further
than usual, not a fluke of this one run. A follow-up test that swapped in TurboQuant, Qdrant's other
quantization method, at a smaller compressed size shrank the blow-up by roughly half, which lines up
with the mechanism: half the bytes per edge, half the extra disk. It didn't remove the problem,
though, which is why every cloud run in this piece leaves inline storage off.

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/memory-and-disk-footprint.png" alt="Grouped bar chart comparing total on-disk footprint and memory footprint for five memory-tier presets at 1.8 million points" caption="On-disk footprint versus memory footprint per preset at 1.8M points. The two layouts combining HNSW inline storage with quantization balloon to roughly 172GB on disk." width="100%" >}}

## Moving to the Cloud: Where the Rankings Start to Shift

The next round moved to a real Qdrant Cloud cluster, sized at 8&nbsp;vCPUs and 32&nbsp;GB of RAM, and
roughly doubled the dataset to 3.8&nbsp;million points. At this scale, the pinned-quantized layout
already looks like the strongest all-around choice: fastest, most predictable, and by far the
smallest footprint. The full-cached-with-quantization layout comes close on raw speed, but needs
several times more memory resident to get there.

The real test came at the next checkpoint, 5.6&nbsp;million points on that same cluster. One layout
that looked fine a moment ago falls apart: full-cached-with-quantization goes from a near-winner to
nearly the worst performer, with mean latency roughly tripling and its worst-case queries stretching
past seven seconds. The cause is memory, not the tier logic itself. That layout keeps both the
full-precision and the compressed vectors on the cached tier, so the combined working set the kernel
has to keep warm grows with the dataset, and at this scale it uses nearly the cluster's entire memory
budget, leaving no slack for contention. The full-cold layout without quantization gets worse for the
same underlying reason. The pinned-quantized layout, by contrast, barely moves, because its memory
cost is a fixed reservation instead of something the OS negotiates on the fly.

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/3.8m-to-5.6m-jump.png" alt="Line chart of mean search latency for five memory-tier presets at 3.8 million and 5.6 million points" caption="Mean search latency, 3.8M to 5.6M points. Full Cached, With Quantization and Full Cold, No Quantization both spike while Pinned Quantized Vectors barely moves." width="100%" >}}

## More Room Changes the Story Again: 9.5M Points

By 5.6&nbsp;million points, the worst-hit layout was already using the vast majority of the cluster's
32&nbsp;GB of RAM. Pushing the dataset further on the same hardware would have mostly measured memory
pressure rather than the tier layouts themselves, so the next round moved to a larger cluster, with
64&nbsp;GB of RAM instead of 32&nbsp;GB, before scaling up to roughly 9.5&nbsp;million points.

Here's the twist: none of the five layouts look worse than they did at 5.6&nbsp;million points, and
two of them look substantially better, even though the dataset grew by another 70%. A story built
only on point count, more data meaning more contention meaning a worse tail, doesn't predict a
recovery like that. What predicts it is how much of the cluster's RAM each layout's working set
actually occupies: on the larger cluster, even the biggest working sets have more slack than they did
before, because the hardware grew faster than the dataset did. The pinned-quantized layout never
depended on that slack in the first place, which is why its footprint stayed the smallest of the five
at every scale we tested, and why it now ties the fastest layout on raw speed while using about a
third of the total memory footprint.

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/ram-saturation.png" alt="Line chart of memory footprint as a percentage of cluster RAM for five memory-tier presets across 3.8 million, 5.6 million, and 9.5 million point runs" caption="Full Cached, With Quantization and Full Cold, No Quantization both spike at 5.6M, then drop back down once the cluster was upgraded to 64GB." width="100%" >}}

{{< figure src="/articles_data/memory-tiers-in-qdrant-a-comparison-at-scale/charts/efficientcy-corner.png" alt="Scatter plot of mean latency against memory footprint for five memory-tier presets at 9.5 million points, highlighting the efficient corner" caption="Mean latency versus memory footprint at 9.5M points. Pinned Quantized Vectors matches the fastest preset's speed while using about one third of the total memory footprint." width="100%" >}}

## Takeaways

- **Cached** is the simple default when the whole working set comfortably fits in RAM, but "fits
  today" isn't a guarantee that holds as the collection grows. Revisit the assumption as data scales,
  not just the configuration.
- **Cold tier without quantization** carries real tail-latency risk: expect disk-read amplification
  and the occasional multi-second query. Adding quantization closes most of that gap.
- **Pinning the compressed vector copy in RAM** (the layout Qdrant's own optimization docs recommend)
  trades a small fixed memory cost for predictability. It's the only layout in this piece that scaled
  without a cliff at every dataset size and every cluster size we tested.
- **Test HNSW inline storage with quantization** at your real vector dimensionality before relying on
  it in production. The two together can multiply on-disk size far past the general 3 to 4 times
  guidance for inline storage alone.
- **What matters as a collection grows** is how much of your cluster's RAM a configuration's working
  set occupies right now. That number, not the point count from your last benchmark, is what
  determines whether a layout is still safe.

The full benchmark configs, raw metrics, and interactive reports behind every chart in this piece are
in [qdrant-labs/memory-tiers-explained](https://github.com/qdrant-labs/memory-tiers-explained).
