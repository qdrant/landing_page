---
title: "TurboQuant in Qdrant"
short_description: "TurboQuant ships in Qdrant 1.18"
description: "TurboQuant — a new rotation-based vector quantization algorithm from Google Research — now ships in Qdrant 1.18, with extensions that make it work on real embeddings."
social_preview_image: /articles_data/turboquant/social_preview.png
small_preview_image: /articles_data/turboquant/turboquant-icon.svg
preview_dir: /articles_data/turboquant/preview
author: Ivan Pleshkov and Jonas Schulz
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

If you run production vector workloads, you already know the compression ladder in Qdrant: float32 is the baseline, **Scalar Quantization (SQ)** compresses vectors by 4× with almost no recall hit, and **Binary Quantization (BQ)** packs vectors at 16× or 32× depending on the storage variant, with a steeper recall trade-off that depends heavily on the embedding model.

Qdrant 1.18 ships **TurboQuant** — a new rotation-based vector quantization method from [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/), with extensions that make it work on real production embeddings. Summarizing the results of benchmarks across public embedding datasets:

* **TurboQuant 4-bit** is competitive with SQ across the board — within ~1–2 percentage points on most datasets, and sometimes *ahead* of SQ (where the SQ int8 grid struggles with the embedding distribution).
* **TurboQuant 2-bit and 1-bit** match BQ's storage budgets but consistently deliver substantially higher recall.

The recommendation is straightforward: if you currently run SQ or BQ, try the equivalent TurboQuant configuration on a test subset of your data — it is a config change and a re-index. What you gain depends on where you start: **SQ → TQ 4-bit** is a memory win at the competitive recall (half the storage, recall within ~1–2 pp on most embeddings); **BQ → TurboQuant at the same storage class** is a recall win at the same memory (typically 10–20 pp higher recall, on every embedding model we have benchmarked).

This article walks through what TurboQuant is, what we added on top to make it production-grade, and how it compares to SQ and BQ across public embedding datasets.

## The Quantization Ladder in Qdrant

Before TurboQuant, Qdrant offered production-grade quantization paths:

* **[Scalar Quantization (SQ)](https://qdrant.tech/articles/scalar-quantization/)** — int8 per coordinate. 4× compression. Recall is essentially indistinguishable from float32 on most embeddings. The default first step when memory matters.
* **[Binary Quantization (BQ)](https://qdrant.tech/articles/binary-quantization/)** — 1- or 2-bit storage (32× or 16× compression). Recall depends heavily on the embedding model — it works beautifully on isotropic, well-trained models.

TurboQuant adds a new path with four operating points: 8× (4 bits/dim), 16× (2 bits/dim), ~21× (1.5 bits/dim), and 32× (1 bit/dim).

### Enabling TurboQuant

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

When enabling TurboQuant on an existing collection, use a `PATCH` request — or the corresponding `update_collection` method in any client SDK.

The `bits` field controls encoding bit depth. It defaults to `bits4`. Available values: `bits4`, `bits2`, `bits1_5`, and `bits1`. Lower bit depths offer higher compression at the cost of accuracy — see the [benchmarks](#detailed-benchmarks) for the recall trade-off on each bit width. Full reference is in [the quantization docs](https://qdrant.tech/documentation/guides/quantization/).

## At a Glance

Recall@10, HNSW (`m=16`, `ef_construct=128`). Four datasets shown here for orientation; the full dataset table is [further down](#detailed-benchmarks).

| Dataset | f32 | SQ | **TQ 4-bit** | TQ 2-bit | BQ 2-bit | TQ 1-bit | BQ 1-bit |
|---|---|---|---|---|---|---|---|
| [arxiv-instructorxl-768](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings) | 0.9419 | 0.9285 | **0.9193** | **0.8227** | 0.6756 | **0.6763** | 0.4683 |
| dbpedia-gemini [TODO link] | 0.9167 | 0.9134 | **0.9020** | **0.8170** | 0.6689 | **0.6990** | 0.4945 |
| dbpedia-openai-ada [TODO link] | 0.9625 | 0.8839 | **0.9299** | **0.8480** | 0.7332 | **0.7356** | 0.6098 |
| [wiki-cohere-v3-1024](https://huggingface.co/datasets/Cohere/wikipedia-2023-11-embed-multilingual-v3) | 0.9446 | 0.9014 | **0.9271** | **0.8303** | 0.6880 | **0.6300** | 0.5409 |
| **Compression** | 1× | 4× | **8×** | 16× | 16× | 32× | 32× |

`BQ 1-bit` is the vanilla 1-bit configuration (1-bit storage, 1-bit query). The asymmetric variant (8-bit query) is included separately in the [detailed table](#detailed-benchmarks).

Three main observations:

1. **TQ 4-bit is competitive with SQ at half the storage.** On `arxiv-instructorxl` and `dbpedia-gemini` it is about 1 pp below SQ; on `dbpedia-openai-ada` and `wiki-cohere-v3` it actually *beats* SQ up to 4.6.
2. **TQ 2-bit beats BQ 2-bit by 11–15 pp** on these four datasets (and 9–24 pp across all measured), at the same 16× storage.
3. **TQ 1-bit beats vanilla BQ 1-bit by 9–21 pp** on these four datasets (and 9–21 pp across all measured), at the same 32× storage.

## What Is TurboQuant?

TurboQuant ([Zandieh et al., 2026](https://arxiv.org/abs/2504.19874)) is a rotation-based vector quantization algorithm in the PQ family, with a clean theoretical recipe:

1. **Apply a random orthogonal rotation** to every vector. This redistributes per-coordinate variance evenly — by the central limit theorem, after rotation each coordinate looks roughly Gaussian with the same variance.
2. **Quantize each coordinate independently** with a fixed Lloyd-Max codebook for the standard normal distribution. One codebook of `2^b` levels for the entire dataset, hard-coded as a small lookup table.
3. **Score** quantized vectors by reconstructing the dot product directly from the codebook indices. The rotation is orthogonal, so it preserves dot products and L2 distances — no need to ever undo it.

The elegance: **no per-dataset training, no calibration set, no codebooks to persist**. The codebook is derived once from the standard normal distribution and is universal — the same lookup table works for every dataset and every dimensionality. Compare to PQ, where a learned codebook must be trained on representative data and shipped alongside the index.

### MSE vs PROD: Picking the Variant

The original paper proposes two variants. **MSE** is the literal recipe above: scalar Lloyd-Max quantization, score by codebook lookup. **PROD** adds a second QJL random projection on top of the indices to cancel the per-vector length bias that MSE inherits from rounding to a finite codebook — at the cost of doubling the number of operations per score and requiring a QJL matrix.

Qdrant ships the MSE variant for three reasons:

* **A vector index needs symmetric scoring.** Most operations a vector database performs internally — HNSW graph construction, relevance feedback, etc — compare two stored vectors against each other, not a query against storage. PROD's QJL correction assumes the query side is continuous and breaks down when both sides are quantized. MSE's codebook lookup composes symmetrically: any pair of stored vectors can be scored against each other directly from their indices, with no float side required.
* **Bit efficiency at fixed budget.** At a given storage class, MSE puts every bit into the codebook itself; PROD splits the budget between the codebook and the QJL bit-correction. With Qdrant's extensions described below, the bias that PROD spends bits to fix can be removed for almost free in storage.
* **Computational simplicity.** MSE scoring is a stream of integer multiply-adds against bit-packed indices — a near-perfect fit for AVX-VNNI / AVX-512 / NEON dot-product instructions. PROD's per-query random projection is `O(D log D)` extra work that has to be repaid on every score.

## What Qdrant Adds

A note on lineage before the technical details. TurboQuant is not the only rotation-based vector quantization algorithm in this design space — **[RaBitQ (Gao & Long, SIGMOD 2024)](https://arxiv.org/abs/2405.12497)** independently develops the same rotate-then-quantize foundation, with different choices on how to debias the resulting representation, how to handle scoring, and what to store per vector. The two algorithms agree on the high-level recipe and disagree on the details. What ships in Qdrant is not pure TurboQuant: it is the MSE codebook and integer-friendly scoring path from TurboQuant, combined with the per-vector length-rescaling debiasing idea from RaBitQ, plus the anisotropy compensation we developed on top — picking the best-fitting piece from each line of work for each sub-problem rather than committing to one paper end-to-end.

Three constraints shaped Qdrant's TurboQuant on top of the vanilla MSE algorithm:

* **One stored artifact has to serve both scoring paths.** User search runs *asymmetric* (float query against quantized data); HNSW build, segment merges, and rescoring all run *symmetric* (quantized against quantized) because dragging the original float vectors there would defeat the point of compressing them. Every extension below has to compose with both paths.
* **The hot path stays a tight integer SIMD kernel.** All extensions are paid either at encoding time, or once per query — never per stored vector being scored. The 4-bit kernel compiles to a `pshufb` + `maddubs` loop; the 1-bit kernel to a chain of `AND` + popcount. This is what keeps TurboQuant scoring competitive with plain BQ at the same storage class, despite the algorithmic additions.
* **Storage stays at exactly `b·D` bits per vector.** Anything per-coordinate that needs to ride along is folded into the query side or into the four bytes already reserved per vector for the L2 length.

The algorithmic extensions described next were designed and implemented by [Ivan Pleshkov](https://github.com/IvanPleshkov); the SIMD-optimized scoring kernels (AVX2 / AVX-512 / NEON) that make those algorithmic changes affordable in the hot path were built by [Jojii](https://github.com/JojiiOfficial). Two companion engineering deep-dives cover the work in detail — see [Further Reading](#further-reading) at the end of this post.

### Length Renormalization

Vanilla MSE has a persistent length bias: quantized vectors are systematically shorter than the originals (Jensen's inequality applied to the rounding-to-codebook step). On the same anisotropic embeddings that the PROD variant was designed to handle, the shrinkage is roughly **5% at 4-bit, ~12% at 2-bit, and ~36% at 1-bit**. Recall loss tracks the shrinkage: 5–15 percentage points at 4-bit and considerably worse at lower bit depths.

The fix we use here comes from **[RaBitQ](https://arxiv.org/abs/2405.12497)** rather than from the TurboQuant paper itself: store one extra per-vector scalar that records how much the quantization shrunk the length, and multiply it back in at scoring time. Concretely, we pay the same 4 bytes per vector that we already reserve for the L2 length and use them to store the **ratio of original length to centroid-reconstruction length**. At scoring time the SIMD raw_dot is multiplied by this scalar; the scoring formula stays unchanged, the storage budget for the codebook itself is untouched, and the cost stays one multiply per query-vector pair (not per coordinate). This is the cleaner of the two debiasing approaches in the literature: TurboQuant's PROD variant spends an entire QJL random projection plus extra bits in the codebook on the same problem; RaBitQ-style renormalization spends 4 bytes and one multiply.

### Per-Coordinate Calibration (Anisotropy Compensation)

After rotation, we run a single pre-pass over the segment that estimates a `(shift, scale)` pair per coordinate. Each coordinate is then mapped via `x → (x + shift) · scale` before quantization, pulling its empirical distribution onto the Lloyd-Max codebook's grid no matter how skewed it was originally. This is the extension that turns vanilla MSE from "elegant but only competitive on isotropic data" into something that beats BQ across embedding models we have benchmarked.

The non-obvious part is **what we calibrate to**. Standard mean-and-stddev rescaling implicitly assumes the rotated coordinates are Gaussian, which is exactly the assumption that breaks on anisotropic embeddings — that is why vanilla TurboQuant struggles on them in the first place. Instead, we anchor calibration directly to the codebook itself: the `(shift, scale)` pair is fit so that the empirical quantiles at the probability levels of the **outermost codebook centroid** land at that centroid. The calibration is robust to whatever distributional weirdness the post-rotation coordinates actually have — heavy tails, bimodality, anisotropy, all of it — without making any parametric assumption.

The quantile estimation itself is done with the [P-Square algorithm](https://www.cse.wustl.edu/~jain/papers/ftp/psqr.pdf) (Jain & Chlamtac, 1985) on a reservoir-sampled prefix of the segment: streaming, no parametric fit, constant memory per coordinate. The reservoir size is picked per bit-depth — the 4-bit codebook anchors at a deeper tail quantile than 1-bit, so it gets a larger reservoir to keep the quantile estimator's variance flat. The full P-Square + reservoir setup is detailed in [Ivan's deep-dive](#further-reading).

Three properties make this extension safe to ship by default:

* **On truly isotropic data, calibration vanishes.** The empirical quantiles match the theoretical Gaussian quantiles, the formula collapses to `(shift=0, scale=1)`, and the encoded vector is bit-identical to vanilla TurboQuant MSE. So the extension never makes already-good data worse — that is a mathematical property of the formula, not an empirical observation across the benchmark suite.
* **The compensation is paid by the query, not by storage.** The shift and scale fold into a one-time precomputed scaling of the rotated query plus a single scalar correction term. Storage stays at exactly `b·D` bits per vector — no per-vector overhead beyond the codebook indices themselves.
* **Symmetric scoring stays well-defined.** The same `(shift, scale)` pair is baked into the segment's metadata and applied consistently whether one or both sides of a comparison are quantized. HNSW build and segment merges work directly on the encoded vectors; the calibration parameters compose into the score formula symmetrically.

Ablation in the deep-dive quantifies the impact: at 4-bit on highly anisotropic embeddings (e.g. arxiv-instructorxl), this extension alone is worth roughly 14 percentage points of recall vs. vanilla MSE; at 1-bit it is worth ~8 pp. On already-isotropic embeddings (e.g. text-embedding-3-large) the contribution is below 1 pp at every bit depth — exactly as the "vanishes on isotropic data" property predicts.

### L2 and Unnormalized Dot

Vanilla TurboQuant assumes all inputs live on the unit sphere — that is, cosine distance only. We extend the algorithm beyond the sphere by **folding the original L2 length into the same per-vector scaling factor that already carries length renormalization** — both end up multiplied into the SIMD raw_dot at scoring time, so dot and L2 cost the same as cosine in the hot path. L2 distances are reconstructed via the identity `‖q − v‖² = ‖q‖² + ‖v‖² − 2⟨q, v⟩`, where the right-hand side has all the components already available.

Net result: **cosine, dot, and L2 are all first-class** in Qdrant's TurboQuant — same storage layout, same kernels, no precision tax for the non-cosine metrics.

L1 is not supported. Random orthogonal rotation preserves the L2 norm but not the L1 norm, which is the foundational invariant the entire algorithm relies on. There is no clean way to make L1 work without inverting the rotation per score, which would defeat the speedup. If your similarity is L1, stick with SQ.

### SIMD Acceleration

The asymmetric scoring path — one float query against millions of quantized vectors — is the hot path of every search, and we tune it hard. Modern CPUs ship SIMD instructions specifically aimed at small-integer dot products (`pshufb` / `maddubs` on SSE, `VPDPBUSD` on AVX-VNNI, `SDOT` on ARMv8.2-A, `VPOPCNTDQ` on AVX-512); the algorithmic choices upstream were made with those instructions as the compilation target. The 4-bit and 1-bit kernels have very different shapes and are worth describing separately.

#### 4-bit: scalar-quantize both sides, then a `maddubs` loop

The Lloyd-Max codebook for 4-bit is 16 `f32` centroids — 64 bytes, four XMM registers wide, with no SIMD instruction that can index into it directly. The trick is an extra layer of **scalar quantization on the codebook itself**: each centroid is mapped to one byte and the whole codebook collapses to `[u8; 16]`, exactly one XMM register, with indexed access becoming a single `pshufb` (`_mm_shuffle_epi8`) — "parallel indexing into a 16-byte table". The codebook is encoded as **`u8` (not `i8`)** on purpose: the SSE instruction we want to multiply with, `_mm_maddubs_epi16`, takes one **unsigned** byte operand and one **signed** byte operand. We park the codebook on the unsigned side via `c_u8[k] = round(c[k] · 128 / max|c|) + 128`, which maps the symmetric centroid range into `[0, 255]`, and the constant `+128` offset is unwound once per query as a single bias-correction term added at the end of the dot product. The query takes the signed side: the rotated, anisotropy-prescaled `[f32]` query is quantized to `[i16]` once per query, then split into two `[i8]` halves (`q = 128 · high + low`) so it feeds `maddubs`'s signed operand. (NEON's `vmull_s8` is signed × signed, so on ARM the codebook is stored directly as `[i8; 16]` and there is no offset to unwind.)

After that the kernel is mechanical: `pshufb` for centroid lookup, `maddubs` for the unsigned-codebook × signed-query byte multiply, `madd_epi16` to widen the pair sums into an `i32` accumulator. A 16-dimension chunk of scoring compiles to a handful of integer SIMD instructions, all on byte and 16-bit registers. On VNNI-capable CPUs (Ice Lake+, Sapphire Rapids, Zen 4+) the `maddubs + madd_epi16` pair compresses further into a single `VPDPBUSD`; on ARMv8.2-A `SDOT` plays the same role. The codebook-SQ noise is roughly an order of magnitude below the PQ quantization noise itself — a `test_simd_noise_below_pq_noise` test in the codebase asserts the SIMD noise stays at least 5× smaller than the PQ noise, so this extra quantization layer is genuinely free at the recall level. The 2-bit kernel uses the same recipe with paired-nibble lookup tables. The full walkthrough — the unsigned-codebook layout and per-query bias correction, the i8-halves split for query precision, the cross-platform SSE / AVX2 / AVX-512 / NEON variants — is in [Jojii's deep-dive](#further-reading).

#### 1-bit: RaBitQ-style bit-plane popcount

The 1-bit scoring path is **[RaBitQ](https://arxiv.org/abs/2405.12497)**'s scoring scheme as published — we did not reinvent it. The data side is one bit per coordinate (the sign of the rotated coordinate), 128 dimensions per 16-byte chunk. The query is scalar-quantized to a `B`-bit signed integer (`B = 8` by default; `B = 16` when anisotropy compensation is on, because the per-coordinate query rescaling pushes some query values to the bottom of the dynamic range where 8-bit precision is too coarse) and then **transposed into `B` bit-planes**: all "bit 0" bits of `q[0..128]` stored contiguously, then all "bit 1" bits, and so on — `B` planes of 16 bytes each.

With that layout the dot product collapses to one popcount per plane:

```
v · q  =  2 · Σ_b  2^b · popcount(v AND plane_b)  −  Σ q
```

Each plane costs one `AND` plus one popcount — three instructions on AVX-512 with VPOPCNTDQ (`vpand` + `vpopcntq` + accumulate), a few more on AVX2/SSE via Muła's nibble-lookup trick, just `vcntq_u8` plus reductions on NEON. The asymmetric value-set choice — vector ∈ {−1, +1}, query bit ∈ {0, +1} — is what makes `AND` the natural backbone here; symmetric BQ uses XOR + popcount because both sides live in {−1, +1}, but the asymmetric setup falls out as `AND` + popcount instead. The algebra is from the RaBitQ paper; the SIMD instruction selection is in [Jojii's deep-dive](#further-reading).

#### Why the kernel shape matters

The architectural payoff is the same across both kernels: scoring throughput is bounded by **memory bandwidth on the bit-packed indices**, not by ALU utilization. That is the regime you want for a production index — once you are memory-bandwidth-bound, the rest of the system (cache hierarchy, NUMA placement, prefetch) keeps scaling for you; once you are ALU-bound, throughput stops scaling with anything except clock speed. The symmetric scoring path used by HNSW build and segment merges has its own simpler kernels — both sides are already small integers, no second-level query quantization needed — and a single stored artifact serves both paths.

## Detailed Benchmarks

Setup: HNSW index (`m=16`, `ef_construct=128`), 100K vectors per dataset, recall@10 vs brute-force ground truth. SQ uses the standard int8 path. Rows are ordered by storage class so the head-to-head TurboQuant vs BQ comparisons line up.

**Datasets:**

* `arxiv-384` — arXiv titles, 384-dim sentence-transformer embeddings — [TODO link]
* `arxiv-iXL` — [arXiv titles, InstructorXL 768-dim](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings)
* `dbp-gem` — DBpedia entities, Gemini embeddings — [TODO link]
* `dbp-3s` — DBpedia entities, OpenAI text-embedding-3-small 1536-dim — [TODO link]
* `dbp-3l` — DBpedia entities, OpenAI text-embedding-3-large 1536-dim — [TODO link]
* `dbp-oai` — DBpedia entities, OpenAI ada-002 — [TODO link]
* `cohere` — [Wikipedia, Cohere multilingual-v3 1024-dim](https://huggingface.co/datasets/Cohere/wikipedia-2023-11-embed-multilingual-v3)
* `h&m` — H&M product catalog embeddings — [TODO link]
* `laion` — LAION image embeddings — [TODO link]
* `ads-1M` — ad-creative embeddings — [TODO link]

**Recall@10:**

| Variant (compression) | arxiv-384 | arxiv-iXL | dbp-gem | dbp-3s | dbp-3l | dbp-oai | cohere | h&m | laion | ads-1M |
|---|---|---|---|---|---|---|---|---|---|---|
| f32 (1×) | 0.9855 | 0.9419 | 0.9167 | 0.9384 | 0.9348 | 0.9625 | 0.9446 | 0.9967 | 0.9897 | 0.9298 |
| SQ (4×) | 0.9674 | 0.9285 | 0.9134 | 0.9362 | 0.9339 | 0.8839 | 0.9014 | 0.9789 | 0.9276 | 0.9187 |
| **TQ 4-bit (8×)** | **0.9442** | **0.9193** | **0.9020** | **0.9313** | **0.9271** | **0.9299** | **0.9271** | **0.9739** | **0.9438** | **0.9169** |
| TQ 2-bit (16×) | 0.8477 | 0.8227 | 0.8170 | 0.8838 | 0.8806 | 0.8480 | 0.8303 | 0.9195 | 0.8349 | 0.8706 |
| BQ 2-bit (16×) | 0.6948 | 0.6756 | 0.6689 | 0.7630 | 0.7513 | 0.7332 | 0.6880 | 0.7018 | 0.5953 | 0.7808 |
| TQ 1.5-bit (~21×) | 0.7567 | 0.7143 | 0.7391 | 0.8278 | 0.8197 | 0.7690 | 0.6460 | 0.8756 | 0.7213 | 0.7941 |
| TQ 1-bit (32×) | 0.7127 | 0.6763 | 0.6990 | 0.7997 | 0.7924 | 0.7356 | 0.6300 | 0.8540 | 0.6807 | 0.7717 |
| BQ asymmetric (32×) | 0.7070 | 0.5919 | 0.6112 | 0.7910 | 0.7824 | 0.7072 | 0.6287 | 0.7802 | 0.5800 | 0.7570 |
| BQ 1-bit (32×) | 0.6028 | 0.4683 | 0.4945 | 0.7041 | 0.6921 | 0.6098 | 0.5409 | 0.6989 | 0.4762 | 0.6760 |

The pattern repeats across all ten datasets:

* **TQ 4-bit is competitive with SQ at half the storage.** On 9 of 10 datasets the gap to SQ is within 2 pp in either direction; on 3 of those (`dbp-oai`, `cohere`, `laion`) TQ 4-bit *beats* SQ — by up to 4.6 pp on `dbp-oai`. The single exception is `arxiv-384`, where TQ 4-bit trails SQ by 2.3 pp. The pattern is consistent: when SQ's int8-per-coordinate grid is mismatched with the embedding distribution, an adaptive 4-bit quantizer with anisotropy compensation does better, despite using half the bits.
* **TQ 2-bit beats BQ 2-bit by 9–24 pp** on every dataset, at the same 16× storage class. The largest margins are on `laion` (+24.0 pp) and `h&m` (+21.8 pp); the smallest is `ads-1M` (+9.0 pp).
* **TQ 1-bit beats vanilla BQ 1-bit by 9–21 pp** on every dataset, at the same 32× storage class. Against the stronger asymmetric BQ configuration (1-bit storage, 8-bit query), TQ 1-bit is still ahead on every dataset, though the margin narrows — between 0.1 pp (`cohere`, essentially tied) and 10 pp (`laion`).
* **TQ 1.5-bit (~21×)** sits between the 2-bit and 1-bit operating points and is the right pick when 32× is too aggressive but 16× leaves storage on the table.

## When to Use TurboQuant

A practical guide:

* **You currently run SQ** → try TQ 4-bit. Comparable recall (often within 1–2 pp; sometimes higher) at half the memory. The upgrade with the smallest reason not to take it.
* **You currently run BQ at any bit depth** → try TurboQuant at the same storage budget (BQ 2-bit → TQ 2-bit, BQ 1-bit → TQ 1-bit). On the benchmarks described here, it consistently delivers higher recall — typically 10–20 pp at both the 16× and 32× storage classes. Stay on BQ if you observe a noticeable drop in throughput on your workload, or if the recall improvement is too small to matter for your use case.
* **You need cosine, dot, or L2** → all three are first-class in TurboQuant. **L1** → stay on SQ.

A word on indexing: TurboQuant has a small one-time pre-pass per segment (the calibration scan) that runs in a few seconds at production segment sizes. Once a segment is calibrated, the calibration is reused across queries and segment merges; it is paid once per segment, never per query.

## Conclusion

TurboQuant gives Qdrant a third path on the compression ladder: 8× compression at SQ-level recall, and at 16× / 32× a consistent 10–20 percentage points of recall above BQ on every embedding model we have benchmarked. What makes that work is a hybrid — TurboQuant's MSE codebook and integer-arithmetic SIMD kernels, RaBitQ's per-vector length rescaling and bit-plane scoring at 1-bit, and the anisotropy-compensation pre-pass we developed on top to make all of it land on real production embeddings. The whole stack is shipping in **Qdrant 1.18**, on Cloud and in the standard Docker image. Migration from SQ or BQ is a config change and a re-index; the rest of the application stays identical.

Two engineering deep-dives go further than this post: Ivan Pleshkov on the algorithmic side, Jojii on the SIMD kernels (both linked in [Further Reading](#further-reading)). The Python reference implementation is open-source at [turboquant-qdrant-showcase](https://github.com/IvanPleshkov/turboquant-qdrant-showcase) — reproducible benchmarks, no SIMD obscuring the math. If you run TurboQuant on an embedding model where the numbers don't match what's reported here, or you want help picking the right operating point for your workload, our team is on [Discord](https://qdrant.to/discord). We are always interested in hearing about embeddings that break our assumptions.

## Further Reading

**Engineering deep-dives by the team that built this:**

* **[TurboQuant in Qdrant: tricks and ideas behind the implementation](https://turbo-quant-personal-site.pleshkov-ivan.workers.dev/blog/turboquant/)** — by Ivan Pleshkov. Every algorithmic extension explained: renormalization, the reversible LCG + Fisher-Yates Hadamard rotation, anisotropy compensation, P-Square calibration, support for L2 and unnormalized dot. Includes the ablation table that quantifies each extension's contribution to recall.
* **[SIMD optimizations for TurboQuant scoring](TODO: link to Jojii's post)** — by Jojii. How the scoring hot path is implemented in Rust with AVX2 / AVX-512 / NEON intrinsics. Bit-packed storage, the 8-bit and 16-bit query precomputation paths, and how the kernels stay memory-bandwidth-bound rather than ALU-bound across modern CPU architectures.

**Background:**

* [TurboQuant: Redefining AI Efficiency with Extreme Compression](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) — the original Google Research blog post.
* [TurboQuant paper (arXiv:2504.19874)](https://arxiv.org/abs/2504.19874) — Zandieh et al., 2026.
* [RaBitQ paper (arXiv:2405.12497)](https://arxiv.org/abs/2405.12497) — Gao & Long, SIGMOD 2024. The closely related rotation-based vector quantizer whose per-vector length-rescaling debiasing we adopted for TurboQuant in Qdrant. Worth reading alongside the TurboQuant paper to see how two independent lines of work converge on the same rotate-then-quantize core but diverge on the bias-correction details.
* [Interactive TurboQuant explainer](https://arkaung.github.io/interactive-turboquant/) by Arkar Min Aung — a hands-on, step-by-step walkthrough of the algorithm with interactive visualizations. The clearest high-level explanation of TurboQuant available, and a great place to build intuition before reading the paper.
* [Scalar Quantization in Qdrant](https://qdrant.tech/articles/scalar-quantization/) — the int8 baseline this post refers to.
* [Binary Quantization in Qdrant](https://qdrant.tech/articles/binary-quantization/) — the 1-bit baseline this post refers to.
