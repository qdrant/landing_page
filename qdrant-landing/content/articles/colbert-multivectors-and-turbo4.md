---
title: "Compressed Multivector Search with Turbo4"
short_description: "How and when to use turbo4 to store ColBERT multivectors"
description: "How and when to use turbo4 to store ColBERT multivectors, and what it costs in terms of recall and latency"
preview_dir: /articles_data/colbert-multivectors-and-turbo4/preview
social_preview_image: /articles_data/colbert-multivectors-and-turbo4/preview/social_preview.jpg
weight: 120
author: Clelia Bertelli
author_link: https://qdrant.tech
date: 2026-09-24T00:00:00+00:00
draft: false
keywords:
  - turbo4
  - multivectors
  - quantization
category: search-quality
---

A single dense vector costs one vector's worth of storage per point: `point_count x embedding_dims`. A ColBERT [multivector](/documentation/manage-data/vectors/#multivectors) costs a vector's worth of storage per token in the point's text, so its storage scales with `point_count x tokens x embedding_dims`, and your chunks can easily go above hundreds of tokens, depending on the size. Multivector storage is a bigger problem than dense vector storage for exactly that reason, and it is one of the problems that [Turbo4](/documentation/manage-data/vectors/#turbo4) can mitigate.

Turbo4 is the storage format built on [TurboQuant's math](/articles/turboquant-quantization/). Where scalar, product, and binary [quantization](/documentation/manage-data/quantization/) in Qdrant keep the original full-precision vector on disk alongside a separate compressed copy, Turbo4 is used as the vector's native [storage datatype](/documentation/manage-data/vectors/#datatypes), so there is no second copy to keep. The saving is on storage first, and on memory only as a consequence, since loading fewer bytes per vector also uses less RAM once loaded. Against the multivector cost above, Turbo4 cuts storage by 8x compared to `float32`, 4x compared to `float16`, and 2x compared to Qdrant's other compact native datatype, `uint8`.

Whether those savings hold up once ColBERT is doing the final rescoring pass is a separate question from whether they hold up during dense prefetch. ColBERT rescoring compares every query token vector against every point token vector and keeps the maximum similarity per token, a scoring method called MaxSim, which is a lot more individual comparisons per point than a single dense vector search runs, and every one of them reads the multivector directly. Quantizing the vectors used for prefetch is a different bet from quantizing the vectors MaxSim itself reads, so it is not obvious ahead of time whether Turbo4's storage savings come at a quality or latency cost once ColBERT is the thing scoring the result.

We ran that comparison directly, across five BEIR datasets, eight datatype and quantization configurations applied to the multivectors themselves, and a distributed benchmark harness built on Kubernetes. This article lays out the benchmark design and what the results say about Turbo4 specifically: where it matches full precision, where it does not, and which configuration to reach for when storage is the constraint.

![ColBERT multivectors scale their storage based not only on the number of oints and embeddings dimensions, but also on how many vectors each point holds](/articles_data/colbert-multivectors-and-turbo4/multivector-storage.png)

## Benchmark Design

The corpus for each dataset came pre-embedded with Cohere's Embed v3 model, sourced from [`CohereLabs/beir-embed-english-v3`](https://huggingface.co/datasets/CohereLabs/beir-embed-english-v3) on Hugging Face. Using pre-embedded data meant every configuration searched the same vectors, so any difference in results came from the quantization scheme and the search path, not from re-embedding variance between runs. The five datasets were `trec-covid`, `scidocs`, and three `CQADupStack` subsets (`unix`, `gaming`, and `android`), chosen for having under a million points each so a full sweep stayed affordable on a single collection.

Each dataset ran on its own Qdrant Cloud collection, sized at 16 GB of RAM and 4 vCPUs. Every collection held three vector types: the Cohere Embed v3 dense vectors, a BM25 sparse vector computed server side through [Qdrant Cloud Inference](/documentation/inference/cloud-inference/), and a ColBERT multivector computed with `answerdotai/answerai-colbert-small-v1`, also server side. 

A query ran dense and sparse prefetch in parallel, fused the two candidate lists with reciprocal rank fusion, then reordered the fused list with ColBERT MaxSim as the final rescoring stage. That two-stage shape, a fast fused prefetch followed by a more expensive multivector rescore, is what makes the quantization question interesting in the first place: prefetch only has to get the right points into the candidate set, but rescoring has to score them accurately.

We tested eight configurations, each applying the same datatype or quantization scheme to both the dense prefetch vectors and the ColBERT multivectors, with the sparse vectors left unchanged in every case. Applying the scheme to the multivector layer directly, not only to the dense vectors used for prefetch, is what lets this benchmark answer whether Turbo4 holds up under MaxSim specifically, rather than only under dense search:

- `float32`, no quantization, the baseline
- `float16`, no quantization
- `turbo4`, no quantization
- Scalar quantization to `int8`
- Product quantization at 16x compression
- Binary quantization on a `float32` base
- Binary quantization on a `float16` base
- TurboQuant quantization to 1 bit on a `turbo4` base

![The turbo4 datatype does not store full-precision embedding copies, allowing for substantial storage gains against other datatypes and quantization configurations](/articles_data/colbert-multivectors-and-turbo4/turbo4.png)

The compression settings for the multivectors were not always identical to the dense vector's, since the multivectors have far fewer dimensions per vector and can take a lighter compression at the same effective ratio. Product quantization, for instance, ran at 16x compression on the dense vectors and 8x on the multivectors within the same configuration. The datatype or quantization family was always the same across both, which is the comparison this article reports.

For each configuration, we measured retrieval quality (recall, mean reciprocal rank - MRR, and normalized discounted cumulative gain - NDCG, all at k=20), latency percentiles, and throughput at a concurrency of eight. The comparisons in this article use a prefetch limit of 100, the widest candidate pool in the sweep and the setting where quantization has the most headroom to either hold up or fall apart, since a narrow prefetch pool would hide quality loss that shows up once ColBERT has more candidates to rank.

## Running the Sweep with Kubench

Eight quantization configurations, five datasets, and a full grid of prefetch limits, k values, and rescoring modes adds up to well over a hundred benchmark runs per dataset, and a lot of sequential runtime if it all queues behind one machine. We used a tool developed internally, [kubench](https://github.com/qdrant-labs/kubench), to spread the sweep across several machines in a small Kubernetes cluster instead. Kubench builds a container image, pushes it to a shared registry, and submits the benchmark as a Kubernetes job, so each dataset's sweep runs as an independent job that can land on whichever machine in the cluster has room for it. 

That let multiple datasets' sweeps run in parallel rather than one after another, which is the only part of this setup worth calling out: the benchmark design above does not depend on how the jobs were scheduled, but running them in parallel is what made a five-dataset, eight-configuration sweep finish in a reasonable amount of time (~24h vs an estimated ~65h of running them sequentially).

![A visualization of the kubench benchmark harness](/articles_data/colbert-multivectors-and-turbo4/kubench.png)

## What the Results Show

Averaged across all five datasets, at `k=20` and a prefetch limit of 100, quality differences between quantization schemes were small and mostly within the range you would expect from single-run variance. Table 1 shows the change in ranking quality and typical latency for each configuration, relative to the float32 baseline.

| Configuration | NDCG@20 vs baseline | Recall@20 vs baseline | p50 latency vs baseline |
|---|---|---|---|
| Float32, no quantization | baseline | baseline | baseline |
| Float16, no quantization | 0.0% | -0.1% | +1.3% |
| Turbo4, no quantization | -0.4% | -0.6% | +4.1% |
| Scalar int8 | -0.3% | -0.4% | -0.5% |
| Product x16 | -0.8% | -1.3% | +15.7% |
| Binary, float32 base | -0.6% | -1.1% | +4.1% |
| Binary, float16 base | -0.5% | -1.3% | +3.5% |
| Turbo4, 1 bit | -1.7% | -4.1% | +27.5% |

Turbo4 with no quantization tracks the float32 baseline closely: under a percentage point of quality difference on both metrics, and a p50 latency increase small enough that it is unlikely to matter in practice. That holds across all five datasets, not just on average, which is the more useful thing to know if you are deciding whether Turbo4 is safe for your own ColBERT rescoring path.

Turbo4 quantized to 1 bit is the outlier, which matters because it is easy to assume every quantization level of the same datatype behaves the same way. It lost more recall than any other configuration in the sweep, including binary quantization on a float32 base, and it was also the slowest at the median. That pattern showed up on each of the five datasets individually: 1-bit Turbo4 trailed its own no-quantization sibling and every other quantization scheme on both quality and latency. If you are choosing a quantization level for Turbo4 specifically, test the 1-bit setting on your own data before relying on it, since it does not inherit the no-quantization variant's near-parity with float32.

Here is, for instance, the chart showing results from the runs on `CQADupStack` (gaming subset):

![Search quality results for CQADupStack, gaming subset, reporting recall@20, MRR@20 and NDCG@20](/articles_data/colbert-multivectors-and-turbo4/results.png)

Tail latency (p99) tracked which dataset was running more than which quantization scheme was in use, swinging by more than double the baseline in places. That is dataset and network variance from a single run, not a quantization effect. Measure p99 directly on your own deployment if it matters for your workload.

## When to Reach for Turbo4

If you already have reasons to use Turbo4, for instance a large multivector collection where storage is the binding constraint, this benchmark gives you a reasonable expectation for what happens once you add ColBERT rescoring on top: quality holds close to full precision, and typical latency moves by a few percent, not by a step change. That is true specifically for the no-quantization Turbo4 configuration. It is not a blanket endorsement of every quantization level available on the datatype, and the 1-bit configuration in this sweep is the clearest counterexample we found.

If you are not already committed to Turbo4 and are choosing a quantization scheme from scratch for a ColBERT rescoring pipeline, this benchmark points to two different configurations depending on what you are optimizing for. Float16 with no quantization stayed closest to the float32 baseline on quality, with less than a tenth of a percent of recall lost. Scalar quantization to int8 gave up a little more quality, under half a percent on both metrics, but was the only configuration in the sweep with a lower p50 latency than the baseline. Neither result is a universal ranking, since it reflects these five datasets and this benchmark design, so run the comparison on your own corpus before treating it as settled. The one config worth deprioritizing on the evidence here is 1-bit Turbo4, unless a test on your own data shows different results than it did on the datasets we benchmarked.

## Related Work

- The code and results for the full benchmark can be found in the [qdrant-labs/hybrid-comparisons](https://github.com/qdrant-labs/hybrid-comparisons) GitHub repository
- [Vector types and storage datatypes](/documentation/manage-data/vectors/)
- [Quantization](/documentation/manage-data/quantization/)
- [TurboQuant implementation in Qdrant](/articles/turboquant-quantization/)
