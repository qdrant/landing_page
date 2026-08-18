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

We built a benchmark harness, loaded 1.76 million Cohere-embedded MS MARCO passages into a single Qdrant node under 14 different optimizer configurations, and measured what search latency looked like while each optimizer worked through its backlog, and after it finished. For one corpus and one machine, this puts a number on the qualitative guidance already in Qdrant's optimizer docs and read-write contention guide.

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

The clearest number in the whole dataset comes from the default configuration: indexing enabled the entire time, no special optimizer settings. We call this run A1, and pair it with A2: the same load with indexing disabled from the start.

| | draining p50 | draining p95 | drain duration | steady p50 | steady p95 |
|---|---|---|---|---|---|
| A1 (default, indexing on) | 780 ms | 2.0 s | 683.7 s | 4.3 ms | 7.6 ms |
| A2 (indexing disabled) | 275.5 ms | 535.1 ms | 4.8 s | 256.6 ms | 1.4 s |

Once the last point lands, Qdrant doesn't finish quickly and go idle. In A1, it took 683.7 seconds, over 11 minutes, for `indexing` and `merge` to clear the backlog left behind by the load. During that window, median search latency was 780 ms, about 180 times the 4.3 ms it settles to once the optimizers actually go idle. The p95 during draining hit 2.0 seconds; some individual queries took as long as 9.8 seconds.

That gap is the whole reason we talk about read-write contention: finishing the embedding upload doesn't mean the collection is ready to serve fast queries, and the distance between those two events, in our A1 test, was over 11 minutes.

A2 shows the other extreme: leave indexing off entirely and there's no backlog to drain. Its draining phase lasts just 4.8 seconds, only as long as it takes to confirm merge has nothing queued. But the steady-state floor never comes down from full-scan territory: a 256.6 ms median, roughly 60 times A1's 4.3 ms, and it stays there for as long as indexing is off. A1 pays a one-time cost of over 11 minutes and then gets a fast floor. A2 pays nothing upfront and never gets one. (A2's steady p95 also carries the cache-drop spikes covered in the Caveats section, so read the 1.4-second figure with that in mind.)

## `prevent_unoptimized` Buys Speed by Not Searching Everything

Qdrant's `prevent_unoptimized` setting (marked experimental in the docs) is supposed to fix exactly this: it stops search from scanning unindexed segments and skips them instead. We tested it alongside continuous indexing in run A3.

| | draining p50 | draining p95 | drain duration |
|---|---|---|---|
| A1 (default) | 780 ms | 2.0 s | 683.7 s |
| A3 (`prevent_unoptimized`) | 10.2 ms | 81.3 ms | 542.7 s |

Median draining latency drops from 780 ms to 10.2 ms, a 76-fold improvement, and the p95 falls from 2.0 seconds to 81.3 ms. The backlog also clears somewhat faster (542.7 seconds instead of 683.7), likely because search is no longer competing for I/O with the optimizer as heavily. A3 also completed 25,533 draining-phase queries in that window, 35 times more than A1's 726, because each query finished faster.

This is a real win, but not a free one. `prevent_unoptimized` gets its speed by excluding not-yet-indexed points from the search results: during that 542.7-second window, A3's queries were technically searching a smaller, evolving subset of the 1.76 million points, not the whole collection.

## Segment Layout Decides How Long the Backlog Lasts

We ran continuous indexing against four segment layouts: one giant segment, Qdrant's own default segment count, four times that many segments, and `max_segment_size_kb` set to 100,000. Qdrant's docs size this parameter at roughly 1 KB per 256-dimensional vector, so for our 1024-dimensional vectors, that setting caps a segment at around 25,000 vectors.

| run | segment config | drain duration | draining p50 | draining p95 | steady p50 | steady p95 |
|---|---|---|---|---|---|---|
| B1 | `default_segment_number=1` | 3,602.1 s | 472.1 ms | 2.2 s | 3.2 ms | 4.6 ms |
| B2 | default (~num CPUs) | 1,026.9 s | 5.2 ms | 2.6 s | 4.1 ms | 5.0 ms |
| B3 | 4x CPU count | 479.5 s | 91.7 ms | 1.5 s | 18.5 ms | 23.9 ms |
| B4 | `max_segment_size_kb=100000` | 283.9 s | 126.7 ms | 639.0 ms | 17.3 ms | 21.2 ms |

The single giant segment (B1) took 3,602.1 seconds, just over an hour, to finish indexing, while capping segment size (B4) cleared the same backlog in 283.9 seconds: a 12.7-fold difference in how long your collection stays in the degraded draining state, from a single collection setting.

B1's draining latency is also uniformly bad: every query has a median of 472 ms, because the entire 1.76 million points sit in one segment, and until that one segment finishes reindexing, every query touches it. B2's default layout shows a very different shape: a 5.2 ms median next to a 2.6-second p95: most queries hit already-indexed segments and finish fast, while a shrinking minority hit whatever segment is currently mid-rebuild. More segments turn one long uniform slowdown into a shorter, spikier one, and B3 and B4 push that further, at the cost of a noticeably higher steady-state floor (17 to 24 ms instead of 3 to 5 ms) once everything settles. This higher latency can be attributed to the fact that queries had to scan through more segments to find matches, as opposed to the one giant segment in B1.

## Optimizer Threads: Smoother Queries or a Shorter Wait, Pick One

We tested `max_optimization_threads` and `max_indexing_threads` on two settings: both set to 1 (serialized) and Qdrant's auto-select default.

| run | thread config | drain duration | draining p50 | draining p95 |
|---|---|---|---|---|
| C1 | serial (1 thread) | 3,244.1 s | 138.4 ms | 373.7 ms |
| C2 | default | 474.4 s | 44.0 ms | 820.4 ms |

Serializing both `max_optimization_threads` and `max_indexing_threads` to 1 stretches the drain window to 3,244.1 seconds, 6.8 times longer than the default's 474.4 seconds, but it also caps the draining p95 at 373.7 ms, less than half of the default's 820.4 ms. We changed both knobs together, not separately, so this is the effect of serializing optimizer work generally rather than either parameter on its own. It still quantifies the read/write contention tradeoff the documentation describes: serializing that work means smoother, more predictable per-query latency while the backlog clears, at the direct cost of how long the backlog takes to clear.

## Vacuum: The Same Deletion, Two Opposite Outcomes

This comparison depends entirely on a threshold most people never touch. We loaded two identical collections, deleted the same 25% of points from each, and compared what happened next. The difference between them was `deleted_threshold`, the fraction of a segment's points that has to be marked deleted before Qdrant will vacuum it.

| run | `deleted_threshold` | vacuum ran? | steady p95 before deletion | latency after deletion |
|---|---|---|---|---|
| D1 | 0.2 | yes | 5.0 ms | p95 22.7 ms |
| D2 | 0.5 | no | 5.4 ms | p95 4.3 ms |

D1's threshold of 0.2 is comfortably below the roughly 25% of each segment that we deleted, so vacuum triggered: the status snapshot right after the deletion showed two vacuum jobs running and four more queued. Search latency paid for it, with p95 jumping from 5.0 ms to 22.7 ms, a 4.5-fold increase, while vacuum worked through the deleted points.

D2's threshold of 0.5 sat above that same 25%, so no segment ever qualified. The status snapshot after its churn showed seven idle segments, nothing running, nothing queued, and a completed-jobs history containing only the original `indexing` runs, never a single vacuum. Because the collection now had 25% fewer points to scan and no optimizer was competing for resources, latency improved: p95 fell from 5.4 ms to 4.3 ms.

The same deletion made one collection slower and the other faster. Between these two runs specifically, `deleted_threshold` was the only thing that changed, and it decided the outcome: `vacuum_min_vector_number` (the minimum segment size vacuum will even consider) was set low enough in both configs that it was never the limiting factor here. It's a second condition worth checking against your own segment sizes, since either one can rule vacuum out.

## Turning Indexing on Later Reopens the Whole Backlog at Once

A1 showed what happens when indexing runs continuously from the first point onward: an 11-minute drain once the upload stops, then a settled floor. The E runs ask a different question: what if a collection sits with indexing off the whole time, reaches a stable steady state doing full scans, and only then gets switched on? We created two collections with indexing disabled from creation (E1 default, E2 with `prevent_unoptimized`), uploaded all 1.76 million points, let each settle, then ran `reconfigure --enable-indexing` and kept searching for five more rounds of 1,000 queries each.

| run | steady p50 before reconfigure | round 0 after (p50 / p95 / max) | all 5 rounds (p50 / p95 / max) |
|---|---|---|---|
| E1 (default) | 254.8 ms | 1.89 s / 5.32 s / 9.4 s | 2.70 s / 7.17 s / 12.1 s |
| E2 (`prevent_unoptimized`) | 238.4 ms | 615.2 ms / 1.64 s / 2.24 s | 4.6 ms / 756.1 ms / 30.0 s |

Right after the reconfigure call, both collections' optimizer status showed the same picture: two indexing jobs already running, four more segments queued, and 1,005,824 points, more than half the collection, still waiting on the backlog. None of the 1.76 million points had ever been indexed before that moment, so switching the setting doesn't ease a collection into indexing: it opens the entire backlog at once.

E1 never closes that backlog within the 5,000-query run. Round-by-round medians swing between 1.35 and 5.31 seconds without ever approaching the 254.8 ms baseline, the overall median lands at 2.70 seconds, more than 10 times that baseline, and the tail reaches 12.1 seconds. At a mean 0.3 queries per second, the whole run took roughly four and a half hours. E2 looks rough for round 0, is still transitioning in round 1 (median already down to 4.6 ms, but a p95 of 621.7 ms and one straggler at 30 seconds), then is fully steady from round 2 on, 4.2 to 4.3 ms median and 5.5 to 5.7 ms p95.

We only measured end-to-end latency, not what the indexing job itself was doing, but the shape is consistent with a feedback loop: without `prevent_unoptimized`, every search runs a full scan over segments indexing hasn't reached yet, and that scan traffic competes with the indexing job for the same CPU and I/O, which slows the backlog down, which keeps the full scans expensive for longer. `prevent_unoptimized` breaks that loop by taking not-yet-indexed segments out of the search path entirely, the same mechanism behind its bulk-load result earlier in this article, triggered by a config change on an already-full collection instead of a load in progress.

## What We Would Do With This

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
