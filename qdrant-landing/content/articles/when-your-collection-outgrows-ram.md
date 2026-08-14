---
title: "When Your Collection Outgrows RAM"
short_description: "Rescoring reads original vectors back from disk. Price that read at your own memory cap before you trust a quantization setting."
description: "Set memory placement and rescoring in Qdrant once a collection outgrows RAM: what the disk read costs, and what quality it buys back."
preview_dir: /articles_data/when-your-collection-outgrows-ram/preview
social_preview_image: /articles_data/when-your-collection-outgrows-ram/preview/social_preview.jpg
weight: -209
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-12T00:00:00+03:00
draft: false
keywords:
  - memory tiers
  - quantization
  - rescoring
  - oversampling
  - TurboQuant
category: search-quality
---

Your collection stopped fitting in RAM, so you turned on a quantization class that rescores by default and left it there. Rescoring repairs compression errors by reading the original vectors after the quantized search. With the placement this article recommends, that is the stage of a dense query that reads from disk on every request.

A dense query against 4.6 million vectors took about 4 ms here with the collection resident, and 43 ms under a memory limit too small to hold it. Nothing about the query changed. The placement parameter that looks like it decides which of those you get matters less than the memory cap does.

## The Short Version

1. Price rescoring at your own memory cap rather than on a roomy machine. It cost 0.3 ms when the collection fit and 39 ms when it did not.
2. Pin the quantized vectors and leave the original vectors `cold`. Under a limit that cannot hold them, originals set to `cached` are evicted anyway.
3. Pick the storage class and the rescoring setting together. With rescoring off, TurboQuant `bits4` matched float32 on labeled nDCG@10 here while keeping 0.039 less of the exact top 10, and `bits1` lost 40% of that top 10.
4. Measure retention against an exact search on your own queries before copying an `oversampling` value from anyone, including this article.

## Placement Covers Six Structures, and Two of Them Decide This

Since v1.19, a `memory` parameter sets placement per structure, replacing the deprecated `on_disk` and `always_ram` flags. It has three values. `cold` data loads lazily from disk, so the first request that needs a page waits for it. `cached` data enters the page cache when the collection loads, but the kernel may evict it later. `pinned` data stays in RAM, so the structure has to fit.

Dense search touches two of the six structures. The quantized vectors are what graph traversal scores against, and the original vectors are what a rescore rereads. Write both placements explicitly: the quantized default follows the original vector storage, so changing one silently moves the other.

`pinned` is rejected on dense vector storage by the API validator, which leaves `cold` and `cached` as the real choice for the originals. The [memory tiers documentation](/documentation/ops-configuration/memory-tiers/) recommends this pairing, and the rest of this article prices it.

The measurements use the full 4,635,922-document DBPedia-entity corpus, dense only, embedded with `all-MiniLM-L6-v2` at 384 dimensions. The original vectors occupy 7.121 GB on disk; the TurboQuant `bits1` copy occupies 0.260 GB. Qdrant v1.19.0 runs in Docker on a laptop, with the same collection under a 12 GiB container limit that holds it and a 4 GiB limit that cannot. Every query is one dense `query_points` at `hnsw_ef` 128 and a `limit` of 200.

The latency and quality experiments use different protocols. Each latency cell starts from a cleared page cache, takes a fixed warm-up pass, and reports the second pass over all 400 queries. The quality cells share one container because their measurements do not depend on the cache. They report the 200-query half held back from selection.

## Rescoring Is the Whole Bill

Six configurations, five rounds each. The read column is bytes pulled off the block device across the warm-up and the measured pass together, so a slow row can be traced to the disk it waited on.

| Limit | Original Vectors | Quantized | `rescore` | Runs | p50 ms, Median [Range] | GB Read, Both Passes |
|---|---|---|---|---|---|---|
| 12 GiB | `cached` | `pinned` | off | 5 | 3.8 [3.1, 4.3] | 0.30 |
| 12 GiB | `cached` | `pinned` | on | 2 | 4.1 [3.8, 4.3] | 0.52 |
| 4 GiB | `cached` | `pinned` | off | 3 | 4.3 [4.0, 4.3] | 0.30 |
| 4 GiB | `cached` | `pinned` | on | 4 | 43.4 [42.7, 47.3] | 2.98 |
| 4 GiB | `cold` | `cached` | on | 3 | 45.7 [42.8, 52.8] | 3.02 |
| 4 GiB | `cold` | `pinned` | on | 3 | 52.0 [43.8, 56.1] | 3.50 |

Read the ratios, because the milliseconds belong to one laptop. With rescoring off, the memory limit changes almost nothing: 3.8 ms against 4.3 ms, and 0.30 GB read under both limits. That baseline isolates the rescore. Turning it on costs 0.3 ms when the collection fits and 39 ms when it does not.

The read column explains the gap. Across the warm-up and measured passes, 800 queries moved 2.98 GB off disk to rescore 200 candidates each. Those vectors total 246 MB, so the disk delivered roughly 12 times the bytes the rescore needed. The kernel faults 4 KB pages instead of individual vectors, and every page brings neighboring data with it.

Under the roomy limit, those pages stayed resident: the container ended the pass holding 9.46 GB of file cache, and its refault counter never moved. Under the tight limit, the same counter rose by a median of 613,388 during the measured pass, meaning pages the container had already read were evicted and read again before the next query wanted them. If refaults or major faults climb during your query pass, treat original vectors as disk-resident for rescoring, whatever their placement label says.

## Ten of Thirty Runs Did Not Count

The latency table rests on 20 of the 30 runs we made. That exclusion matters more than the milliseconds.

Every run records the bytes its container read from the block device. We kept a run only when that figure sat within 40% of its cell's median. Ten failed: eight because their reads diverged in either direction, and two because the counter reset when the container was recreated mid-reading.

Three of the eight read roughly half what the other runs read and answered in about a fifth of the time. That is what a cache the protocol was supposed to clear looks like, and the timings alone would not have exposed it.

Repeats buy precision only after you show that each run read the same bytes. The block-read counter is what makes that visible. This check has one weakness: a 40% band is too tight when reads are near zero, which is why the second row keeps only two runs. Its five raw runs still landed between 3.4 and 4.9 ms, so the row's conclusion does not depend on the exclusion.

We discarded one timing set entirely. The quality cells in the next table ran back to back in one long-lived container, so each pass inherited the page cache warmed by the previous one. Their latency became non-monotonic in `oversampling`. Every millisecond in this article therefore comes from the placement runs. The quality numbers remain valid because retention and nDCG do not depend on the cache.

## Placement Is a Request and the Limit Is the Answer

Moving the original vectors from `cached` to `cold` under the 4 GiB limit took the median from 43.4 ms to between 45.7 and 52.0 ms, with ranges that overlap. Five rounds on a laptop cannot separate those.

Leaving originals `cached` in the hope of making rescoring cheap gains close to nothing under a limit that cannot hold them. The kernel evicts them anyway. `cached` is a request for residency, and the cap is the answer. Pin the quantized vectors, leave originals `cold`, and verify with refaults and block reads under your production memory limit.

## The Rereads Only Pay at the Aggressive Storage Class

Quality does not depend on placement, so these cells ran once, at the default placement, against a brute-force exact search over the original vectors. Retention is the share of that exact top 10 the configuration returned. nDCG@10 grades the top 10 against DBPedia's graded labels, giving more credit to relevant documents near the top. The float32 row is a graph search scored against the original vectors, which is what `ignore` on the quantization search parameters gets you while a compressed copy is still on disk.

| Storage Class | `rescore` | nDCG@10 | Retention |
|---|---|---|---|
| float32 | not applicable | 0.3103 | 0.957 |
| TurboQuant `bits4` | off | 0.3218 | 0.918 |
| TurboQuant `bits4` | on, `oversampling` 4 | 0.3238 | 0.993 |
| TurboQuant `bits1` | off | 0.2786 | 0.605 |
| TurboQuant `bits1` | on, `oversampling` 1 | 0.3114 | 0.951 |
| TurboQuant `bits1` | on, `oversampling` 2 | 0.3128 | 0.977 |
| TurboQuant `bits1` | on, `oversampling` 4 | 0.3178 | 0.988 |

Read the retention column, because the nDCG column cannot separate these settings. Every quantized cell except `bits1` without rescoring lands within 0.014 of float32 on nDCG@10, and all five sit nominally above it. With 200 queries, those differences are too small to resolve. Retention separates them: `bits1` alone keeps 60% of the exact top 10, and one rescoring pass at `oversampling` 1 takes that to 95%.

Rescoring earns its cost at one of the two quantized classes here. At `bits4`, the ranking is already within noise of float32 without rescoring. The disk read improves exact-top-10 retention, but the labeled metric cannot distinguish the change, so `bits4` needs no recovery step on this workload. At `bits1`, the same read is the difference between losing two of every five documents from the exact top 10 and losing one in twenty.

Qdrant follows the same shape: [rescoring defaults to on](/documentation/manage-data/quantization/#searching-with-quantization) for `bits1`, `bits1_5`, `bits2`, and binary quantization, and off for everything else. If you turned on an aggressive storage class and never touched the flag, the 43 ms row is the row you are running.

Read float32's own retention of 0.957 before blaming compression for anything. Roughly 4% of the exact top 10 is lost by the graph traversal at these settings, before quantization has done a thing.

We registered the deployment rule before running the experiment. It chooses the smallest storage class within 0.01 nDCG@10 and 0.02 retention of float32, then takes the lowest `oversampling` that clears both. One half of the queries chose the setting, and the other half reported it.

The rule chose TurboQuant `bits1` with rescoring on at `oversampling` 1, and the reporting half confirmed it. There the nDCG@10 difference is 0.0011 in the quantized cell's favor, with a paired 95% interval from -0.003 to +0.005. Retention sits 0.006 below float32.

That interval is the useful part. It does not say the two rankings are the same; it says any difference between them on this corpus is smaller than 0.005 of nDCG@10 either way, for 7.121 GB of vectors compressed to 0.260 GB. Whether that holds on your labels is what the check below is for, and if it misses, step up one `oversampling` level.

## Verify It on Your Own Collection

Set both placements and the storage class in one call against the collection you already have. Applying a quantization class took three and a half minutes on these 4.6 million vectors. Uploading and indexing took 21 minutes; embedding took overnight.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.update_collection(
    collection_name="dbpedia",
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            bits=models.TurboQuantBitSize.BITS1,
            memory=models.Memory("pinned"),
        )
    ),
    vectors_config={"dense": models.VectorParamsDiff(memory=models.Memory("cold"))},
)
```

Then measure both sides of the trade in one pass. The check below reports what a setting keeps of the exact top 10 and what it costs in median milliseconds, which are the two numbers the decision needs.

```python
import time
from statistics import median

from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")
# Your own query vectors, embedded with the model the collection was built with.
queries = [...]


def exact_top10(vector):
    """The reference: a full scan over the original vectors."""
    points = client.query_points(
        collection_name="dbpedia",
        query=vector,
        using="dense",
        limit=10,
        search_params=models.SearchParams(exact=True),
    ).points
    return {point.id for point in points}


def check(rescore, queries, truth, oversampling=1.0, limit=200):
    """Share of the exact top 10 kept, and the median milliseconds it cost."""
    kept, timings = [], []
    for vector, wanted in zip(queries, truth):
        started = time.perf_counter()
        points = client.query_points(
            collection_name="dbpedia",
            query=vector,
            using="dense",
            limit=limit,
            search_params=models.SearchParams(
                hnsw_ef=128,
                quantization=models.QuantizationSearchParams(
                    rescore=rescore, oversampling=oversampling
                ),
            ),
        ).points
        timings.append((time.perf_counter() - started) * 1000)
        kept.append(len({point.id for point in points[:10]} & wanted) / 10)
    return sum(kept) / len(kept), median(timings)


truth = [exact_top10(vector) for vector in queries]
for rescore, oversampling in ((False, 1.0), (True, 1.0), (True, 2.0), (True, 4.0)):
    print(rescore, oversampling, check(rescore, queries, truth, oversampling))
```

Budget for the reference: an exact scan reads every original vector, which took a median of 70 ms per query here with the collection cached and far longer with the originals on disk, so compute `truth` once, on a sample of your queries. Query at the `limit` your pipeline uses rather than at 10, because `oversampling` multiplies that number and sets the disk read size.

Run the whole procedure under the memory cap you deploy with, from a cleared page cache, and take the second pass. Run the `rescore=False` row even if you would never ship it, because it is the only reading that tells you what the rest of the query costs.

The first setting that clears your relevance bar and your latency bar is the answer. If nothing clears both, the three ways out are a larger storage class, more candidates by the procedure in [candidate depth](/articles/candidate-depth/), or accepting the measured loss with a number in hand.

## Where These Numbers Stop

Every figure here comes from one dense request against one shard, on a laptop where Docker's Linux VM sits behind macOS. The cgroup limit evicted the mapped original vectors, and the block-read counters show that the misses were real. The shape transfers; the milliseconds do not.

Multi-shard latency has a different shape, so measure it on your own cluster instead of scaling these figures. One part is predictable: every shard runs the prefetch against its own data and rescores its own candidates. A `limit` of 200 at `oversampling` 1 rereads up to 200 originals per shard, or 2,400 across twelve shards.

Two levers we did not measure are worth checking. Qdrant can issue those rescore reads asynchronously through io_uring, which is off by default and aimed at exactly this case, so check [async I/O](/documentation/ops-configuration/memory-tiers/#async-io) before you accept a disk-read cost. A sparse prefetch in the same request competes for the same page cache, which is why this experiment ran dense only: pick a placement and a recovery setting here, then rerun your own fused request to see the end-to-end number.

Which storage class to compress into is a separate question with a published answer. [TurboQuant in Qdrant](/articles/turboquant-quantization/) benchmarks recall across bit depths on ten datasets, and the [Qdrant sizing calculator](https://sizing.qdrant.tech/) estimates what a collection needs before you pick a limit at all. What those pages leave open is the reread you already pay for, at the memory cap you actually run.
