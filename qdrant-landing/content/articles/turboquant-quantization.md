---
title: "TurboQuant in Qdrant: 8× Vector Compression Without the Recall Tax"
short_description: "TurboQuant ships in Qdrant 1.18: 8× vector compression at int8 recall, no calibration set required."
description: "TurboQuant — a new scalar quantization algorithm from Google Research — now ships in Qdrant 1.18, with extensions that make it work on real embeddings. 8× compression at the recall of int8, without per-dataset training or calibration sets."
social_preview_image: /articles_data/turboquant/social_preview.png
small_preview_image: /articles_data/turboquant/turboquant-icon.svg
preview_dir: /articles_data/turboquant/preview
author: Ivan Pleshkov and Jonas Schultz
author_link: https://qdrant.tech
date: 2026-05-04T10:00:00+02:00
draft: false
keywords:
  - quantization
  - turboquant
  - vector-search
  - performance
  - benchmarks
category: qdrant-internals
weight: -200
---

# TurboQuant in Qdrant

If you run production vector workloads, you already know the compression ladder in Qdrant: float32 is the baseline, **Scalar Quantization (SQ)** halves memory four times over with almost no recall hit, and **Binary Quantization (BQ)** packs vectors at 16× or 32× depending on the storage variant, with a steeper recall trade-off that depends heavily on the embedding model.

Qdrant 1.18 ships **TurboQuant** — a new scalar quantization method from [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/), with extensions that make it work on real production embeddings — as an alternative across the same compression range. Summarizing the results of benchmarks on four public datasets:

* **TurboQuant 4-bit** matches SQ recall at half the memory and faster query throughput.
* **TurboQuant 2-bit and 1-bit** match BQ's storage budgets but consistently deliver higher recall across the benchmarked datasets — by roughly 13 percentage points at the 16× class, and by 1–8 pp at the 32× class.
* No external calibration set is required. No per-dataset codebooks to ship or maintain. Calibration is computed inline, per segment.

The recommendation is straightforward: if you currently run SQ or BQ, try the equivalent TurboQuant configuration on a test segment — it is a config change and a re-index. On most embedding models you will see a recall improvement, often a substantial one. Stay on SQ or BQ if throughput drops noticeably for your workload, or if the recall improvement is too small to matter for your use case.

This article walks through what TurboQuant is, what we added on top to make it production-grade, and how it compares to SQ and BQ on four public datasets.

## The Quantization Ladder in Qdrant

Before TurboQuant, Qdrant offered two production-grade quantization paths:

* **[Scalar Quantization (SQ)](https://qdrant.tech/articles/scalar-quantization/)** — int8 per coordinate. 4× compression. Recall is essentially indistinguishable from float32 on most embeddings. The default first step when memory matters.
* **[Binary Quantization (BQ)](https://qdrant.tech/articles/binary-quantization/)** — 1- or 2-bit storage (32× or 16× compression). Recall depends heavily on the embedding model — it works beautifully on isotropic, well-trained models like OpenAI's `text-embedding-3-large`, but degrades sharply on instruction-tuned or contrastive embeddings.

TurboQuant adds a third path with operating points at 8× (4 bits/dim), 16× (2 bits/dim), and 32× (1 bit/dim). At 8× there is no head-to-head — TurboQuant matches SQ recall at half the storage. At 16× and 32× it overlaps with BQ's storage classes, and on the four datasets benchmarked, it consistently delivers higher recall: roughly 13 percentage points above BQ 2-bit at the same 16× storage, and 1–8 pp above the strongest BQ 1-bit configuration at the same 32× storage.

## At a Glance

Recall@10 vs brute-force ground truth, 100K vectors per dataset, HNSW (`m=16`, `ef_construct=128`):

| Dataset | f32 | SQ | **TQ 4-bit** | TQ 2-bit | BQ 2-bit | TQ 1-bit | BQ 1-bit |
|---|---|---|---|---|---|---|---|
| arxiv-instructorxl-768 | 0.916 | 0.913 | **0.902** | **0.817** | 0.675 | **0.678** | 0.598 |
| dbpedia-openai3-large-1536 | 0.934 | 0.933 | **0.927** | **0.880** | 0.750 | **0.792** | 0.780 |
| dbpedia-openai3-small-1536 | 0.936 | 0.934 | **0.929** | **0.883** | 0.761 | **0.796** | 0.788 |
| wiki-cohere-v3-1024 | 0.962 | 0.960 | **0.950** | **0.889** | 0.748 | **0.798** | 0.744 |
| **Compression** | 1× | 4× | **8×** | 16× | 16× | 32× | 32× |

`BQ 1-bit` here is BQ asymmetric (1-bit storage, 8-bit query) — the stronger of the two BQ configurations at this storage class.

Three takeaways worth headlining:

1. **TQ 4-bit matches SQ recall** within ~1 percentage point on every dataset, at half the storage and similar or better throughput.
2. **TQ 2-bit beats BQ 2-bit by ~13 percentage points** on every dataset, at the same 16× storage.
3. **TQ 1-bit beats BQ 1-bit on every dataset**, by 1–8 percentage points — a smaller margin than the 16× class, but still a consistent win at the same 32× storage.

Detailed numbers including throughput and indexing time are [further down](#detailed-benchmarks).

## What Is TurboQuant?

TurboQuant ([Zandieh et al., 2026](https://arxiv.org/abs/2504.19874)) is a scalar quantization algorithm with a clean theoretical recipe:

1. **Apply a random orthogonal rotation** to every vector. This redistributes per-coordinate variance evenly — by the central limit theorem, after rotation each coordinate looks roughly Gaussian with the same variance.
2. **Quantize each coordinate independently** with a fixed Lloyd-Max codebook for the standard normal distribution. One codebook of `2^b` levels for the entire dataset, hard-coded as a small lookup table.
3. **Score** quantized vectors by reconstructing the dot product directly from the codebook indices. The rotation is orthogonal, so it preserves dot products and L2 distances — no need to ever undo it.

The elegance: **no per-dataset training, no calibration set, no codebooks to persist**. The codebook is derived once from the standard normal distribution and is universal — the same lookup table works for every dataset, every dimensionality, every domain. Compare to PQ/OPQ, where a learned codebook must be trained on representative data and shipped alongside the index.

This sounds too good. The catch is that the proof of optimality assumes inputs are uniformly distributed on the unit sphere — that is, **isotropic**. Real embeddings, especially from instruction-tuned or contrastive models, are not. They have a few directions of high variance (the so-called "spike directions") and many directions where almost nothing happens. After rotation those high-variance directions are spread across coordinates, but the per-coordinate variances do not become uniform — and the universal Lloyd-Max codebook ends up wasting bits on regions where no data lives.

This is the gap between vanilla TurboQuant and what we ship in Qdrant.

## What Qdrant Adds

Qdrant's TurboQuant builds on the algorithm with a set of extensions, every one of which is **non-invasive at scoring time** — the production hot path stays a single uniform-weight dot product. The algorithmic extensions described next were designed and implemented by [Ivan Pleshkov](https://github.com/IvanPleshkov); the SIMD-optimized scoring kernels (AVX2 / AVX-512 / NEON) that make those algorithmic changes affordable in the hot path were built by [Jojii](https://github.com/JojiiOfficial). Two companion engineering deep-dives cover the work in detail — see [Further Reading](#further-reading) at the end of this post.

### Length Renormalization

Vanilla TurboQuant has a small but persistent bias: quantized vectors are systematically slightly shorter than the originals (Jensen's inequality, applied to the rounding-to-codebook step). On 4-bit storage this typically costs 5–15 percentage points of recall on anisotropic embeddings.

We measure the bias once at encoding time, store the centroid-norm ratio in the four bytes already reserved per vector for the L2 length, and divide by it at scoring time. This restores per-vector accuracy without changing the scoring formula and without doubling the scoring cost (as the QJL-based PROD variant in the original paper does).

### Per-Coordinate Calibration (Anisotropy Compensation)

This is the headline extension. After rotation, we run a single pre-pass over the segment that estimates a `(shift, scale)` per coordinate, calibrated to **the same probability levels at which the Lloyd-Max codebook places its boundaries**. The calibrated coordinate distribution then lines up with the codebook regardless of how anisotropic the embedding model is.

Two properties are essential:

* **On truly isotropic data, calibration vanishes.** The empirical quantiles match the theoretical Gaussian quantiles, the formula yields `(shift=0, scale=1)`, and the encoded vector is bit-identical to vanilla TurboQuant. So the extension never makes already-good data worse — that is a mathematical guarantee, not an empirical observation.
* **The compensation is paid by the query, not by storage.** The shift and scale fold into a precomputed scaling of the float-precision query vector. Storage stays at exactly `b·D` bits per vector — no per-vector overhead beyond the codebook indices themselves.

### L2 and Unnormalized Dot

Vanilla TurboQuant assumes all inputs live on the unit sphere — i.e. cosine distance only. We extend the algorithm beyond the sphere by storing the L2 length per vector (the same four bytes mentioned earlier). At scoring time, dot products and L2 distances are computed exactly from the stored length and the standard scoring formula. **Cosine, dot, and L2 are all first-class** in Qdrant's TurboQuant.

L1 is not supported — rotation does not preserve the L1 norm, so the entire trick collapses for L1. If your similarity is L1, stick with SQ.

### Integer-Arithmetic Scoring Path

Vanilla TurboQuant scoring uses a codebook lookup (float values) and a float dot product. That works, but on modern CPUs it leaves performance on the table — the data side is already nothing but small integer indices (1 to 4 bits), so the only reason to ever materialize floats is the codebook itself.

We close that gap with one additional step. On top of the codebook indices on the data side, the query — after rotation and anisotropy-compensation prescaling — gets a second-level scalar quantization down to signed `int8` (with `int12` in the 1-bit corner case for accuracy), with a single per-query scaling factor kept separately. The data side stays as bit-packed codebook indices. The entire hot path becomes a stream of small-integer multiply-adds — exactly what AVX-VNNI / AVX-512 / NEON dot-product instructions are built for. The one floating-point operation per pair is the final scaling, applied once at the end of the dot, not per coordinate.

The architectural payoff: scoring throughput is bounded by memory bandwidth on the bit-packed indices rather than by ALU utilization — exactly the regime you want for a production index. The full story of how the SIMD kernels are written is in [Jojii's deep-dive](#further-reading); the design choice on the algorithmic side — keep both sides of the dot product in integer form for as long as possible — is what makes those kernels effective.

## Detailed Benchmarks

Setup: HNSW index (`m=16`, `ef_construct=128`), 100K vectors per dataset, recall@10 vs brute-force ground truth, RPS measured single-threaded on warm caches. SQ uses the standard int8 path. Rows are ordered by storage class so the head-to-head TurboQuant vs BQ comparisons line up.

### arxiv-instructorxl-768-100K

[`Qdrant/arxiv-titles-instructorxl-embeddings`](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings)

| Method | Recall | RPS | Index time (s) |
|---|---|---|---|
| f32 | 0.916 | 551 | 30 |
| SQ | 0.913 | 576 | 15 |
| **TQ 4-bit** | **0.902** | 613 | 20 |
| TQ 2-bit | 0.817 | 568 | 15 |
| BQ 2-bit | 0.675 | 635 | 10 |
| TQ 1-bit | 0.678 | 606 | 15 |
| BQ asymmetric | 0.598 | 644 | 10 |
| BQ vanilla | 0.483 | 637 | 10 |

### dbpedia-openai3-large-1536-100K

[`Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K`](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-1536-100K)

| Method | Recall | RPS | Index time (s) |
|---|---|---|---|
| f32 | 0.934 | 462 | 45 |
| SQ | 0.933 | 520 | 25 |
| **TQ 4-bit** | **0.927** | 495 | 30 |
| TQ 2-bit | 0.880 | 472 | 30 |
| BQ 2-bit | 0.750 | 521 | 15 |
| TQ 1-bit | 0.792 | 492 | 20 |
| BQ asymmetric | 0.780 | 529 | 15 |
| BQ vanilla | 0.692 | 555 | 10 |

### dbpedia-openai3-small-1536-100K

[`Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K`](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K)

| Method | Recall | RPS | Index time (s) |
|---|---|---|---|
| f32 | 0.936 | 455 | 45 |
| SQ | 0.934 | 511 | 25 |
| **TQ 4-bit** | **0.929** | 515 | 25 |
| TQ 2-bit | 0.883 | 513 | 25 |
| BQ 2-bit | 0.761 | 521 | 15 |
| TQ 1-bit | 0.796 | 543 | 15 |
| BQ asymmetric | 0.788 | 519 | 15 |
| BQ vanilla | 0.703 | 543 | 10 |

### wiki-cohere-v3-1024-100K

[`Cohere/wikipedia-2023-11-embed-multilingual-v3`](https://huggingface.co/datasets/Cohere/wikipedia-2023-11-embed-multilingual-v3)

| Method | Recall | RPS | Index time (s) |
|---|---|---|---|
| f32 | 0.962 | 510 | 20 |
| SQ | 0.960 | 534 | 15 |
| **TQ 4-bit** | **0.950** | 531 | 15 |
| TQ 2-bit | 0.889 | 534 | 15 |
| BQ 2-bit | 0.748 | 560 | 10 |
| TQ 1-bit | 0.798 | 494 | 15 |
| BQ asymmetric | 0.744 | 575 | 10 |
| BQ vanilla | 0.650 | 547 | 10 |

The pattern repeats across all four datasets:

* **TQ 4-bit competes with SQ.** Recall within ~1 pp, half the storage, comparable throughput.
* **TQ 2-bit competes with BQ 2-bit** at the same 16× storage class. TQ recall is higher by ~13 pp on every dataset.
* **TQ 1-bit competes with BQ at 1-bit storage** (32× compression). TQ recall is higher by 1–8 pp vs BQ asymmetric (the stronger BQ-1-bit configuration), and by 9–20 pp vs BQ vanilla.

## When to Use TurboQuant

A practical guide:

* **You currently run SQ** → try TQ 4-bit. Similar recall at half the memory, comparable throughput. The upgrade with the smallest reason not to take it.
* **You currently run BQ at any bit depth** → try TurboQuant at the same storage budget (BQ 2-bit → TQ 2-bit, BQ 1-bit → TQ 1-bit). On the benchmarks described here, it consistently delivers higher recall, with the largest margin at the 16× storage class. Stay on BQ if you observe a noticeable drop in throughput on your workload, or if the recall improvement is too small to matter for your use case.
* **You need cosine, dot, or L2** → all three are first-class in TurboQuant. **L1** → stay on SQ.

A word on indexing: TurboQuant has a small one-time pre-pass per segment (the calibration scan) that costs a few seconds at our segment size. Indexing-time numbers in the tables include this pre-pass. Once a segment is calibrated, the calibration is reused across queries and segment merges; it is paid once per segment, never per query.

## How to Enable It

To enable TurboQuant, specify it in the `quantization_config` section of the collection configuration:

```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 1536,
        "distance": "Cosine"
    },
    "quantization_config": {
        "turbo": {
            "always_ram": true
        }
    }
}
```

When enabling TurboQuant on an existing collection, use a `PATCH` request — or the corresponding `update_collection` method in any client SDK — and omit the `vectors` block, since it is already defined.

The `bits` field controls encoding bit depth. It defaults to `bits4`. Available values: `bits4`, `bits2`, `bits1_5`, and `bits1`. Lower bit depths offer higher compression at the cost of accuracy — see the [benchmarks](#detailed-benchmarks) for the recall trade-off on each bit width.

Full reference is in [the quantization docs](https://qdrant.tech/documentation/guides/quantization/).

## What's Next?

TurboQuant ships in **Qdrant 1.18**, available now in Qdrant Cloud and as the standard Docker image. If you are already using SQ or BQ in production, the migration is a config change and a re-index — the rest of your application stays identical.

For implementation details, two engineering deep-dives are available from the engineers who built TurboQuant in Qdrant: Ivan Pleshkov on the algorithmic side (reversible Hadamard rotation, P-Square calibration, anisotropy compensation, the ablation that quantifies each extension's contribution) and Jojii on the SIMD-optimized scoring kernels that turn those algorithmic changes into the throughput numbers in the benchmarks. Links in [Further reading](#further-reading). The Python reference implementation of the algorithmic side is open-source at [turboquant-qdrant-showcase](https://github.com/IvanPleshkov/turboquant-qdrant-showcase) — readable top to bottom, reproducible benchmarks, no SIMD obscuring the math.

If you have a workload where these numbers don't match what you observe, or you want help picking the right operating point, our team hangs out in [Discord](https://qdrant.to/discord) — we are always interested in hearing about embeddings that break our assumptions.

## Further Reading

**Engineering deep-dives by the team that built this:**

* **[TurboQuant in Qdrant: tricks and ideas behind the implementation](https://turbo-quant-personal-site.pleshkov-ivan.workers.dev/blog/turboquant/)** — by Ivan Pleshkov. Every algorithmic extension explained: renormalization, the reversible LCG + Fisher-Yates Hadamard rotation, anisotropy compensation, P-Square calibration, support for L2 and unnormalized dot. Includes the ablation table that quantifies each extension's contribution to recall.
* **[SIMD optimizations for TurboQuant scoring](TODO: link to Jojii's post)** — by Jojii. How the scoring hot path is implemented in Rust with AVX2 / AVX-512 / NEON intrinsics. Bit-packed storage, the 8-bit and 12-bit query precomputation paths, and the kernels that turn the algorithmic ideas into the throughput numbers you see in the benchmarks.

**Background:**

* [TurboQuant: Redefining AI Efficiency with Extreme Compression](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) — the original Google Research blog post.
* [TurboQuant paper (arXiv:2504.19874)](https://arxiv.org/abs/2504.19874) — Zandieh et al., 2026.
* [Interactive TurboQuant explainer](https://arkaung.github.io/interactive-turboquant/) by Arkar Min Aung — a hands-on, step-by-step walkthrough of the algorithm with interactive visualizations. The clearest high-level explanation of TurboQuant available, and a great place to build intuition before reading the paper.
* [Scalar Quantization in Qdrant](https://qdrant.tech/articles/scalar-quantization/) — the int8 baseline this post refers to.
* [Binary Quantization in Qdrant](https://qdrant.tech/articles/binary-quantization/) — the 1-bit baseline this post refers to.
