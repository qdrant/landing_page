---
title: "Vector Quantization in Qdrant: Which Method to Use and What You Trade"
short_description: "Scalar, binary, product, and TurboQuant quantization measured on the same corpora: what each one costs in recall, latency, and memory, and how to pick one."
description: "Scalar, binary, product, and TurboQuant quantization in Qdrant, measured: how each works, what rescoring recovers, and how to choose."
social_preview_image: /articles_data/vector-quantization-guide/preview/social_preview.jpg
preview_dir: /articles_data/vector-quantization-guide/preview
author: Ewa Szyszka
author_link: https://www.linkedin.com/in/ewaszyszka/
date: 2026-11-04T10:00:00+01:00
draft: false
category: production-ops
weight: 9
keywords:
  - quantization
  - scalar quantization
  - binary quantization
  - product quantization
  - turboquant
  - rescoring
  - oversampling
  - memory
---

## Why Quantization Matters

Vector search bills you for RAM. One 1,536-dimensional float32 vector takes 6 KB, so 100 million of them need 614 GB before you count the HNSW graph, payloads, or a single replica. Quantization shrinks the copy you search by 4x to 64x, and in our runs the best methods kept rescored recall within 0.01 of float32 HNSW. Each method pays for the memory differently: in recall, in latency, or in constraints on your embeddings. This guide measures those costs across Qdrant's four methods, [Scalar](/documentation/manage-data/quantization/#scalar-quantization), [Binary](/documentation/manage-data/quantization/#binary-quantization), [Product](/documentation/manage-data/quantization/#product-quantization), and [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), in a [benchmark you can rerun](https://github.com/qdrant-labs/quantization-comparison-bench). If quantization itself is new to you, [What is vector quantization](/articles/what-is-vector-quantization/) covers the basics.

Set your own dimensions, vector count, and RAM to see where float32 stops fitting and what each quantized copy brings back.

{{< island path="content/articles/headless/vector-quantization-guide/scale" ratio="9 / 5" >}}
![Memory for 100M vectors at 1,536 dimensions against 256 GB of RAM: float32 needs 614 GB and exceeds it, scalar int8 needs 154 GB, TurboQuant 4-bit or product x8 needs 77 GB, and binary 1-bit needs 19 GB](/articles_data/vector-quantization-guide/memory-scale.svg)
{{< /island >}}

## The Four Methods

<style>
details.qgt { margin: 1.25rem 0; padding: 0.875rem 1.25rem; border-left: 5px solid var(--qgt-c); border-radius: 6px; background: var(--qgt-bg); }
details.qgt--s { --qgt-c: #1a9d63; --qgt-bg: rgba(26, 157, 99, 0.14); }
details.qgt--w { --qgt-c: #dc244c; --qgt-bg: rgba(220, 36, 76, 0.12); }
details.qgt--n { --qgt-c: #abb1c7; --qgt-bg: rgba(171, 177, 199, 0.14); }
details.qgt > summary.qgt__title { margin: 0 0 0.75rem; font-size: 1.125rem; font-weight: 700; cursor: pointer; }
details.qgt:not([open]) > summary.qgt__title { margin-bottom: 0; }
details.qgt > summary.qgt__title .qgt__kicker { display: block; margin-top: 0.25rem; font-size: 0.875rem; font-weight: 400; line-height: 1.5; }
h2.qcolab-h { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; }
h2.qcolab-h .qcolab { display: inline-flex; font-size: 1rem; }
h2.qcolab-h .qcolab a { display: inline-flex; }
#TableOfContents .qcolab { display: none; }
</style>

### Scalar Quantization

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- 4x memory compression: the pinned copy took 566 MB of heap against 2,142 MB of originals on Quora with Cohere ([memory chart](#pinned-copies-ram-against-latency)).
- [99% accuracy preservation](/articles/scalar-quantization/). In our runs rescored recall was 0.988 to 0.996 across Quora and FiQA with both models ([rescoring chart](#rescoring-recall-against-extra-reads)).
- No constraint on the shape of your embeddings: it met the 0.95 target on all eight held-out workloads, including the ones where binary failed ([selected points](#oversampling-recall-against-search-effort)).
- SIMD optimizations available for int8 operations, enable up to 2x speed improvements beyond the memory benefits: p95 was 0.96 ms against 2.10 ms for float32 HNSW, and throughput 5,567 against 4,187 queries per second on Quora with Cohere ([memory chart](#pinned-copies-ram-against-latency), [throughput](#throughput-compression-against-queries-per-second)).

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Compression stops at 4x. At 8x, 4-bit TurboQuant matched its recall with a 300 MB copy against scalar's 566 MB ([memory chart](#pinned-copies-ram-against-latency)).
- Rescoring is off by default and matters. Without it recall fell to 0.926 on FiQA with BGE, against 0.988 with it ([rescoring chart](#rescoring-recall-against-extra-reads)).
- Slower than binary at the selected points: 0.36 ms against 0.24 ms server p95 on Quora with Cohere, and 5,567 against 6,674 queries per second under eight clients ([selected points](#oversampling-recall-against-search-effort), [throughput](#throughput-compression-against-queries-per-second)).

</details>

Scalar is the method with the fewest assumptions: 4x compression, recall within a point of float32 after rescoring, and no demands on your embeddings. It does not care whether coordinates are centered or how many dimensions you have, and it is the method to use with Manhattan distance, which TurboQuant supports only on a slow path. Its limit is arithmetic. One byte per coordinate means 4x is all it can give, so if your RAM budget needs 8x or more, scalar cannot get there on its own.

Each float32 coordinate becomes one `int8`, mapped per segment from the value distribution, and comparisons run as integer SIMD instructions. The `quantile` setting trades precision at the extremes for finer steps within the retained range: clipping outliers lets the same 256 levels cover a narrower interval. In the diagram, switch from "Whole range" to "Quantile 0.99" to exclude the extreme 1% when setting the bounds. Values outside those bounds are clipped to the nearest endpoint, while values inside them are represented with finer steps.

{{< island path="content/articles/headless/vector-quantization-guide/scalar" ratio="7 / 4" >}}
![Scalar quantization: a histogram of float32 values with lower and upper bounds stretched over 256 int8 levels; quantile 0.99 ignores the extreme 1% and makes each level about twice as fine](/articles_data/vector-quantization-guide/method-scalar.svg)
{{< /island >}}

### Binary Quantization

**Sign imbalance** measures how biased coordinate signs are across your vectors. For each coordinate, take the fraction of vectors with a positive value, calculate its absolute difference from 0.5, and average those differences across coordinates. A score of 0 means every coordinate is positive in half the vectors; higher scores mean less balanced signs.

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- Works best with high-dimensional vectors (1024 dimensions or more), for example OpenAI's text-embedding-ada-002 and Cohere's embed-english-v2.0. In our runs the corpus mattered more than the dimension count: it passed the target on Quora with both models, including 384-dimensional BGE, where sign imbalance is lowest ([sign imbalance table](#binary-quantization-compression-against-recall)).
- The smallest copy: 95 MB of heap against 2,142 MB of originals on Quora with Cohere, which is 32x ([memory chart](#pinned-copies-ram-against-latency)).
- The fastest method wherever it passed: p95 was 0.48 ms against 2.10 ms for float32 HNSW, and throughput 6,674 against 4,187 queries per second on Quora with Cohere ([memory chart](#pinned-copies-ram-against-latency), [throughput](#throughput-compression-against-queries-per-second)).

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Possible accuracy degradation in embeddings that do not have centered value distributions around zero. Best rescored recall fell from 0.998 at a sign imbalance of 0.128 to 0.806 at 0.195, and beyond about 0.19 it never reached 0.95 ([sign imbalance table](#binary-quantization-compression-against-recall)).
- Weak with handling values close to zero (best alternative: [1.5 bit and 2 bit binary quantization](/documentation/manage-data/quantization/#15-bit-and-2-bit-quantization)). Even so, rescored 2-bit reached 0.766 on FiQA with BGE, where 2-bit TurboQuant reached 0.958 ([rescoring chart](#rescoring-recall-against-extra-reads)).
- Depends on rescoring and oversampling. Without rescoring recall was 0.42 to 0.79, and the selected points needed 4x to 8x oversampling every time. Only 4 of 8 workloads met the target ([rescoring chart](#rescoring-recall-against-extra-reads), [selected points](#oversampling-recall-against-search-effort)).
- Less recall than TurboQuant at equal compression: at 32x on Quora, 0.943 against 0.980 with Cohere and 0.838 against 0.938 with BGE ([rescoring chart](#rescoring-recall-against-extra-reads)).

</details>

Binary is the biggest lever and the most conditional one: 32x compression and the fastest scoring Qdrant has, but only when the sign of each coordinate carries information. Whether it does is a property of your corpus and model together, and you can [measure it in seconds](#binary-quantization-compression-against-recall) before you build anything.

The 1-bit encoding keeps the sign of each coordinate and nothing else, so a comparison collapses to XOR and popcount over packed bits. The diagram shows what the extra bits buy: the 1.5- and 2-bit encodings add a "near zero" bucket that preserves the small coordinates sign-only rounds away, at the cost of compression, 32x down to about 21x and 16x. `query_encoding` can keep the query side at `scalar8bits` or `scalar4bits` while the stored side stays binary.

{{< island path="content/documentation/headless/quantization/bit-depth" width="80%" ratio="2 / 1" >}}
![Binary quantization at 1, 1.5, and 2 bits per dimension](/docs/2-bit-quantization.png)
{{< /island >}}

### Product Quantization

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- The largest ratios Qdrant offers, `x4` through `x64`. At `x8` the copy took 297 MB of heap against 2,142 MB of originals on Quora with Cohere ([memory chart](#pinned-copies-ram-against-latency)).
- High recall at `x8`: it met the 0.95 target on all eight held-out workloads, with held-out recall of 0.962 to 0.996 ([selected points](#oversampling-recall-against-search-effort)).
- No dependence on centered embeddings. Rescored `x8` recall was 0.987 on FiQA with BGE, where 1-bit binary reached 0.560 ([rescoring chart](#rescoring-recall-against-extra-reads)).

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- The slowest method at matched recall: 1.16 ms server p95 against 0.29 ms for 4-bit TurboQuant and 0.36 ms for scalar on Quora with Cohere. At fixed search effort it was slower than unquantized float32, 2.32 ms against 2.10 ms ([selected points](#oversampling-recall-against-search-effort), [memory chart](#pinned-copies-ram-against-latency)).
- The only method with lower throughput than unquantized float32: 2,720 queries per second against 4,187 for float32 and 6,138 for 4-bit TurboQuant, and its latency more than doubled with eight clients ([throughput](#throughput-compression-against-queries-per-second)).
- Recall drops as the ratio grows. Rescored `x16` reached 0.905 on FiQA with BGE against 0.987 for `x8` ([rescoring chart](#rescoring-recall-against-extra-reads)). We did not measure `x32` or `x64`.
- Training the codebook adds indexing time. We did not time it.

</details>

Product quantization trades search speed for the deepest compression, `x4` through `x64`. The price is paid at search time: distances go through lookup tables rather than SIMD arithmetic, which made it the slowest method at any given recall in every run we measured, and training the codebook adds indexing time. Choose it when fitting in memory is the only constraint that matters and query latency is not.

The mechanism: split each vector into sub-vectors and replace each one with the id of its nearest centroid in a codebook of 256 learned from your data, so every sub-vector becomes one byte. Against four bytes per float32 coordinate, `x8` means two coordinates share a byte and `x64` means sixteen do. Because neighboring coordinates are encoded together, it captures structure the per-coordinate methods cannot.

{{< island path="content/articles/headless/vector-quantization-guide/product" ratio="9 / 5" >}}
![Product quantization: a 16-coordinate vector cut into eight sub-vectors, each replaced by a one-byte centroid id, 8 times smaller](/articles_data/vector-quantization-guide/method-product.svg)
{{< /island >}}

### TurboQuant

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- 4-bit gives 8x with recall indistinguishable from scalar at half the memory: rescored recall was 0.994, 0.994, 0.996, and 0.988 against scalar's 0.993, 0.993, 0.996, and 0.988, with a 300 MB copy against 566 MB ([rescoring chart](#rescoring-recall-against-extra-reads), [memory chart](#pinned-copies-ram-against-latency)).
- Fast: p95 was 0.69 ms against 2.10 ms for float32 HNSW and 0.96 ms for scalar, and throughput 6,138 against 5,567 queries per second for scalar on Quora with Cohere. It reached the target at `hnsw_ef` 64 on all eight workloads ([memory chart](#pinned-copies-ram-against-latency), [throughput](#throughput-compression-against-queries-per-second), [selected points](#oversampling-recall-against-search-effort)).
- More recall than binary at equal compression. At 16x on Quora with BGE, 2-bit reached 0.985 against 0.920 for binary, and at 32x 1-bit reached 0.938 against 0.838 ([rescoring chart](#rescoring-recall-against-extra-reads)).
- No per-dataset calibration, so it holds up where binary stalls: rescored 1-bit recall was 0.791 on FiQA with BGE against binary's 0.560 ([rescoring chart](#rescoring-recall-against-extra-reads)).
- The 8-bit copy is the most accurate without rescoring: 0.988 recall@10 on NFCorpus with BGE against 0.938 for 4-bit, and with rescoring and oversampling 2 both reached 0.996 (the 8-bit copy was measured on NFCorpus with BGE only, on v1.20.0).

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Low bit depths depend on rescoring. Without it 1-bit recall was 0.610 to 0.863, against 0.791 to 0.980 with it ([rescoring chart](#rescoring-recall-against-extra-reads)).
- Low bit depths still miss on the hardest workload. On FiQA with BGE rescored recall was 0.840 at 1.5 bits and 0.791 at 1 bit ([rescoring chart](#rescoring-recall-against-extra-reads)).
- Manhattan distance works but takes a slow path, so [scalar wins there](/documentation/manage-data/quantization/#distance-metric-support).
- `turbo4` storage loses recall that nothing downstream restores: 0.969 against 0.994 on Quora with Cohere and 0.902 against 0.991 on FiQA with BGE ([storage datatypes](#storage-datatypes-disk-against-recall)).
- The newest method. One of three builds of `turbo4` storage with a 4-bit copy returned zero recall on FiQA with BGE, and the [TurboQuant documentation](/documentation/manage-data/quantization/#turboquant-quantization) advises testing it on your data first ([limitations](#limitations)).

</details>

TurboQuant is a method from [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) that reduces the memory needed to store and search vectors. It first rotates each vector to spread its information more evenly across dimensions. It then rounds each number to a value in a small, predefined lookup table, called a codebook, and stores a short code for that value. The table is prepared in advance, so it doesn't need to be trained on your collection.

Qdrant supports 1-, 1.5-, 2-, and 4-bit encoding, plus an 8-bit option (`bits8`) since v1.20. Fewer bits save more memory (8x compression at 4 bits versus 4x at 8 bits), while more bits preserve more detail: on NFCorpus with BGE embeddings, 8-bit achieved 0.988 recall@10 compared with 0.938 for 4-bit, both without rescoring. Qdrant also corrects for changes in vector length and differences between dimensions to improve search accuracy. The [TurboQuant article](/articles/turboquant-quantization/) explains how these corrections work.

Switch between 1, 2, and 4 bits in the diagram: the bars show the coordinates before encoding, and the dots show their decoded values. More bits provide more levels, allowing a closer approximation at the cost of a larger search copy. The diagram uses illustrative encoding levels.

{{< island path="content/articles/headless/vector-quantization-guide/turbo" ratio="2 / 1" >}}
![TurboQuant: a vector with one large coordinate before rotation and an even spread after rotation, with the same length](/articles_data/vector-quantization-guide/method-turboquant.svg)
{{< /island >}}

## Rescoring and Oversampling

A quantized vector approximates the original, so searching the compressed copy can miss some of the true nearest neighbors. To reduce that loss, you can use a two-stage search technique:

- **Step 1, oversampling:** the search engine widens the initial pass by fetching a larger pool of approximate candidates than requested (`limit` x `oversampling`) from the fast, compressed HNSW index. For example, with `limit=10` and `oversampling=2.0`, Qdrant retrieves 20 candidates instead of 10. If a true neighbor was ranked 14th, this step gives it a chance to be selected.
- **Step 2, rescoring:** Qdrant recalculates the exact similarity between the query and each candidate using their original, uncompressed vectors, then re-sorts them to return the top `limit` results. A true neighbor that sat at position 14 during the approximate pass can climb into the top 10.

With rescoring enabled, increasing oversampling also means reading more original vectors, which adds work and can increase latency.

{{< island path="content/articles/headless/vector-quantization-guide/rescore" ratio="5 / 2" >}}
![Two-stage search: oversampling fetches 20 candidates from the quantized copy, and rescoring re-sorts them with the originals so the true neighbor at rough rank 14 returns in the top 10](/articles_data/vector-quantization-guide/two-stage-search.svg)
{{< /island >}}

## Quantization Trade-Offs Experiment <span class="qcolab">[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/Quantization-experiments/quantization-guide/quantization_guide.ipynb)</span> {#quantization-trade-offs-experiment .qcolab-h}

[BEIR (Benchmarking Information Retrieval)](https://github.com/beir-cellar/beir) is a public collection of 18 English retrieval datasets with documents, queries, and human relevance judgments ([Thakur et al., 2021](https://arxiv.org/abs/2104.08663)). We use four with different collection sizes, text lengths, and numbers of relevant documents per query to check whether the trade-offs hold across different retrieval workloads.

### The Four Datasets

{{< island path="content/articles/headless/vector-quantization-guide/setup" ratio="5 / 2" >}}
![The four BEIR datasets: SciFact, NFCorpus, FiQA, and Quora, with their task, documents, words per document, relevant documents per query, and float32 storage at 1,024 dimensions](/articles_data/vector-quantization-guide/experimental-setup.svg)
{{< /island >}}

We embed each corpus with Cohere embed-english-v3.0 (1,024 dimensions) and BGE-small-en-v1.5 (384 dimensions), then search with cosine distance on L2-normalized vectors. Recall@10 measures overlap with exact float32 search results; nDCG@10 measures ranking quality against the BEIR relevance judgments.

<details class="qgt qgt--n">
<summary class="qgt__title">Protocol Details</summary>

- **Datasets:** Counts, text lengths, and relevance-judgment counts come from Table 1 of the BEIR paper.
- **Embeddings:** Cohere publishes `embed-english-v3.0` vectors for all four datasets, so those runs need no API key. BGE runs locally with 512-token truncation.
- **Environment:** Qdrant v1.20.0 in Docker on a dedicated 8-vCPU, 32 GiB VM.
- **Index:** `m=16`, `ef_construct=100`, and three independently built indexes per configuration.
- **Memory:** The quantized copy is pinned in RAM and the originals stay `cold` (see [memory tiers](/documentation/ops-configuration/memory-tiers/)).
- **Rescoring:** Every query sets rescoring and oversampling explicitly because the defaults differ by method: on for binary and for TurboQuant at 1, 1.5, and 2 bits, off for scalar, product, and 4- and 8-bit TurboQuant.
- **Queries:** Fifty development queries tune each setting and 150 held-out test queries report it.
- **Measurement:** Latency is server-side p95 at concurrency one over five passes, throughput uses eight concurrent clients, the client runs on the same machine as the server, and memory is the Qdrant allocator heap after indexing and a search pass.
- **Stability:** SciFact and NFCorpus were also rerun on their whole test splits, 300 and 323 queries, with no recall moving by more than 0.025 and no pass or fail changing.
- **Selector memory:** The search-copy estimate uses vector count, dimensions, and bits per coordinate, with 12% added for quantized-copy overhead. It does not estimate total process memory.
- **Selector recall:** Estimates use Quora and FiQA with both embedding models at `hnsw_ef` 256 and oversampling 2. For each model, recall is interpolated by sign imbalance, or extrapolated outside the measured range. The two model estimates are blended by log dimension count, with weights clamped to the 384-to-1,024-dimensional range.
- **Selector speed:** p95 latency and throughput are ratios to float32 HNSW on Quora, blended between the two models by the same dimension weights. p95 comes from the pinned-copy comparison; throughput comes from each method's selected setting. `n/m` marks an unmeasured value.

</details>

### Pick a Method for Your Collection

The selector turns the measurements in this guide into a recommendation for your collection. Set the size of the collection, the RAM you can give the quantized copy, the recall you need, and how centered your embeddings are, then compare every method on memory, recall, and speed. The recommendation is the least aggressive method that fits your budget and meets your target. Switch the priority to Speed and it picks the fastest measured method that still meets the target.

> **Selector estimates:** Copy memory is calculated from your inputs with an overhead allowance. Recall, p95 latency, and throughput are estimates from this benchmark. Treat the recommendation as a starting point and validate it on your own data. See [Limitations](#limitations).

{{< island path="content/articles/headless/vector-quantization-guide/selector"
    ratio="3 / 4" >}}
This selector needs JavaScript. Without it, use the [decision table in the quantization docs](/documentation/manage-data/quantization/#how-to-choose-the-right-quantization-method).
{{< /island >}}

### Limitations

- **One otherwise idle machine:** Compare methods within this experiment; measure latency and throughput on your hardware under your expected load before planning capacity.
- **Eight sign-imbalance observations:** The apparent binary-quantization threshold is evidence from these workloads, not a guarantee for other embeddings. Test binary recall on your own data.
- **Original vectors larger than RAM:** We did not measure steady-state search when the originals permanently exceed RAM. Use `scripts/memory-pressure.sh` from the [benchmark repository](https://github.com/qdrant-labs/quantization-comparison-bench) to test search while the originals are forced out of memory.
- **Selector coverage:** Recall estimates use two models on Quora and FiQA; speed ratios use Quora only. Validate both on your collection. The memory calculation covers the search copy and an overhead allowance, so budget separately for the rest of the process.
- **Fixed recall settings:** The selector's recall estimates use `hnsw_ef` 256 and oversampling 2. Tune and measure these settings for your own targets. `n/m` means a value was not measured, so it cannot support a comparison.

## Measured Trade-Offs

Every method buys memory with recall, speed, or both. Each heading carries the key finding; open it for the charts and the evidence.

<details class="qgt qgt--n" id="rescoring-recall-against-extra-reads">
<summary class="qgt__title">Rescoring: Recall Against Extra Reads<span class="qgt__kicker">A small correction at 4 bits and above, the whole method at 2 bits and below, for at most 0.04 ms of p95.</span></summary>

Rescoring buys back recall by reading original vectors. We ran every method with it off and on at `hnsw_ef=256` and oversampling 2, on the two larger corpora.

{{< chart id="quantization-guide/rescoring" caption="Recall@10 against exact float32 search with rescoring off and on, Quora with Cohere 1,024-d vectors (522,931 documents). Qdrant v1.20.0, 8-vCPU VM, hnsw_ef 256, oversampling 2, 150 held-out queries." caption2="Quora with BGE-small 384-d vectors. Low-bit codes lose more on the smaller model, and binary 1-bit stays below 0.85 even rescored." caption3="FiQA with Cohere 1,024-d vectors (57,638 documents)." caption4="FiQA with BGE-small 384-d vectors. Binary 1-bit with rescoring reaches 0.56, the lowest result in the study." >}}

**It matters most at low bit depths.** Scalar, 4-bit TurboQuant, and product `x8` reach 0.99 recall with rescoring and 0.93 to 0.99 without, so for them it is a small correction. At 2 bits and below it is the method. On Quora with Cohere, TurboQuant 2-bit goes from 0.93 to 0.99, TurboQuant 1-bit from 0.86 to 0.98, and binary 1-bit from 0.79 to 0.94. With BGE the same three go from 0.87 to 0.99, 0.77 to 0.94, and 0.68 to 0.84.

**At equal compression, TurboQuant beats binary on every workload.** At 32x on Quora with Cohere, rescored 1-bit TurboQuant returns 0.98 against binary's 0.94, and at 16x 2-bit TurboQuant returns 0.99 against 0.97. On BGE the gaps are 0.94 against 0.84 and 0.99 against 0.92.

**The cost is small.** Rescoring added at most 0.04 ms to server p95 across the Quora runs, because each query reads only 20 candidates, 81,920 bytes in total.

</details>

<details class="qgt qgt--n" id="oversampling-recall-against-search-effort">
<summary class="qgt__title">Oversampling: Recall Against Search Effort<span class="qgt__kicker">Scalar and 4-bit TurboQuant met the 0.95 target on all eight workloads at the lowest effort offered, 4-bit at half of scalar's memory.</span></summary>

The target decides the setting: take the cheapest one that reaches it. We set 0.95 recall@10 against exact float32 and swept `hnsw_ef` (64, 128, 256, 512), oversampling (1, 2, 4, 8), and rescoring (off, on) on the 50 development queries only. The rule picks the fastest point with recall@10 of at least 0.95 and nDCG@10 within 0.01 of exact float32, then freezes it for one run on the 150 held-out queries.

{{< chart id="quantization-guide/tradeoff" caption="Development sweep on Quora with Cohere vectors, k=10, rescoring on: recall@10 by hnsw_ef, one line per oversampling setting. Above oversampling 1, hnsw_ef barely moves recall for scalar and TurboQuant; binary needs oversampling to clear the target at all." caption2="Server p95 for the same sweep. Search effort is what costs latency, and product quantization pays the most for it." >}}

**Search effort buys nothing once the target is met.** For scalar and 4-bit TurboQuant, `hnsw_ef` 64 already clears 0.95, and every step up costs latency. **Oversampling carries binary.** At oversampling 1, binary 1-bit sits at 0.82 however hard the graph searches. **Product quantization pays in latency.** It clears the bar everywhere, but at `hnsw_ef` 512 it takes 3.6 ms against 1.2 ms for TurboQuant.

{{< chart id="quantization-guide/selected" caption="Recall@10 on held-out queries at each method's development-selected point, Cohere 1,024-d vectors on four corpora. Binary 1-bit misses the 0.95 target on NFCorpus; the other methods meet it everywhere." caption2="The same on BGE-small 384-d vectors. Binary 1-bit misses on three of the four corpora and passes only on Quora." caption3="Server p95 at the frozen points with Cohere vectors, 8-vCPU VM, concurrency one. Product quantization costs 2 to 4 times TurboQuant and scalar at matched quality." caption4="Server p95 at the frozen points with BGE vectors." >}}

| Method | Where the sweep landed, k=10 | Met 0.95 on held-out |
|---|---|---|
| Scalar int8 | `hnsw_ef` 64 everywhere; rescoring off on three Cohere workloads, on with 1 to 8x oversampling elsewhere | 8 of 8 |
| TurboQuant 4-bit | `hnsw_ef` 64 everywhere; rescoring off on SciFact and Quora with Cohere, on with 2 to 4x elsewhere | 8 of 8 |
| Product x8 | `hnsw_ef` 64 or 128, rescoring on, 2 to 4x | 8 of 8 |
| Binary 1-bit | `hnsw_ef` 64 to 512, rescoring on, 4x to 8x every time | 4 of 8 |

Scalar and 4-bit TurboQuant hit the target at the lowest effort offered, at 0.17 to 0.36 ms server p95. Product `x8` hits it everywhere but takes 0.43 to 1.17 ms. Binary needs the top of the oversampling grid and still fails on SciFact, NFCorpus, and FiQA with BGE and on NFCorpus with Cohere. Held-out recall tracked development recall within 0.03 at every selected point. The 264-configuration sweep took two minutes on 5,000 documents and half an hour on 523,000.

</details>

<details class="qgt qgt--n" id="binary-quantization-compression-against-recall">
<summary class="qgt__title">Binary Quantization: Compression Against Recall<span class="qgt__kicker">Binary passed only below about 0.19 sign imbalance, and at equal compression TurboQuant beat it on every workload.</span></summary>

Binary gives the most compression, 32x, and its recall can collapse. If the ratio is all you want, 1-bit TurboQuant delivered the same 32x with more recall on every workload we measured, so take that and skip the gamble. What binary alone offers is XOR-and-popcount scoring, the fastest in these runs at 0.24 ms p95, and whether your embeddings can afford it is checkable in advance.

Binary passed on both Quora models, including the 384-dimensional one, and failed on every other BGE workload. The sign of each coordinate explains the split better than the dimension count does.

The table compares sign imbalance with binary's best rescored recall across all eight workloads.

| Corpus and model | Sign imbalance | Best binary 1-bit recall@10 |
|---|---|---|
| Quora, Cohere 1,024-d | 0.128 | 0.998 |
| Quora, BGE 384-d | 0.132 | 0.968 |
| FiQA, Cohere 1,024-d | 0.164 | 0.972 |
| SciFact, Cohere 1,024-d | 0.182 | 0.974 |
| NFCorpus, Cohere 1,024-d | 0.191 | 0.934 |
| FiQA, BGE 384-d | 0.195 | 0.806 |
| SciFact, BGE 384-d | 0.207 | 0.886 |
| NFCorpus, BGE 384-d | 0.235 | 0.806 |

Above about 0.19, binary never reached 0.95 anywhere in the grid. Quora's question texts give more centered embeddings on both models, which is why binary works there. The small model is worse everywhere, so dimensions matter too, but the corpus moves a model across the line. The imbalance takes seconds to compute on a sample of your vectors: below 0.15 binary is worth testing, and above 0.19 it did not pass here.

</details>

<details class="qgt qgt--n" id="storage-datatypes-disk-against-recall">
<summary class="qgt__title">Storage Datatypes: Disk Against Recall<span class="qgt__kicker"><code>turbo8</code> and <code>turbo16</code> halve or quarter the disk for under a point of recall.</span></summary>

A storage datatype shrinks the originals themselves, so it saves disk but leaves nothing at full precision to rescore against. Qdrant has three TurboQuant datatypes: [`turbo16`](/documentation/manage-data/vectors/#turbo16) and [`turbo8`](/documentation/manage-data/vectors/#turbo8), new in v1.20, store each coordinate in 16 and 8 bits, and [`turbo4`](/documentation/manage-data/vectors/#turbo4) stores it in four. We compared float32 originals alone, float32 with a 4-bit TurboQuant copy, `turbo16`, `turbo8`, and `turbo4` with no copy, float32 with a 1-bit copy, and `turbo4` with a 1-bit copy, the smallest configuration Qdrant can build.

{{< chart id="quantization-guide/datatype" caption="Recall@10 at k=10 on Quora with rescoring on and oversampling 2. float32, turbo16, turbo8, and turbo4 are the stored originals; +4-bit and +1-bit add a TurboQuant search copy at that bit depth. turbo16 and turbo8 stay within one point of float32." caption2="The same configurations on FiQA. Every configuration that rescores against turbo4 lands below its float32 counterpart: 0.922 against 0.948 with Cohere and 0.767 against 0.793 with BGE for the 1-bit copy." caption3="Bytes of the stored vectors in the merged segment on Quora; the search copy and the HNSW graph are extra. turbo16, turbo8, and turbo4 hold the originals in a half, a quarter, and an eighth of the float32 space." caption4="The same on FiQA, where even the float32 originals are small: 236 MB with Cohere and 89 MB with BGE." >}}

**`turbo16` and `turbo8` cost almost nothing.** All four workloads stay within one point of float32 recall at half and a quarter of the disk: on Quora with Cohere that is 1,073 MB and 538 MB against 2,142 MB, at 0.991 and 0.990 recall against 0.994. **`turbo4` saves 8x on disk and costs recall.** On Quora it drops to 0.97 against 0.99 for float32 with a 4-bit copy on Cohere, and to 0.95 against 1.00 on BGE. **Rescoring against it inherits the loss.** Every configuration that rescores against `turbo4`, 1-bit copies and binary retrieval alike, lands two to five points below the same configuration over float32; the charts carry the per-workload numbers.

**It's a disk decision.** When disk rather than RAM is the constraint, `turbo8` and `turbo16` are close to free: under a point of recall for half or a quarter of the space. `turbo4` only makes sense when a 2 to 5 point loss, 5 to 10 on the small model, is acceptable. A storage datatype doesn't replace a search copy over float32 originals. And it shrinks the originals themselves, so the only way back out is re-ingesting the collection.

</details>

<details class="qgt qgt--n" id="pinned-copies-ram-against-latency">
<summary class="qgt__title">Pinned Copies: RAM Against Latency<span class="qgt__kicker">Every quantized copy searched faster than float32 on the same graph except product, the only method slower than float32.</span></summary>

A pinned copy costs RAM and buys speed. Quora is large enough for both effects to show.

{{< chart id="quantization-guide/memory" caption="Heap added to the Qdrant process by each search copy on Quora, measured after indexing and a search pass: 566 MB for int8, 300 MB for 4-bit TurboQuant, 297 MB for product x8, and 95 MB for 1-bit binary against 2,142 MB of Cohere originals that stay memory-mapped on disk." caption2="Server p95 at hnsw_ef 256 with rescoring on and oversampling 2 for the same collections. Every quantized copy searches faster than float32 HNSW on the same graph." >}}

**RAM.** The heap lands within 5 to 10% of the arithmetic, a quarter, an eighth, an eighth, and a thirty-second of 2,142 MB plus a few megabytes of bookkeeping, so use that for capacity planning. With the copy pinned and the originals `cold`, resident memory after a search pass was 570 to 1,000 MB for the quantized collections against 1,818 MB for float32, which pulls vectors through the page cache to score anything.

**Latency.** That is why every copy beats float32 HNSW on the same graph. At `hnsw_ef` 256 on Quora with Cohere, float32 reads about 2,850 vectors (11.7 MB) per query and answers in 2.1 ms at p95, against 0.96 ms for int8, 0.69 for 4-bit TurboQuant, and 0.48 for 1-bit binary. Product `x8` takes 2.3 ms, slower than no quantization, which is the lookup-table cost. At the selected points the order holds: 0.24 ms for binary, 0.29 for TurboQuant, 0.36 for scalar, 0.72 for float32, and 1.16 for product.

</details>

<details class="qgt qgt--n" id="throughput-compression-against-queries-per-second">
<summary class="qgt__title">Throughput: Compression Against Queries per Second<span class="qgt__kicker">float32 delivered about 70% of the quantized throughput, product under half.</span></summary>

Concurrency one measures the server. Eight concurrent clients measure how much of the machine each method leaves for other queries.

{{< chart id="quantization-guide/throughput" caption="Queries per second at each method's frozen k=10 point with eight concurrent clients on the same 8-vCPU VM, four workloads. The client and server share the CPUs, so about 7,000 QPS is the ceiling of the machine rather than of any method." caption2="Server p95 under the same load. Product quantization is the only method whose latency more than doubles when clients stack up." >}}

On Quora with Cohere, binary sustains 6,700 queries per second, 4-bit TurboQuant 6,100, scalar 5,600, float32 HNSW 4,200, and product quantization 2,700. The quantized methods bunch near the machine's ceiling, so read the differences, not the absolute numbers: float32 HNSW delivers about 70% of the quantized throughput and product quantization under half, on both corpora large enough to matter.

</details>

<details class="qgt qgt--n" id="cold-start-ram-against-first-query-latency">
<summary class="qgt__title">Cold Start: RAM Against First-Query Latency<span class="qgt__kicker">A pinned quantized copy answered cold queries in about 10 ms where float32 took more than a second.</span></summary>

Every number so far had the originals in the page cache. This run drops the host page cache and restarts the container before each of three passes, then sends the 150 queries once with no warm-up. The first ten requests are the cold figure.

| Quora, Cohere 1,024-d, k=10 | First 10 requests after a cache drop, p50 / p95 | Remaining 140, p50 |
|---|---|---|
| float32 HNSW | 1,342 / 1,772 ms | 631 ms |
| Scalar int8 | 10.6 / 25.7 ms | 9.6 ms |
| TurboQuant 4-bit | 9.1 / 24.3 ms | 8.9 ms |
| Binary 1-bit | 9.1 / 24.3 ms | 8.7 ms |
| Product x8 | 11.3 / 27.8 ms | 10.9 ms |

A pinned copy loads with the process, so a quantized collection answers its first cold query in about ten milliseconds, almost all of it the 20 rescoring reads from disk. Float32 HNSW keeps only the graph in RAM and pulls about 2,850 vectors from disk per query: 1.3 seconds at p50 for the first ten requests and 0.6 seconds for the rest. On Quora with BGE it is 918 ms against 6 to 7 ms, and on FiQA 659 ms against 8 to 10 ms. The quantized collections keep warming past 150 queries, so their tail stays near 9 ms instead of 0.3 ms, but they start from a usable place and float32 does not.

</details>

<details class="qgt qgt--n" id="memory-caps-headroom-against-index-builds">
<summary class="qgt__title">Memory Caps: Headroom Against Index Builds<span class="qgt__kicker">A RAM cap below the originals kills the index build before it ever slows a search.</span></summary>

The trade-off is the RAM cap against a build that finishes. A first attempt capped the container at 1 GiB, below the 2.1 GB of originals. Under the cap the index build was OOM-killed for scalar, binary, TurboQuant, and float32, and only product quantization completed. At 512 MiB on the BGE corpus, three of five builds hit a four-hour timeout. Qdrant needs headroom above the originals to merge segments and build the graph, so a cap below them is a build problem before it is a search problem. We kept the results as a recorded outcome.

</details>

## Conclusion

- Quantization cut the searched copy by 4x to 64x, and the best methods kept rescored recall within 0.01 of float32.
- Scalar int8 is the safe default: it met the 0.95 recall target on all eight workloads at the lowest search effort. 4-bit TurboQuant matched it at half the memory.
- At equal compression TurboQuant beat binary on every workload; binary needs a sign imbalance below about 0.19.
- Keep rescoring on: with oversampling 2 it recovered most of the lost recall for at most 0.04 ms of p95. Every method except product also searched faster than float32.
- When disk is the constraint, `turbo8` and `turbo16` halve or quarter it for under a point of recall.

[Pick a Method for Your Collection](#pick-a-method-for-your-collection) turns these measurements into a recommendation, and the [benchmark](https://github.com/qdrant-labs/quantization-comparison-bench) reruns them on your own workload.

## Further Readings

- [Quantization documentation](/documentation/manage-data/quantization/)
- [What is Vector Quantization?](/articles/what-is-vector-quantization/)
- [Scalar Quantization for Vector Search](/articles/scalar-quantization/)
- [Binary Quantization: 40x Faster Vector Search](/articles/binary-quantization/)
- [Product Quantization for Vector Search](/articles/product-quantization/)
- [TurboQuant in Qdrant](/articles/turboquant-quantization/)
- [Memory tiers](/documentation/ops-configuration/memory-tiers/)
- [Quantization comparison benchmark](https://github.com/qdrant-labs/quantization-comparison-bench), the code behind every number in this guide
- [BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models](https://arxiv.org/abs/2104.08663)
