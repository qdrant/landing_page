---
title: "What Qdrant's Optimizers Cost Your Queries"
short_description: "A benchmark measuring how Qdrant's optimizers affect search latency."
description: "We measured search latency across 14 optimizer configurations on a 1.76 million point Qdrant collection, putting numbers on the read-write contention the docs describe qualitatively."
social_preview_image: /articles_data/what-qdrant-optimizers-cost-your-queries/preview/social_preview.png
preview_dir: /articles_data/what-qdrant-optimizers-cost-your-queries/preview
author: Clelia Bertelli
author_link: https://qdrant.tech
date: 2026-08-14T10:00:00+02:00
draft: false
keywords:
  - optimizer
  - indexing
  - vacuum
  - read-write contention
  - benchmark
category: production-ops
weight: 8
---

# What Qdrant's Optimizers Cost Your Queries

A bulk load finishes, and the collection looks ready: every point is in, and the upload call has returned. Then the first queries land, and search takes hundreds of milliseconds, sometimes several seconds at a stretch, while Qdrant's indexing, merge, and vacuum optimizers work through the backlog the upload left behind. How long that lasts, and what it costs each query, depends on settings most people never touch.

We built a benchmark harness, loaded 1.76 million Cohere-embedded MS MARCO passages into a single Qdrant node under 13 different optimizer configurations, and measured what search latency looked like while each optimizer worked through its backlog, and after it finished. For one corpus and one machine, this puts a number on the qualitative guidance already in Qdrant's optimizer docs and read-write contention guide.

Some of the results confirm that guidance directly. Others surprised us.

> All the benchmarks were performed on a machine running Ubuntu 26.04 x86_64, with 32GB RAM and 
> 14 Intel CPU cores. The Qdrant instance was hosted on the same machine (which significantly reduces network latency): reproducing the benchmarks with an on-cloud instance might yield higher upload and search latencies.

## How We Measured It

Each run followed the same three stages, shown here as a timeline from the last point uploaded to a settled baseline:

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/experiment-diagram.svg" alt="Diagram showing the three stages of each run: an upload phase during which points were loaded into the Qdrant collection with no search traffic, a draining phase during which search traffic competes for resources with optimizations, and a steady phase in which optimizers are idle and search latency is measured at baseline." width="100%" >}}

- **Upload.** All 1.76 million points go in with no search traffic running, so the collection is already full by the time we start measuring latency. Upload alone took anywhere from 70 seconds to 316 seconds, depending on whether indexing was running concurrently with it.
- **Draining.** Once the upload finishes, we search continuously (one query in flight at a time, no batching) while polling Qdrant's `/collections/{collection_name}/optimizations` endpoint every 2 seconds, until it reports nothing running and nothing queued.
- **Steady.** With optimizers confirmed idle, we run five fixed passes over a separate set of 1,000 query vectors (5,000 searches) as the steady-state baseline.

That closed-loop search pattern matters for reading the sample counts in the tables that follow: when a query takes 800 ms, only about 1.25 of them fit into a second of wall-clock time. A draining phase can run for over 10 minutes and still only collect a few hundred samples, while a steady phase with the same fixed 5,000-query workload can finish many times faster once nothing is competing with it. A small `n` during draining is a direct consequence of how slow the search can get while optimizations are running, and shouldn't be considered missing data.

All 14 collections lived on the same node for the whole test, so absolute latencies include that machine's baseline overhead. Read these numbers as relative effects, not as a latency SLA for your own cluster. The embeddings come from the `CohereLabs/msmarco-v2.1-embed-english-v3` dataset on Hugging Face, one segmented parquet file of MS MARCO v2.1 passages, 1024 dimensions per vector. Latency figures throughout are p50 (median) and p95 (95th percentile) per-query times.

## Indexing While You Write Is Not Free After You Stop Writing

Our first experiments compared continuous indexing (where the HNSW graph is built while points are ingested) with indexing disabled by raising the HNSW build threshold.

As expected, continuous indexing does not leave the collection fully optimized as soon as the final point arrives: in our run, Qdrant needed a little over 11 minutes to clear the optimization backlog. During this draining phase, search latency reflected the contention between optimization writes and search reads: median latency was 780 ms, p95 reached 2.0 s, and a few queries took nearly 10 s.

Once optimizers became idle, median search latency dropped by a factor of 180. This shows both the value of a fully optimized HNSW graph and the cost of resource contention while it is being built.

With indexing disabled, the draining phase was essentially nonexistent because there were no indexing optimizations to complete. However, steady-state search was much slower: because Qdrant had to perform brute-force scans, median latency was 256.6 ms, about 60 times higher than the continuously indexed collection after optimization.

In short, continuous indexing incurs a temporary optimization cost after ingestion, whereas disabling indexing provides more consistent but permanently higher query latency.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/a1-a2-latencies.png" alt="Grouped bar chart comparing draining-phase and steady-state search latency for continuous indexing versus indexing disabled, on a log scale from 2 milliseconds to 3 seconds" caption="Continuous indexing pays with a 780 ms median during the roughly 11-minute drain, then settles to a 4.3 ms floor. Indexing disabled skips the drain entirely but never gets below a 256.6 ms median." width="100%" >}}


## `prevent_unoptimized` Buys Speed by Not Searching Everything

With continuous indexing, the experimental `prevent_unoptimized` flag can reduce query latency. When enabled, Qdrant skips segments whose optimizations are running or queued, searching only segments with an already-built HNSW graph.

The latency improvement is substantial: during the draining phase, p50 dropped from 780 ms to 10.2 ms (a 76× improvement), while p95 was 81.3 ms. Optimizations also completed faster (about 9 minutes instead of 11) because search queries no longer competed with optimization work for the same resources.

However, this comes with an important trade-off. Early in ingestion, most segments may still be unoptimized and therefore excluded from search: queries can return few—or no—results, reducing recall until the collection is fully optimized.

`prevent_unoptimized` is therefore a choice between lower, more predictable latency and temporarily incomplete search results. It may be a good fit when reduced recall is acceptable during ingestion, particularly for smaller collections; for large collections with long optimization times, the impact on result coverage should be evaluated carefully.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/a1-a3-latencies.png" alt="Two-panel chart comparing draining-phase latency and drain duration for default continuous indexing versus prevent_unoptimized, one panel on a log scale in milliseconds and one on a linear scale in seconds" caption="prevent_unoptimized cuts median draining latency from 780 ms to 10.2 ms and clears the backlog about two minutes faster, by excluding not-yet-indexed segments from search." width="100%" >}}

## Segment Layout Decides How Long the Backlog Lasts

Another important factor in optimizer performance is the number of segments in a collection. Fewer segments require more work from the `merge` optimizer, but result in a more compact HNSW index and faster searches. More segments reduce or even remove merge activity, but searches must traverse multiple segment-level indexes, which can increase latency.

We tested four configurations: a single segment; Qdrant’s default of one segment per CPU core; four times the number of CPU cores; and a smaller segment size of 100,000 KB (roughly 25,000 1024-dimensional full-precision vectors per segment).

The single-segment configuration was by far the slowest to clear the optimization backlog, taking just over one hour: in addition to indexing work, the `merge` optimizer had to consolidate all data into one segment. By contrast, the 100,000 KB segment-size configuration completed in 283.9 seconds (a 12.7× improvement) because it required no merging.

A single segment also performed poorly during the draining phase: all queries had to hit the same not-yet-fully-optimized segment, keeping latency consistently high. Qdrant’s default configuration provided noticeably better draining latency, as queries could increasingly target already-optimized segments while only a shrinking share reached segments still being indexed.

Adding more segments—either by setting the limit to four times the CPU count or by reducing segment size generally made draining latency slower, spikier, and less predictable than the default. The trade-off was a faster optimization backlog cleanup, as indexing work dominated and less merging was required.

In steady state, however, the single-segment configuration delivered the best search latency: 3.2 ms median, compared with 4.1 ms for the default configuration, 23.9 ms with four times the CPU-core count, and 17.3 ms with 100,000 KB segments.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/b-draining-duration.png" alt="Bar chart of drain duration in seconds across four segment configurations, from a single segment to a 100,000 KB segment size cap" caption="A single segment takes 3,602.1 seconds, just over an hour, to finish indexing. Capping segment size clears the same backlog in 283.9 seconds, a 12.7-fold difference." width="100%" >}}

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/b-draining-latencies.png" alt="Grouped bar chart of draining-phase p50 and p95 search latency, on a log scale, across the same four segment configurations" caption="The single-segment configuration keeps every query slow and uniform during draining. More segments turn that into a shorter, spikier slowdown instead." width="100%" >}}

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/b-steady-latencies.png" alt="Grouped bar chart of steady-state p50 and p95 search latency across the same four segment configurations" caption="Once settled, fewer segments win: the single-segment configuration's 3.2 ms median beats the default's 4.1 ms and is far ahead of the smaller-segment configurations at 17 to 24 ms." width="100%" >}}

## Optimizer Threads: Smoother Queries or a Shorter Wait, Pick One

Optimizers run on the same threads as your Qdrant instance, so controlling their access to the CPU, by limiting or increasing the number of threads they can use, directly controls how fast they clear your collection's backlog and how much CPU capacity remains for search.

Setting both `max_optimizers_threads` and `max_indexing_threads` to 1 stretched the draining window to 3,244.1s, 6.8 times longer than Qdrant's default settings. This came with lower search latency during draining, since optimizers had a limited CPU budget and competed less with search operations: p95 latency was capped at 373.7 ms, less than half of the default configuration's 820.4 ms.

This quantifies the read/write contention tradeoff described in the docs: serializing optimizer work by reducing its CPU budget to a single thread produces smoother, more predictable per-query latency while the backlog clears, at the direct cost of how long that backlog takes to clear.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/c1-c2-threads.png" alt="Two-panel chart comparing draining-phase latency and drain duration for serialized optimizer threads versus Qdrant's default thread auto-selection" caption="Serializing optimizer threads to 1 stretches the drain window to 3,244.1 seconds, 6.8 times longer than default, but caps draining p95 at 373.7 ms versus the default's 820.4 ms." width="100%" >}}


## Vacuum: The Same Deletion, Two Opposite Outcomes

Deletion is another area worth tuning. Like many databases, Qdrant uses soft deletes: a `DELETE` request marks points as deleted, and queries skip them rather than immediately removing them from disk. This keeps delete operations fast, but leaves stale data in storage.

Once the proportion of deleted points exceeds `deleted_threshold`, Qdrant’s `vacuum` optimizer physically removes them. As with indexing, this background write activity can contend with searches.

We compared a 20% threshold with a 50% threshold after deleting roughly 25% of the collection. At 20%, vacuuming was triggered and median search latency rose from 5.0 ms in steady state to 22.7 ms. At 50%, vacuuming did not run, and latency fell from 5.4 ms to 4.3 ms because fewer points remained searchable.

A higher `deleted_threshold` can therefore avoid vacuum-related latency spikes and improve search performance after deletions. The trade-off is increased storage use: soft-deleted points remain on disk for longer. This may be acceptable for smaller datasets, but becomes an important capacity consideration for large collections.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/d-latencies.png" alt="Bar chart of p95 search latency before and after deleting 25 percent of a collection, for a deleted_threshold of 0.2 that triggers vacuum and 0.5 that does not" caption="The same deletion made one collection slower and the other faster: p95 latency rose to 22.7 ms when vacuum ran, but fell to 4.3 ms when deleted_threshold kept vacuum from triggering." width="100%" >}}

## Turning Indexing on Later Reopens the Whole Backlog at Once

Another strategy for keeping read-write contention under control is to turn off optimizations during upload and resume them once the upload finishes.

We tested this by running the benchmark with indexing disabled, then reconfiguring the collection to activate indexing by lowering the indexing threshold, and measuring query latency over 5 rounds of 1,000 queries each. We ran this with both `prevent_unoptimized` set to `true` and `false`.

Without continuous indexing, collections lose the benefit of incremental index buildout during upload, resulting in longer indexing times and higher latency once indexing resumes. However, the two settings handled optimization progress very differently.

With `prevent_unoptimized` set to `false`, optimizers never went idle, and search latency climbed to an overall median of 2.7s, with the tail reaching 12.1s. This happens because search queries arrive continuously, repeatedly hitting partially optimized or fully unoptimized segments, and compete with the optimizers for the same I/O and CPU resources.

With `prevent_unoptimized` set to `true`, blocking queries from touching unoptimized segments let optimization progress much faster, completing by the end of the first round of queries. Latency benefited significantly: p95 came in at 621.7 ms, with a steady-state p95 of just 5.7 ms. As noted earlier, this improvement only applies if a temporary loss of recall and results is acceptable in exchange for better query latency.

{{< figure src="/articles_data/what-qdrant-optimizers-cost-your-queries/charts/e-latencies.png" alt="Line chart of median search latency across three stages, before reconfiguring indexing on, round 0 after, and all 5 rounds after, for default settings versus prevent_unoptimized" caption="Without prevent_unoptimized, median latency climbs to 2.70 seconds and never recovers within 5 rounds. With it, optimization catches up fast and latency lands back near 4.6 ms." width="100%" >}}

## Takeaways

- Turn on `prevent_unoptimized` before a bulk load if incomplete results during that window are acceptable, and switch writes to `wait=false` first if your client defaults to `wait=true`.
- Cap segment size for large loads if slower steady-state queries are an acceptable trade.
- Do not assume serializing optimizer work is free.
- Check `deleted_threshold` against your actual delete pattern, not just the default.
- Budget for a real recovery window after a bulk load, not just the load itself.
- Don't assume flipping indexing on later is gentler than running it from the start.

## Caveats

All 14 configurations ran against the same single-node Qdrant instance, one after another, so absolute latency numbers reflect that specific machine and shouldn't be read as general performance figures. The closed-loop search pattern means our draining-phase samples are biased toward whatever finished fastest; a phase with severe contention produces fewer, noisier samples exactly when you would want more of them.

That machine also ran other work throughout, not just Qdrant, and a latency change inside a benchmark run isn't automatically proof of an optimizer effect. In A2, we monitored the collection's memory via Qdrant's `/collections/{name}/memory` endpoint and found that search latency spiked five to six times at the median exactly when the OS reclaimed memory for other processes and Qdrant's own vector cache dropped with it. In E1, some latency bursts had no such cache signal at all, more consistent with other processes competing for resources than with anything Qdrant was doing. We checked the optimizer status and memory status behind every result in this article before attributing it to indexing, merge, or vacuum specifically rather than to the machine. Both patterns are a caution for self-hosters who co-locate Qdrant with other workloads on the same box. We didn't test Qdrant Cloud, so we can't say whether the same effect shows up there.

## Adjacent Work

- Qdrant's [optimizer docs](/documentation/ops-optimization/optimizer/) describe how the indexing, merge, and vacuum optimizers work and how to configure them.
- The [read-write contention guide](/documentation/ops-optimization/read-write-contention/) explains why search and background optimization compete for the same CPU and I/O.
- The full benchmarks, including harness, scripts, and results, are available on GitHub at [qdrant-labs/optimizers-in-action](https://github.com/qdrant-labs/optimizers-in-action).
