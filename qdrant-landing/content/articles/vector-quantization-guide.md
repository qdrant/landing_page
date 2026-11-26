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

Vector search bills you for RAM. One 1,536-dimensional float32 vector takes 6 KB, so 100 million of them need 614 GB before you count the HNSW graph, payloads, or a single replica. Quantization shrinks the copy you search by 4x to 64x, and in our runs the best methods kept rescored recall within 0.01 of float32 HNSW.

Each method pays for the memory differently: in recall, in latency, or in constraints on your embeddings. This guide measures those costs across Qdrant's four methods, [Scalar](/documentation/manage-data/quantization/#scalar-quantization), [Binary](/documentation/manage-data/quantization/#binary-quantization), [Product](/documentation/manage-data/quantization/#product-quantization), and [TurboQuant](/documentation/manage-data/quantization/#turboquant-quantization), in a [benchmark you can rerun](https://github.com/qdrant-labs/quantization-comparison-bench). If quantization itself is new to you, [What is vector quantization](/articles/what-is-vector-quantization/) covers the basics.

The diagram compares the raw float32 vector footprint and each quantized search copy with your RAM budget. Set the embedding dimensions, number of vectors, and available RAM to see which copies fit. These sizes exclude the HNSW graph, payloads, and other process overhead.

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

- 4x compression with fast integer SIMD scoring.
- Works without requiring balanced coordinate signs or a high dimension count.
- Supports efficient Manhattan-distance search.

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Compression stops at 4x; tighter RAM budgets need another method.
- Rounding loses precision. Rescoring can recover recall but adds original-vector reads.
- Rescoring is off by default, so enable and measure it explicitly when needed.

</details>

Scalar is a useful alternative when 4x compression is enough, especially for Manhattan distance, which TurboQuant supports only on a slow path. It does not require balanced coordinate signs. One byte per coordinate means 4x is all it can give, so if your RAM budget needs 8x or more, scalar cannot get there on its own.

Each float32 coordinate becomes one `int8`, mapped per segment from the value distribution, and comparisons run as integer SIMD instructions. The `quantile` setting trades precision at the extremes for finer steps within the retained range: clipping outliers lets the same 256 levels cover a narrower interval. In the diagram, switch from "Whole range" to "Quantile 0.99" to exclude the extreme 1% when setting the bounds. Values outside those bounds are clipped to the nearest endpoint, while values inside them are represented with finer steps.

{{< island path="content/articles/headless/vector-quantization-guide/scalar" ratio="7 / 4" >}}
![Scalar quantization: a histogram of float32 values with lower and upper bounds stretched over 256 int8 levels; quantile 0.99 ignores the extreme 1% and makes each level about twice as fine](/articles_data/vector-quantization-guide/method-scalar.svg)
{{< /island >}}

### Binary Quantization

**Sign imbalance** measures how biased coordinate signs are across your vectors. For each coordinate, take the fraction of vectors with a positive value, calculate its absolute difference from 0.5, and average those differences across coordinates. A score of 0 means every coordinate is positive in half the vectors; higher scores mean less balanced signs.

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- 32x compression at one bit per coordinate.
- Fast XOR-and-popcount scoring over packed bits.
- Additional 1.5- and 2-bit encodings preserve more information near zero.

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Recall depends strongly on the signs carrying useful information in your embeddings.
- One-bit encoding discards magnitude and treats small values like large ones.
- Usually needs rescoring and oversampling, increasing reads of the original vectors.
- More bits reduce compression; validate the recall trade-off on your model and corpus.

</details>

Binary combines 32x compression with fast scoring, but its usefulness depends on how much information coordinate signs retain. Product quantization can compress further, up to 64x, with a different search-cost trade-off. Test binary on your corpus and model together; the [sign-imbalance comparison](#binary-quantization-compression-against-recall) shows why dimension count alone is not enough to choose it.

The 1-bit encoding keeps the sign of each coordinate and nothing else, so a comparison collapses to XOR and popcount over packed bits. The diagram shows what the extra bits buy: the 1.5- and 2-bit encodings add a "near zero" bucket that preserves the small coordinates sign-only rounds away, at the cost of compression, 32x down to about 21x and 16x. `query_encoding` can keep the query side at `scalar8bits` or `scalar4bits` while the stored side stays binary.

{{< island path="content/documentation/headless/quantization/bit-depth" width="80%" ratio="2 / 1" >}}
![Binary quantization at 1, 1.5, and 2 bits per dimension](/docs/2-bit-quantization.png)
{{< /island >}}

### Product Quantization

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- Compression ratios from `x4` through `x64`, beyond the one-bit methods' 32x.
- Learns codebooks from your data without requiring balanced coordinate signs.
- Encodes groups of coordinates together, preserving relationships within each group.

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Lookup-table distance calculations cost more search time than SIMD-friendly methods.
- More aggressive compression loses precision and can require more search effort.
- Codebook training adds work during indexing.

</details>

Product quantization trades search speed for the deepest compression, `x4` through `x64`. Distances go through lookup tables rather than SIMD arithmetic, and training the codebook adds indexing work. Consider it when the other methods cannot fit your RAM budget and your latency budget can absorb the extra search cost.

The mechanism: split each vector into sub-vectors and replace each one with the id of its nearest centroid in a codebook of 256 learned from your data, so every sub-vector becomes one byte. Against four bytes per float32 coordinate, `x8` means two coordinates share a byte and `x64` means sixteen do. Because neighboring coordinates are encoded together, it captures structure the per-coordinate methods cannot.

{{< island path="content/articles/headless/vector-quantization-guide/product" ratio="9 / 5" >}}
![Product quantization: a 16-coordinate vector cut into eight sub-vectors, each replaced by a one-byte centroid id, 8 times smaller](/articles_data/vector-quantization-guide/method-product.svg)
{{< /island >}}

### TurboQuant

<details class="qgt qgt--s">
<summary class="qgt__title">Strengths</summary>

- 8x compression at 4 bits, with higher-precision and more-compressed options.
- Rotation reduces sensitivity to uneven coordinate distributions without training a codebook on your collection.
- SIMD-accelerated scoring for cosine, dot-product, and Euclidean distance.

</details>

<details class="qgt qgt--w">
<summary class="qgt__title">Weaknesses</summary>

- Lower bit depths lose more precision and often need rescoring and oversampling.
- Manhattan distance requires a slower reconstruction path; prefer scalar for that metric.
- Quantizing the stored originals with a `turbo*` datatype also reduces rescoring precision. Keep float32 originals when you need full-precision rescoring.

</details>

TurboQuant is a method from [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) that reduces the memory needed to store and search vectors. It first rotates each vector to spread its information more evenly across dimensions. It then rounds each number to a value in a small, predefined lookup table, called a codebook, and stores a short code for that value. The table is prepared in advance, so it doesn't need to be trained on your collection.

Qdrant supports 1-, 1.5-, 2-, and 4-bit encoding, plus an 8-bit option (`bits8`) since v1.20. Fewer bits save more memory (8x compression at 4 bits versus 4x at 8 bits), while more bits preserve more detail. Qdrant also corrects for changes in vector length and differences between dimensions to improve search accuracy. The [TurboQuant article](/articles/turboquant-quantization/) explains how these corrections work.

Switch between 1, 2, and 4 bits in the diagram: the bars show the coordinates before encoding, and the dots show their decoded values. More bits provide more levels, allowing a closer approximation at the cost of a larger search copy. The diagram uses illustrative encoding levels.

{{< island path="content/articles/headless/vector-quantization-guide/turbo" ratio="2 / 1" >}}
![TurboQuant: a vector with one large coordinate before rotation and an even spread after rotation, with the same length](/articles_data/vector-quantization-guide/method-turboquant.svg)
{{< /island >}}

## Rescoring and Oversampling

A quantized vector approximates the original, so searching the compressed copy can miss some of the true nearest neighbors. To reduce that loss, you can use a two-stage search technique:

- **Step 1, oversampling:** the search engine widens the initial pass by fetching a larger pool of approximate candidates than requested (`limit` x `oversampling`) from the fast, compressed HNSW index. For example, with `limit=10` and `oversampling=2.0`, Qdrant retrieves 20 candidates instead of 10. If a true neighbor was ranked 14th, this step gives it a chance to be selected.
- **Step 2, rescoring:** Qdrant recalculates the exact similarity between the query and each candidate using their original, uncompressed vectors, then re-sorts them to return the top `limit` results. A true neighbor that sat at position 14 during the approximate pass can climb into the top 10.

With rescoring enabled, increasing oversampling also means reading more original vectors, which adds work and can increase latency.

![Static comparison: oversampling retrieves 20 candidates for limit 10. Without rescoring, candidate 14 is missed. Rescoring reads all 20 float32 originals and returns candidate 14 at position 4.](/articles_data/vector-quantization-guide/two-stage-search.svg)

*Illustrative ranking: numbers identify candidates by their initial approximate rank. Candidate 14 is a true nearest neighbor that rescoring moves into the returned top 10. Rescoring can only reorder retrieved candidates; it cannot recover a neighbor outside that pool.*

### Example Configuration

This example uses Qdrant and `qdrant-client` v1.20.0, with a local Qdrant server running at `http://localhost:6333`. It keeps float32 originals available for rescoring and pins a 4-bit TurboQuant search copy in RAM. `memory="cold"` leaves the originals on disk without preloading them; reads can still populate the operating system's page cache. Change `size` and `distance` to match your embeddings.

{{< code-snippet path="/documentation/headless/snippets/quantization-guide/create-collection/" >}}

After [uploading your vectors](/documentation/manage-data/points/#upload-points) and allowing indexing to finish, reuse the connected client and set `query_vector` to a 384-value query embedding from the same model used for the collection. The query requests 10 results, retrieves 20 candidates through oversampling, and rescores them against the float32 originals.

{{< code-snippet path="/documentation/headless/snippets/quantization-guide/query/" >}}

These are starting settings to compare on your own data. Try rescoring on and off, and tune `hnsw_ef` and oversampling to meet your recall and latency targets.

## Quantization Trade-Offs <span class="qcolab">[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/Quantization-experiments/quantization-guide/quantization_guide.ipynb)</span> {#quantization-trade-offs-experiment .qcolab-h}

[BEIR (Benchmarking Information Retrieval)](https://github.com/beir-cellar/beir) is a public collection of 18 English retrieval datasets with documents, queries, and human relevance judgments ([Thakur et al., 2021](https://arxiv.org/abs/2104.08663)). We use four with different collection sizes, text lengths, and numbers of relevant documents per query to check whether the trade-offs hold across different retrieval workloads.

### The Four Datasets

- **SciFact:** scientific claim verification; 5,183 documents, averaging 214 words per document and 1.1 relevant documents per query.
- **NFCorpus:** medical information retrieval; 3,633 documents, averaging 232 words per document and 38.2 relevant documents per query.
- **FiQA:** financial question answering; 57,638 documents, averaging 132 words per document and 2.6 relevant documents per query.
- **Quora:** duplicate question retrieval; 522,931 documents, averaging 11 words per document and 1.6 relevant documents per query.

Float32 vector storage for both embedding models is shown together. Sizes are calculated as documents x dimensions x 4 bytes and rounded to MB (1 MB = 1,000,000 bytes); the graph, payloads, replicas, and any quantized search copy are extra.

| Dataset | Cohere 1,024-d (MB) | BGE-small 384-d (MB) |
|---|---:|---:|
| SciFact | 21 | 8 |
| NFCorpus | 15 | 6 |
| FiQA | 236 | 89 |
| Quora | 2,142 | 803 |

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
- **Method coverage:** Product quantization was measured at `x8` and `x16`; `x32`, `x64`, and codebook training time were not measured. The 8-bit TurboQuant comparison used only NFCorpus with BGE on v1.20.0.
- **Selector memory:** The search-copy estimate uses vector count, dimensions, and bits per coordinate, with 12% added for quantized-copy overhead. It does not estimate total process memory.
- **Selector recall:** Estimates use Quora and FiQA with both embedding models at `hnsw_ef` 256 and oversampling 2. For each model, recall is interpolated by sign imbalance, or extrapolated outside the measured range. The two model estimates are blended by log dimension count, with weights clamped to the 384-to-1,024-dimensional range.
- **Selector speed:** p95 latency and throughput are ratios to float32 HNSW on Quora, blended between the two models by the same dimension weights. p95 comes from the pinned-copy comparison; throughput comes from each method's selected setting. `n/m` marks an unmeasured value.

</details>

### Pick a Method for Your Collection

If float32 fits your budget and meets your targets, you can keep it. When you need compression, start by testing 4-bit TurboQuant for cosine, dot-product, or Euclidean distance. The selector prefers it when its estimated recall and memory fit your inputs, with scalar as the alternative for Manhattan distance or a recall target that 4-bit TurboQuant misses. Tighter budgets bring lower-bit encodings and product quantization into consideration. Set your collection size, RAM budget, recall target, and sign imbalance to compare the options. Switch the priority to Speed to choose the fastest measured method that still fits and meets the target.

> **Selector estimates:** Copy memory is calculated from your inputs with an overhead allowance. Recall, p95 latency, and throughput are estimates from this benchmark. Treat the recommendation as a starting point and validate it on your own data. See [Limitations](#limitations).

{{< island path="content/articles/headless/vector-quantization-guide/selector"
    ratio="3 / 4" >}}
This selector needs JavaScript. Without it, use the [decision table in the quantization docs](/documentation/manage-data/quantization/#how-to-choose-the-right-quantization-method).
{{< /island >}}

### Validate on Your Collection

Use the [notebook](https://colab.research.google.com/github/qdrant/examples/blob/Quantization-experiments/quantization-guide/quantization_guide.ipynb) or [benchmark](https://github.com/qdrant-labs/quantization-comparison-bench) for the full experiment. Before adopting a recommendation:

1. **Set the comparison.** Use representative documents and queries with your production embedding model, distance metric, filters, and result limit. Separate queries used for tuning from held-out queries used for the final check.
2. **Establish the float32 baseline.** Use exact float32 search as the recall reference. Measure unquantized float32 HNSW separately as the latency and memory baseline, using the same hardware and index settings as the quantized collection.
3. **Measure recall and tune search effort.** Compare quantized top-k results with the exact baseline. Try rescoring off and on, then adjust oversampling and `hnsw_ef` to meet your recall target. Recheck the chosen settings on held-out queries; include nDCG or your relevance metric when judgments are available.
4. **Check latency under realistic load.** Compare p95 latency and throughput at the concurrency you expect. Test both warm and cold reads if your originals may leave the page cache. Keep rescoring only when its recall gain is worth its cost for your workload.
5. **Measure the memory you actually need.** Compare total process memory after indexing and during search, including the graph, payloads, and cached originals as well as the quantized copy. Check peak memory during index builds. Accept the configuration only if it meets your recall, latency, and memory targets together.

### Limitations

- **One otherwise idle machine:** Compare methods within this experiment; measure latency and throughput on your hardware under your expected load before planning capacity.
- **Eight sign-imbalance observations:** The apparent binary-quantization threshold is evidence from these workloads, not a guarantee for other embeddings. Test binary recall on your own data.
- **Original vectors larger than RAM:** We did not measure steady-state search when the originals permanently exceed RAM. Use `scripts/memory-pressure.sh` from the [benchmark repository](https://github.com/qdrant-labs/quantization-comparison-bench) to test search while the originals are forced out of memory.
- **Selector coverage:** Recall estimates use two models on Quora and FiQA; speed ratios use Quora only. Validate both on your collection. The memory calculation covers the search copy and an overhead allowance, so budget separately for the rest of the process.
- **Fixed recall settings:** The selector's recall estimates use `hnsw_ef` 256 and oversampling 2. Tune and measure these settings for your own targets. `n/m` means a value was not measured, so it cannot support a comparison.
- **Storage-build stability:** One of three builds using `turbo4` originals with a 4-bit search copy returned zero recall on FiQA with BGE. Repeat builds when validating that storage configuration. This is a separate configuration from the 4-bit search copy over float32 originals.

## Measured Trade-Offs

Use these findings to choose what to test, then [validate the choice on your collection](#validate-on-your-collection):

- **When compression is needed, test 4-bit TurboQuant first.** Keep float32 if it already fits and meets your targets; use scalar for Manhattan distance. Compare the [selected recall and latency settings](#oversampling-recall-against-search-effort) and [search-copy memory](#pinned-copies-ram-against-latency).
- **For tighter RAM budgets, compare lower-bit encodings.** TurboQuant retained more recall than binary at equal compression in these runs; binary offered faster scoring. Use the [binary comparison](#binary-quantization-compression-against-recall) to decide what to test. Product can compress further, with more search cost; its `x32` and `x64` settings were not measured here.
- **Add rescoring when its recall gain is worth the reads.** Compare [rescoring off and on](#rescoring-recall-against-extra-reads), then increase oversampling and `hnsw_ef` only as far as your target requires.
- **Treat disk savings as a separate decision.** Test `turbo8` or `turbo16` when disk is the constraint. The [storage-datatype comparison](#storage-datatypes-disk-against-recall) shows the recall cost of compressing the originals used for rescoring.
- **Check the full workload before sizing hardware.** Measure [throughput under load](#throughput-compression-against-queries-per-second), [cold-query latency](#cold-start-ram-against-first-query-latency), and [index-build headroom](#memory-caps-headroom-against-index-builds) on your hardware.

<details class="qgt qgt--n" id="rescoring-recall-against-extra-reads">
<summary class="qgt__title">Rescoring: Recall Against Extra Reads<span class="qgt__kicker">Larger recall gains at 2 bits and below; at most 0.04 ms added to p95 in the Quora runs.</span></summary>

Rescoring buys back recall by reading original vectors. We ran every method with it off and on at `hnsw_ef=256` and oversampling 2, on the two larger corpora.

{{< chart id="quantization-guide/rescoring" caption="Recall@10 against exact float32 search with rescoring off and on, Quora with Cohere 1,024-d vectors (522,931 documents). Qdrant v1.20.0, 8-vCPU VM, hnsw_ef 256, oversampling 2, 150 held-out queries." caption2="Quora with BGE-small 384-d vectors. Low-bit codes lose more on the smaller model, and binary 1-bit stays below 0.85 even rescored." caption3="FiQA with Cohere 1,024-d vectors (57,638 documents)." caption4="FiQA with BGE-small 384-d vectors. Binary 1-bit with rescoring reaches 0.56, the lowest result in the study." >}}

**It matters most at low bit depths.** Scalar, 4-bit TurboQuant, and product `x8` reach 0.99 recall with rescoring and 0.93 to 0.99 without, so for them it is a small correction. At 2 bits and below it is the method. On Quora with Cohere, TurboQuant 2-bit goes from 0.93 to 0.99, TurboQuant 1-bit from 0.86 to 0.98, and binary 1-bit from 0.79 to 0.94. With BGE the same three go from 0.87 to 0.99, 0.77 to 0.94, and 0.68 to 0.84.

**At equal compression, TurboQuant beats binary on every workload.** At 32x on Quora with Cohere, rescored 1-bit TurboQuant returns 0.98 against binary's 0.94, and at 16x 2-bit TurboQuant returns 0.99 against 0.97. On BGE the gaps are 0.94 against 0.84 and 0.99 against 0.92.

**The cost in these warm-cache runs was small.** Rescoring added at most 0.04 ms to server p95 across the Quora runs, because each query reads only 20 candidates, 81,920 bytes in total.

**The 8-bit comparison has narrower coverage.** On NFCorpus with BGE, 8-bit TurboQuant reached 0.988 recall@10 without rescoring against 0.938 for 4-bit. With rescoring and oversampling 2, both reached 0.996. This v1.20.0 comparison was the only workload measured with the 8-bit copy.

</details>

<details class="qgt qgt--n" id="oversampling-recall-against-search-effort">
<summary class="qgt__title">Oversampling: Recall Against Search Effort<span class="qgt__kicker">Scalar and 4-bit TurboQuant met the 0.95 target on all eight workloads at the lowest effort offered, 4-bit at half of scalar's memory.</span></summary>

The target decides the setting: take the cheapest one that reaches it. We set 0.95 recall@10 against exact float32 and swept `hnsw_ef` (64, 128, 256, 512), oversampling (1, 2, 4, 8), and rescoring (off, on) on the 50 development queries only. The rule picks the fastest point with recall@10 of at least 0.95 and nDCG@10 within 0.01 of exact float32, then freezes it for one run on the 150 held-out queries.

Choose a method and metric to inspect its full-width plot. All recall views use the same scale, as do all latency views.

{{< chart id="quantization-guide/tradeoff"
    caption="Scalar int8 on Quora with Cohere 1,024-d vectors: recall@10 across hnsw_ef settings, one line per oversampling factor. Development queries, k=10, rescoring on; dashed line marks the 0.95 target."
    caption2="4-bit TurboQuant on Quora with Cohere 1,024-d vectors: recall@10 across hnsw_ef settings, one line per oversampling factor. Development queries, k=10, rescoring on; dashed line marks the 0.95 target."
    caption3="1-bit binary on Quora with Cohere 1,024-d vectors: recall@10 across hnsw_ef settings, one line per oversampling factor. Development queries, k=10, rescoring on; dashed line marks the 0.95 target."
    caption4="Product x8 on Quora with Cohere 1,024-d vectors: recall@10 across hnsw_ef settings, one line per oversampling factor. Development queries, k=10, rescoring on; dashed line marks the 0.95 target."
    caption5="Scalar int8 on Quora with Cohere 1,024-d vectors: server p95 latency across hnsw_ef settings, one line per oversampling factor. Development sweep, k=10, rescoring on; lower is better."
    caption6="4-bit TurboQuant on Quora with Cohere 1,024-d vectors: server p95 latency across hnsw_ef settings, one line per oversampling factor. Development sweep, k=10, rescoring on; lower is better."
    caption7="1-bit binary on Quora with Cohere 1,024-d vectors: server p95 latency across hnsw_ef settings, one line per oversampling factor. Development sweep, k=10, rescoring on; lower is better."
    caption8="Product x8 on Quora with Cohere 1,024-d vectors: server p95 latency across hnsw_ef settings, one line per oversampling factor. Development sweep, k=10, rescoring on; lower is better." >}}

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

Binary gives 32x compression; product quantization supports up to 64x, although we did not benchmark its `x32` and `x64` settings. At the same 32x compression, 1-bit TurboQuant delivered more recall than binary on every workload we measured. Binary's advantage was XOR-and-popcount scoring, the fastest in these runs at 0.24 ms p95. Test whether that speed advantage is useful at the recall your application needs.

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

- **Keep float32 if it already fits and meets your targets.** When you need compression with cosine, dot-product, or Euclidean distance, start by testing 4-bit TurboQuant. It matched scalar's recall at roughly half the search-copy memory in these runs.
- **Change the method when a constraint calls for it.** Use scalar for Manhattan distance or test it when 4-bit TurboQuant misses your recall target. Try lower-bit encodings for tighter RAM budgets; compare binary when scoring speed matters and your own recall check passes. Product quantization offers ratios beyond 32x, at an additional search cost.
- **Tune rescoring to the workload.** Compare it off and on. Keep it when the recovered recall justifies the extra reads, and increase oversampling only as far as your target requires.
- **Treat compressed storage as a separate choice.** `turbo8` and `turbo16` reduced disk usage with small recall losses in these runs. Quantizing the originals changes what rescoring can recover, so validate that choice separately from the search copy.

Use [Pick a Method for Your Collection](#pick-a-method-for-your-collection) to narrow the candidates, then follow [Validate on Your Collection](#validate-on-your-collection) to check recall, latency, and total memory against your float32 baseline.

## Further Readings

- [Configure quantization](/documentation/manage-data/quantization/): set up the selected method and its search parameters.
- [Choose memory tiers](/documentation/ops-configuration/memory-tiers/): decide where originals, the graph, and the quantized copy should live.
- [Run the comparison benchmark](https://github.com/qdrant-labs/quantization-comparison-bench): reproduce the measurements and adapt the experiment to your workload.
