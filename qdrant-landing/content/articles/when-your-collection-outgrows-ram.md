---
title: "When Your Collection Outgrows RAM"
short_description: "Rescoring reads original vectors back from disk. Measure that read at your own memory cap before you trust a quantization setting."
description: "Set memory placement and rescoring in Qdrant once a collection outgrows RAM: what the disk read costs, and how much quality it recovers."
preview_dir: /articles_data/when-your-collection-outgrows-ram/preview
social_preview_image: /articles_data/when-your-collection-outgrows-ram/preview/social_preview.jpg
weight: -209
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-13T00:00:00+03:00
draft: false
keywords:
  - memory tiers
  - quantization
  - rescoring
  - oversampling
  - TurboQuant
category: search-quality
---

Once a collection no longer fits in RAM, decide which structures stay resident and whether rescoring is worth a disk read.<br>
In hybrid search, quantization can keep a compressed copy of the dense vectors in RAM while the original dense vectors stay on disk. If rescoring is enabled, Qdrant reads those original vectors after the dense prefetch to repair compression errors. The same mechanism applies to dense-only search.

The measurements isolate the dense path. Rerun your full hybrid query before you use them to set a production latency budget.

Use `nDCG@k` on a [labeled baseline](/articles/before-tuning-a-qdrant-collection/) to compare quantization settings in your hybrid query, where `k` matches the result count your product evaluates. Select a configuration on one part of that set, then confirm it on held-out queries that did not take part in selection.<br>
Use `Recall@k` against exact search to measure what quantization changes in the dense prefetch. The latency and Recall@k checks also apply to dense-only search when you do not have labels.

## The Short Version

1. Measure rescoring at the memory cap you deploy with.
2. Pin the quantized vectors and leave the original vectors `cold`. Under a limit that cannot hold them, the operating system evicts original vectors set to `cached` anyway.
3. Choose a quantization method first. If you use TurboQuant, choose its `bits` value and `rescore` setting together. Lower `bits` values use less memory and introduce more approximation error. `rescore` rereads the original vectors to correct the top candidates, trading disk reads for `Recall@k` against exact search.
4. Compare `nDCG@k` on held-out labeled hybrid queries. Use `Recall@k` against exact search to diagnose what changed in the dense prefetch.

## Start with a RAM Estimate

To estimate the RAM required to keep all `float32` dense vectors in memory, use:

```text
RAM = number of vectors × vector dimensions × 4 bytes × 1.5
```

The extra 50% allows for metadata, indexes, point versions, and temporary segments created during optimization. Treat this as a starting estimate, not a container limit. If it exceeds the RAM you can allocate, the rest of this article shows how quantization and rescoring change the trade-off.<br>
For a full collection estimate, including payloads, indexes, and replication, use the [Qdrant Sizing Calculator](https://sizing.qdrant.tech/).

## How Vector Placement Changes Rescoring

Since v1.19, Qdrant sets memory placement per structure with `memory`, replacing the deprecated `on_disk` and `always_ram` flags. The three placements are `cold`, `cached`, and `pinned`. `cold` data loads lazily from disk, so the first request that needs a page waits for it. `cached` data enters the page cache when the collection loads, but the kernel may evict it later. `pinned` data stays in RAM, so the structure has to fit.

This measurement concerns the dense vectors and their quantized copy. In a hybrid query, the dense prefetch scores the quantized vectors during graph traversal, then rereads the original vectors during rescoring. The same placements apply to a dense-only query.<br>
Set both placements explicitly: the default placement for quantized vectors depends on the placement of the original vectors.

Qdrant rejects `pinned` for dense vectors, leaving `cold` and `cached` as the available placements for the originals. The [memory tiers documentation](/documentation/ops-configuration/memory-tiers/) recommends this pairing. The rest of this article measures its latency and disk-read trade-off.

These are our measurements, not production benchmarks. We ran them on the full 4,635,922-document DBPedia-entity dataset, using dense-only search with `all-MiniLM-L6-v2` at 384 dimensions. The original vectors occupy 7.121 GB on disk, and the TurboQuant `bits1` copy occupies 0.260 GB.<br>
Qdrant v1.19.0 ran in Docker on a laptop.

In this dense-only measurement, the same query took about 4 ms while the original vectors remained resident and 43 ms when rescoring reread them under a 4 GiB limit. The query did not change. The memory cap determined whether rescoring stayed in memory or read from disk.

## Rescoring Adds the Disk Read

We ran five rounds for each of six dense-only configurations. The table retains runs with consistent block reads across the warm-up and measured passes. It shows whether rescoring puts original-vector reads on the query path.

| Limit | Original Vectors | Quantized Vectors | `rescore` | Runs | p50 ms, Median [Range] | GB Read, Both Passes |
|---|---|---|---|---|---|---|
| 12 GiB | `cached` | `pinned` | off | 5 | 3.8 [3.1, 4.3] | 0.30 |
| 12 GiB | `cached` | `pinned` | on | 2 | 4.1 [3.8, 4.3] | 0.52 |
| 4 GiB | `cached` | `pinned` | off | 3 | 4.3 [4.0, 4.3] | 0.30 |
| 4 GiB | `cached` | `pinned` | on | 4 | 43.4 [42.7, 47.3] | 2.98 |
| 4 GiB | `cold` | `cached` | on | 3 | 45.7 [42.8, 52.8] | 3.02 |
| 4 GiB | `cold` | `pinned` | on | 3 | 52.0 [43.8, 56.1] | 3.50 |

The ratios matter more than the milliseconds, which come from one laptop. With rescoring off, the memory limit changes almost nothing: 3.8 ms against 4.3 ms, and 0.30 GB read under both limits. That baseline isolates the rescoring cost. Turning it on costs 0.3 ms at 12 GiB and 39 ms at 4 GiB.

The read column explains the gap. At 4 GiB, rescoring read far more data than the selected vectors themselves require because storage reads pages, not individual vectors. That amplification is why the latency increase is much larger than the rescore candidate set suggests.

At 12 GiB, the container held 9.46 GB of file cache and did not reread original-vector pages after they entered cache. At 4 GiB, the Linux kernel recorded 613,388 such rereads across the warm-up and measured passes, after evicting pages the next query needed.<br>
Treat recurring original-vector reads as evidence that rescoring is disk-resident.

<aside role="status">
Latency validation: we excluded 10 of 30 runs with inconsistent read counters or page-cache state. The remaining runs support the comparison. The 12 GiB rescoring row retains only two runs, so treat it as directional.
</aside>

## Memory Placement Cannot Override the Memory Limit

Moving the original vectors from `cached` to `cold` under the 4 GiB limit took the median from 43.4 ms to between 45.7 and 52.0 ms, with ranges that overlap. Five rounds on a laptop cannot separate those.

At 4 GiB, keeping original vectors `cached` did not make rescoring cheaper. The kernel evicted them. `cached` asks the operating system to warm data at startup; it cannot keep data resident past the memory cap.<br>
Pin the quantized vectors, leave the original vectors `cold`, and verify by tracking recurring original-vector reads and block reads under your production memory limit.

## When Rescoring Improves Quality

<aside role="status">
Quality scope: the quality table uses the 200-query held-out set at Qdrant's default `memory` configuration. It does not report latency because sequential query passes warmed the operating system's page cache. The latency table reports the `memory` configurations shown there.
</aside>

An exact search scans every vector and gives the reference result. The graph search is approximate: it can miss exact neighbors in exchange for lower latency. `Recall@10` is the share of the exact top 10 that a configuration returned. `nDCG@10` grades the top 10 against DBPedia's labels, giving more credit to relevant documents near the top.

We selected a candidate on a separate labeled set: the lowest `oversampling` and most aggressive TurboQuant `bits` value within 0.01 `nDCG@10` and 0.02 `Recall@10` of float32. The table reports the held-out result.

| Quantization | `rescore` | `nDCG@10` | `Recall@10` Against Exact |
|---|---|---|---|
| float32 | not applicable | 0.3103 | 0.957 |
| TurboQuant `bits4` | off | 0.3218 | 0.918 |
| TurboQuant `bits4` | on, `oversampling` 4 | 0.3238 | 0.993 |
| TurboQuant `bits1` | off | 0.2786 | 0.605 |
| TurboQuant `bits1` | on, `oversampling` 1 | 0.3114 | 0.951 |
| TurboQuant `bits1` | on, `oversampling` 2 | 0.3128 | 0.977 |
| TurboQuant `bits1` | on, `oversampling` 4 | 0.3178 | 0.988 |

Start with the float32 row. At these graph-search settings, float32 returned 0.957 `Recall@10` against exact search. Approximate graph traversal missed roughly 4% of the exact top 10 before quantization entered the comparison.

In this test, rescoring `bits4` improved dense-prefetch `Recall@10`, but the 200 held-out queries did not establish a meaningful final `nDCG@10` difference. Whether that extra Recall is worth the disk-read cost depends on your hybrid labels and latency target.

`bits1` was different. `rescore` raised `Recall@10` from 0.605 to 0.951. Qdrant [enables `rescore` by default](/documentation/manage-data/quantization/#searching-with-quantization) for `bits1`, `bits1_5`, `bits2`, and binary quantization.

{{< figure src="/articles_data/when-your-collection-outgrows-ram/bits1-rescore-recovery.png" alt="Line chart of the share of the exact top 10 that bits1 returns, across rescore off and rescore on at oversampling 1, 2, and 4. The share jumps from 0.605 with rescore off to 0.951 at oversampling 1, crossing the dashed float32 reference at 0.957, then flattens at 0.977 and 0.988." caption="One rescoring pass does most of the recovery at bits1. Raising oversampling past 1 buys little, which is why the disk reads it adds are the cost to watch." width="100%" >}}

That rule selected `bits1` with `rescore` and `oversampling=1`. On the held-out queries, `nDCG@10` was 0.0011 higher, with a paired 95% interval from -0.003 to +0.005, and `Recall@10` was 0.006 lower.<br>
The interval does not establish identical rankings. On this dataset, it bounds the nDCG@10 difference to 0.005 either way. Check that result on your own labels. If the configuration misses your target, test the next `oversampling` value.

## Consider Other Quantization Methods

This article measures TurboQuant. For a comparison of TurboQuant bit depths across ten datasets, see [TurboQuant in Qdrant](/articles/turboquant-quantization/). If TurboQuant is not the right fit, Qdrant also supports [Scalar, Binary, and Product Quantization](/documentation/manage-data/quantization/).<br>
Choose the method that fits the compression, recall, and latency trade-off you need, then validate it with the same dense-prefetch and held-out hybrid checks.

- [Scalar Quantization](/documentation/manage-data/quantization/#scalar-quantization): converts vector components to `int8`. Start here when moderate compression is enough.

- [Binary Quantization](/documentation/manage-data/quantization/#binary-quantization): a compact, fast option that works best with high-dimensional embeddings whose components have a centered distribution. Measure whether rescoring recovers enough quality for your workload.

- [Product Quantization](/documentation/manage-data/quantization/#product-quantization): prioritizes a smaller memory footprint, with a larger accuracy and search-speed trade-off to validate.

### Turbo4 Removes the Rescoring Option

The [`turbo4` datatype](/documentation/manage-data/vectors/#turbo4) is not TurboQuant. It stores a 4-bit dense-vector representation as the only copy, so there are no original vectors to rescore against.

Use Turbo4 when disk capacity is the constraint and its measured quality meets your target. Use a full-precision vector with quantization when you need `rescore` to recover dense-prefetch quality. This article does not measure Turbo4, so validate it separately on your own queries and labels.

## Verify It on Your Own Collection

If TurboQuant is the quantization method you selected, configure its `bits` value and `memory` setting on the collection you already have. Set `rescore` and `oversampling` on the query, not on the collection.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
)

client.update_collection(
    # Replace with the collection that contains your dense vector.
    collection_name="products",
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            # Replace with the bit depth selected by your evaluation.
            bits=models.TurboQuantBitSize.BITS1,
            memory=models.Memory.PINNED,
        )
    ),
    vectors_config={"dense": models.VectorParamsDiff(memory=models.Memory.COLD)},
)
```

First, compute the exact dense top `k` once for a representative sample of your queries, where `k` matches the result count your product evaluates. This article reports `k=10`. An exact search reads every original vector, so keep the sample small enough for the cost you can accept.<br>
Then run your existing dense prefetch with each `rescore` and `oversampling` variant, changing no other search parameters. `Recall@k` against the exact result shows what quantization changes in the dense prefetch.

For hybrid search, keep the dense prefetch, sparse prefetch, fusion method, and filters that your service already uses. Compare the final result's `nDCG@k` on held-out labeled queries. That is the metric that decides whether the configuration serves your product.

This is an evaluation contract, not a complete script.<br>
Use your existing request, or ask a coding agent to build a small harness with your dense vector name, current prefetches, fusion method, filters, query sample, and labels. It should sweep only `rescore` and `oversampling`, then report dense-prefetch `Recall@k`, final `nDCG@k`, and latency.

On a self-hosted deployment, run the dense-prefetch check under the memory cap you deploy with, from a cold page cache followed by a measured pass. Run `rescore=False` even if you would never ship it, because it shows the cost of the rest of the dense prefetch.<br>
On Qdrant Cloud, measure the full request under its normal operating conditions instead.

Keep the first configuration that meets your held-out `nDCG@k` and latency requirements. Use dense-prefetch `Recall@k` to explain a quality loss. If none qualifies, test another quantization method or a higher `oversampling` value.

## Scope and Next Checks

<aside role="status">
Scope: every figure comes from a dense-only request against one shard on a laptop, with Qdrant running in Docker's Linux VM behind macOS. The cgroup limit evicted mapped original vectors, and block-read counters confirmed recurring disk reads. Do not transfer the latency or disk-read ratios without measuring your own deployment.
</aside>

On a multi-shard hybrid collection, measure the full request on your deployed shard layout. Each shard runs the dense prefetch and rescoring against its own data.<br>
With a `limit` of 200 and `oversampling=1`, rescoring can read up to 200 original vectors per shard: up to 2,400 across 12 shards. That total shapes disk reads and tail latency.

Qdrant's `cold` `memory` tier leaves original vectors on disk until a query accesses them. If you use it, set [`storage.performance.io_uring` to `auto`](/documentation/ops-configuration/memory-tiers/#async-io) in Qdrant v1.19 to issue reads asynchronously when the Linux kernel supports it.<br>
In hybrid search, the sparse prefetch shares the same page cache. Rerun the full request after you set the dense-vector `memory` configuration.

For capacity planning, the [Qdrant Sizing Calculator](https://sizing.qdrant.tech/) estimates the collection size before you set a memory limit.
