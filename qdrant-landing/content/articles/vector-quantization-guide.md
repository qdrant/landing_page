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

One hundred million 1,536-dimensional embeddings take 614 GB as float32 before you count the HNSW graph, payloads, or a single replica. Quantization is how Qdrant makes that searchable on hardware you can afford. It is also where most sizing mistakes get made, because every method advertises a compression ratio and none of them advertise what the ratio costs on your embeddings.

This guide covers the four methods Qdrant ships, how each one encodes a vector, and what happened when we ran all of them against the same corpora, queries, and index settings on one machine: four datasets from 3,600 to 523,000 documents, two embedding models, 24 index builds per dataset. The numbers come from a [benchmark you can rerun](https://github.com/qdrant-labs/quantization-comparison-bench). Where a recommendation stops working, the guide says so.

## Three Ways to Shrink a Collection

Qdrant gives you three separate levers, and they are easy to confuse.

![Three ways to shrink a vector collection: fewer dimensions, a quantized search copy, or a smaller storage datatype](/articles_data/vector-quantization-guide/three-ways-to-shrink.svg)

**Fewer dimensions** is a decision about the embedding, not the engine. Matryoshka models let you keep the first 256 or 512 coordinates; Qdrant stores whatever length you send. Nothing in this guide changes if you do that first.

**A quantized search copy** is what people mean by quantization in Qdrant. The original vectors stay as they are. Qdrant builds a compact copy, searches that copy, and can rescore the best candidates against the originals. This is the lever the guide is about.

**A storage datatype** changes the originals themselves. `float16` halves them, `uint8` needs embeddings that already live in 0 to 255, and `turbo4`, new in v1.19, stores each coordinate in four bits. Once the originals are four bits, rescoring can only recover four bits of precision. That difference is measured in its own section, because it is the trade people most often make by accident.

The rest of this guide assumes cosine distance on L2-normalized embeddings. Qdrant normalizes cosine vectors on ingestion anyway, so cosine becomes a dot product on the inside.

## How a Search Copy Answers a Query

Every quantized configuration in Qdrant runs the same four steps. The methods differ only in how step one encodes a vector and how cheap step one is.

![How a quantized search copy answers a query: search the pinned copy, oversample, rescore against the originals, return the top k](/articles_data/vector-quantization-guide/search-copy-rescoring.svg)

The quantized copy is searched through the HNSW graph. TurboQuant and product quantization score the full-precision query against the compressed stored vectors, so quantization noise lands on one side of each comparison. Scalar quantizes the query to `int8` as well, and binary reduces the query to bits unless `query_encoding` keeps it at eight or four bits. The search returns `limit × oversampling` candidates. If `rescore` is on, Qdrant scores those candidates again with the original vectors and returns the best `limit`. If it is off, the quantized scores are final and the originals are never read.

Two settings decide where the bytes live. The [memory tier](/documentation/ops-configuration/memory-tiers/) of the quantized copy should be `pinned`, so it is heap-allocated and never evicted. The originals can stay `cold`, which means a memory-mapped file that is read on demand, or `cached`, which pre-warms the page cache. Qdrant rejects `pinned` for dense originals. On a machine with spare RAM the page cache keeps cold originals hot anyway; the distinction only bites when the originals do not fit, which is the memory-pressure experiment near the end.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="articles",
    vectors_config=models.VectorParams(
        size=1024,
        distance=models.Distance.COSINE,
        memory=models.Memory.COLD,  # originals stay on disk until read
    ),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            bits=models.TurboQuantBitSize.BITS4,
            memory=models.Memory.PINNED,  # the search copy never leaves RAM
        )
    ),
)
```

Rescoring and oversampling are per-query, so the same collection can serve a cheap feed query and an expensive deduplication query. `query_vector` is your embedded query as a list of floats:

```python
hits = client.query_points(
    collection_name="articles",
    query=query_vector,
    limit=10,
    search_params=models.SearchParams(
        hnsw_ef=128,
        quantization=models.QuantizationSearchParams(
            rescore=True,
            oversampling=2.0,  # score 20 candidates, return 10
        ),
    ),
).points
```

The defaults differ by method. Rescoring is on by default for binary quantization and for TurboQuant at 1, 1.5, and 2 bits, and off for scalar, product, and 4-bit TurboQuant. Set it explicitly in anything you benchmark, or you will compare a rescored method against an unrescored one without noticing.

## The Four Methods

### Scalar Quantization

Each float32 coordinate becomes one `int8`, so the copy is one quarter the size of the originals. Qdrant calibrates the mapping per segment from the value distribution, and `quantile` controls how much of the tail it ignores: `0.99` clips the top and bottom percent so a handful of outliers do not spend most of the 256 levels on values nobody has. The comparisons run as integer SIMD instructions.

Scalar is the method with the fewest assumptions. It does not care whether coordinates are centered or how many dimensions you have, and it is the method to use with Manhattan distance, which TurboQuant supports only on a slow path. Its limit is arithmetic: 4× is all it can give. If your RAM budget needs 8× or more, scalar cannot get there on its own.

### Binary Quantization

The one-bit encoding keeps the sign of each coordinate and nothing else, so the copy is 1/32 the size of the originals and a comparison collapses to XOR and popcount over packed bits. That is the fastest scoring Qdrant has. The two-bit and 1.5-bit encodings add a "near zero" bucket, which costs compression (16× and about 21×) and buys back some of the recall that sign-only loses on small coordinates. `query_encoding` can keep the query side at `scalar8bits` or `scalar4bits` while the stored side stays binary.

```python
quantization_config=models.BinaryQuantization(
    binary=models.BinaryQuantizationConfig(
        encoding=models.BinaryQuantizationEncoding.TWO_BITS,
        query_encoding=models.BinaryQuantizationQueryEncoding.SCALAR8BITS,
        memory=models.Memory.PINNED,
    )
)
```

Binary only works when the sign of a coordinate carries information. The measurements below show that this is a property of the corpus and the model together, and that it can be measured before you build anything.

### Product Quantization

Product quantization splits each vector into sub-vectors and replaces each sub-vector with the index of its nearest centroid in a codebook learned from your data. With 256 centroids per sub-vector an index costs one byte. Against four bytes per float32 coordinate, `x8` compression means two coordinates share one byte and `x64` means sixteen do; Qdrant offers `x4` through `x64`. Because neighboring coordinates are encoded together, it captures structure the per-coordinate methods cannot.

The price is paid at search time. Distances go through lookup tables rather than SIMD arithmetic, which makes product quantization the slowest method at any given recall in every run below. Training the codebook also adds indexing time. Choose it when fitting in memory is the only constraint that matters and query latency is not.

### TurboQuant

TurboQuant applies a fast pseudo-random orthogonal rotation to every vector before encoding each rotated coordinate with a shared, precomputed codebook: 16 levels at 4 bits, 4 at 2 bits, 2 at 1 bit, with a 1.5-bit encoding in between. The rotation spreads variance evenly across coordinates, so one codebook fits every dataset instead of needing per-collection calibration. Qdrant's implementation adds length renormalization and per-coordinate anisotropy compensation; the [TurboQuant article](/articles/turboquant-quantization/) walks through both.

Four-bit TurboQuant gives 8× compression and, in every run below, recall indistinguishable from scalar at half the memory. It supports cosine, dot, and Euclidean at SIMD speed. Manhattan distance works but is much slower, which is the one case where scalar still wins on method alone.

## What We Measured

Four English BEIR datasets, each run as its own experiment: SciFact (5,183 documents), NFCorpus (3,633), FiQA (57,638), and Quora (522,931). Two embedding models over the same documents and queries: Cohere embed-english-v3.0 at 1,024 dimensions and BGE-small-en-v1.5 at 384 dimensions. Qdrant v1.19.2 in Docker on a dedicated 8-vCPU, 32 GiB VM, with the client on the same machine, one collection at a time, `m=16`, `ef_construct=100`, and eight indexing threads.

Two quality measures, kept separate. ANN recall@10 is the overlap between what a configuration returns and what exact float32 search returns, so it isolates the error quantization adds. nDCG@10 against the BEIR relevance judgments says whether that error changes what a user would see as relevant. Latency is server-side p95 at concurrency one, five passes over 150 held-out test queries, three independently built indexes; a separate throughput run repeats the frozen points with eight concurrent clients. Fifty separate development queries were used for tuning and never for reporting. SciFact and NFCorpus were also rerun on their whole official test splits, 300 and 323 queries: no recall moved by more than 0.025 and no pass or fail changed, so the 150-query subset is representative. Memory is the Qdrant allocator heap after indexing and a search pass, which is what a pinned copy costs; the originals are memory-mapped and show up in the page cache instead.

### Rescoring Is Most of the Quality

The first question for any method is what it does with and without rescoring, at a fixed search effort. This is `hnsw_ef=256`, oversampling 2, every method, on the two larger corpora.

{{< chart id="quantization-guide/rescoring" caption="Recall@10 against exact float32 search for each method with rescoring off and on, Quora with Cohere 1,024-d vectors, 522,931 documents, Qdrant v1.19.2 on an 8-vCPU VM, hnsw_ef 256, oversampling 2, 150 held-out queries." caption2="Same configurations on Quora with BGE-small 384-d vectors. Every low-bit code loses more on the smaller model, and binary 1-bit stays below 0.85 even rescored." caption3="Same configurations on FiQA with Cohere 1,024-d vectors, 57,638 documents." caption4="Same configurations on FiQA with BGE-small 384-d vectors. Binary 1-bit with rescoring reaches 0.56, the lowest result in the study." >}}

Three patterns hold on every one of the eight workloads.

Scalar, 4-bit TurboQuant, and product `x8` reach 0.99 recall with rescoring on and sit between 0.93 and 0.99 with it off. For those three, rescoring is a small, cheap correction.

At 2 bits and below, rescoring is the method. On Quora with Cohere, TurboQuant 2-bit goes from 0.93 to 0.99, 1-bit from 0.86 to 0.98, and binary 1-bit from 0.79 to 0.94. On Quora with BGE the same three go from 0.87 to 0.99, 0.77 to 0.94, and 0.68 to 0.84. Without the originals to rescore against, a 1-bit copy misses one to two of the exact top ten on the large model and two to three on the small one.

At equal compression TurboQuant beats binary on every workload. At 32× on Quora with Cohere, rescored 1-bit TurboQuant returns 0.98 against binary's 0.94; at 16×, 2-bit TurboQuant returns 0.99 against 2-bit binary's 0.97. On BGE the gaps are wider: 0.94 against 0.84 and 0.99 against 0.92. The rotation is doing what the sign alone cannot.

Rescoring costs almost nothing when the originals are in the page cache. Across the Quora runs it added at most 0.04 ms to server p95, and the per-query vector read counter shows exactly why: 81,920 bytes per query, which is 20 candidates times 4,096 bytes per 1,024-dimensional float32 vector. Reading 20 vectors from RAM is not where the time goes.

### Tune to a Target, Then Compare

A compression ratio does not pick a method. A quality target does. For each method we swept `hnsw_ef` over 64, 128, 256, and 512, oversampling over 1, 2, 4, and 8, and rescoring off and on, on the 50 development queries only. The rule, fixed before the sweep: take the fastest point with recall@10 of at least 0.95 and nDCG@10 within 0.01 of exact float32. Then freeze it and run the 150 held-out queries once.

{{< chart id="quantization-guide/tradeoff" caption="The development sweep on Quora with Cohere vectors at k=10 with rescoring on: recall@10 by hnsw_ef, one line per oversampling setting. Above oversampling 1, hnsw_ef barely moves recall for scalar and TurboQuant; binary needs oversampling to clear the target at all." caption2="Server p95 for the same sweep. Search effort is what costs latency, and product quantization pays the most for it." >}}

The sweep shows why the selection rule matters. For scalar and 4-bit TurboQuant, `hnsw_ef` 64 already clears 0.95 and every step up costs latency for recall you do not need. Binary 1-bit at oversampling 1 sits at 0.82 no matter how hard the graph searches; oversampling and rescoring are what lift it. Product quantization clears the bar everywhere and pays for it: 3.6 ms at `hnsw_ef` 512 against 1.2 ms for TurboQuant.

{{< chart id="quantization-guide/selected" caption="Recall@10 on held-out queries at each method's development-selected point, Cohere 1,024-d vectors on four corpora. Binary 1-bit misses the 0.95 target on NFCorpus; the other methods meet it everywhere." caption2="The same on BGE-small 384-d vectors. Binary 1-bit misses on three of the four corpora and passes only on Quora." caption3="Server p95 at the frozen points with Cohere vectors, 8-vCPU VM, concurrency one. Product quantization costs 2 to 4 times TurboQuant and scalar at matched quality." caption4="Server p95 at the frozen points with BGE vectors." >}}

The selected points say more than the bars.

| Method | Where the sweep landed, k=10 | Met 0.95 on held-out |
|---|---|---|
| Scalar int8 | `hnsw_ef` 64 everywhere; rescoring off on three Cohere workloads, on with 1 to 8× oversampling elsewhere | 8 of 8 |
| TurboQuant 4-bit | `hnsw_ef` 64 everywhere; rescoring off on SciFact and Quora with Cohere, on with 2 to 4× elsewhere | 8 of 8 |
| Product x8 | `hnsw_ef` 64 or 128, rescoring on, 2 to 4× | 8 of 8 |
| Binary 1-bit | `hnsw_ef` 64 to 512, rescoring on, 4× to 8× every time | 4 of 8 |

Scalar and 4-bit TurboQuant reach the target at the lowest search effort Qdrant was offered, at 0.17 to 0.36 ms server p95 depending on corpus size. Product `x8` met the target everywhere at 0.43 to 1.17 ms, two to four times slower than the others. Binary needed the top of the oversampling grid and still failed on SciFact, NFCorpus, and FiQA with BGE and on NFCorpus with Cohere.

Held-out recall tracked development recall within 0.03 at every selected point, so the rule generalizes. The sweep is 264 configurations per workload; it took two minutes on 5,000 documents and half an hour on 523,000, which makes it cheap enough to copy.

### When Binary Fails, and How to Tell in Advance

Binary passed on both Quora models, including the 384-dimensional one, and failed on every other BGE workload. Dimensionality alone does not explain that. The sign of a coordinate does.

For each corpus we measured how predictable the sign of each coordinate is: the mean absolute difference between the share of positive values in a coordinate and one half. Zero means every coordinate is positive exactly half the time, which is what a sign-only code needs. The number lines up with binary's best rescored recall in the sweep across all eight workloads.

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

Above an imbalance of about 0.19, binary did not reach 0.95 at any point in the grid. Quora's question texts produce more centered embeddings than the scientific and financial corpora do, on both models, and that is why binary works there. The small model is worse on every corpus, so dimensionality matters too, but it is the corpus that moves a model across the line. This statistic takes seconds to compute on a sample of your vectors and is a better test than the dimension count.

### Storage Datatypes Are a Different Trade

The datatype experiment compares five collections: float32 originals alone, float32 with a 4-bit TurboQuant copy, `turbo4` storage with no copy, float32 with a 1-bit copy, and `turbo4` storage with a 1-bit copy. The last one is the smallest configuration Qdrant can build.

{{< chart id="quantization-guide/datatype" caption="Recall@10 at k=10 with rescoring on and oversampling 2 for float32 originals, turbo4 storage, and each with a TurboQuant search copy, Quora and FiQA with both models." caption2="Bytes of the stored vectors in the merged segment for the same configurations. turbo4 storage holds the originals in one eighth of the space; the search copy and the HNSW graph are extra." >}}

`turbo4` storage cuts the stored vectors to one eighth, 270 MB instead of 2,142 MB on Quora with Cohere, and removes recall that nothing downstream can restore: 0.97 on its own against 0.99 for float32 with a 4-bit copy, and 0.95 against 1.00 on BGE. Add a 1-bit copy over `turbo4` and rescoring happens against 4-bit values, which lands at 0.96 on Cohere and 0.91 on BGE. The same 1-bit copy over float32 originals rescores to 0.98 and 0.94. The gap between those two rows is the precision the datatype threw away.

The same holds for binary retrieval. Rescored at 8× oversampling, 1-bit binary over float32 originals reaches 0.99 on Quora with Cohere and 0.97 on Quora with BGE; the identical search over `turbo4` storage reaches 0.97 and 0.92. On FiQA the pairs are 0.96 against 0.93 and 0.78 against 0.75. Every configuration that rescores against `turbo4` lands two to five points below the same configuration rescoring against float32.

So `turbo4` is a storage decision. Take it when disk, not RAM, is the constraint and a 2 to 5 point recall loss on the large model, or 5 to 10 on the small one, is acceptable. It is not a replacement for a search copy over float32 originals, and it cannot be undone without re-ingesting.

```python
client.create_collection(
    collection_name="articles_turbo4",
    vectors_config=models.VectorParams(
        size=1024,
        distance=models.Distance.COSINE,
        datatype=models.Datatype.TURBO4,  # the stored vectors are 4-bit
    ),
    quantization_config=models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(
            bits=models.TurboQuantBitSize.BITS1,
            memory=models.Memory.PINNED,
        )
    ),
)
```

### Memory and Latency at 523,000 Vectors

Quora is large enough for the copies to cost real memory and for the graph to cost real time.

{{< chart id="quantization-guide/memory" caption="Heap added to the Qdrant process by each search copy on Quora, measured after indexing and a search pass: 566 MB for int8, 300 MB for 4-bit TurboQuant, 297 MB for product x8, and 95 MB for 1-bit binary against 2,142 MB of Cohere originals that stay memory-mapped on disk." caption2="Server p95 at hnsw_ef 256 with rescoring on and oversampling 2 for the same collections. Every quantized copy searches faster than float32 HNSW on the same graph." >}}

The heap numbers land within 5 to 10% of what the arithmetic predicts: a quarter, an eighth, an eighth, and a thirty-second of 2,142 MB, plus a few megabytes of per-segment bookkeeping. That is the figure to put in a capacity plan for the pinned copy. The originals are a separate line: with the copy pinned and the originals `cold`, Qdrant's resident set after a search pass was 570 to 1,000 MB for the quantized collections against 1,818 MB for float32, because float32 HNSW has to pull vectors through the page cache to score anything.

That is also why every copy is faster than float32 HNSW on the same graph. At `hnsw_ef` 256 on Quora with Cohere, float32 reads 11.7 MB of vectors per query, about 2,850 of them, and answers in 2.1 ms at p95. The int8 copy answers in 0.96 ms, 4-bit TurboQuant in 0.69, 1-bit binary in 0.48. Product `x8` answers in 2.3 ms, slower than no quantization at all, which is the lookup-table cost made visible. At the selected points the ordering is the same with smaller numbers: 0.24 ms for binary, 0.29 for TurboQuant, 0.36 for scalar, 0.72 for float32, 1.16 for product.

### Throughput Under Load

Concurrency one measures the server; eight concurrent clients measure how much of the machine each method leaves for other queries.

{{< chart id="quantization-guide/throughput" caption="Queries per second at each method's frozen k=10 point with eight concurrent clients on the same 8-vCPU VM, four workloads. The client and server share the CPUs, so about 7,000 QPS is the ceiling of the machine rather than of any method." caption2="Server p95 under the same load. Product quantization is the only method whose latency more than doubles when clients stack up." >}}

On Quora with Cohere, 4-bit TurboQuant sustains 6,100 queries per second, binary 6,700, scalar 5,600, float32 HNSW 4,200, and product quantization 2,700. The ceiling is shared: the quantized methods bunch near it on every corpus because the client is competing for the same cores, so read the differences below the ceiling, not the absolute numbers. float32 HNSW delivers about 70% of the quantized throughput and product quantization under half, on both corpora large enough to matter.

### Cold Start: The Disk Side of the Trade

Every number so far had the originals in the page cache. The cold-start run drops the host page cache and restarts the container before each of three passes, then sends the 150 queries once per pass with no warm-up. The first ten requests of a pass are the cold figure.

| Quora, Cohere 1,024-d, k=10 | First 10 requests after a cache drop, p50 / p95 | Remaining 140, p50 |
|---|---|---|
| float32 HNSW | 1,342 / 1,772 ms | 631 ms |
| Scalar int8 | 10.6 / 25.7 ms | 9.6 ms |
| TurboQuant 4-bit | 9.1 / 24.3 ms | 8.9 ms |
| Binary 1-bit | 9.1 / 24.3 ms | 8.7 ms |
| Product x8 | 11.3 / 27.8 ms | 10.9 ms |

That is the trade in one table. A pinned copy is loaded with the process, so a quantized collection answers its first cold query in about ten milliseconds, almost all of it the 20 rescoring reads from disk. float32 HNSW has nothing in RAM but the graph, pulls about 2,850 vectors from disk per query, and takes 1.3 seconds at p50 for the first ten requests and 0.6 seconds for the rest of the pass. On Quora with BGE the figures are 918 ms against 6 to 7 ms; on FiQA, 659 ms against 8 to 10 ms. The quantized collections do not finish warming within 150 queries either, which is why their tail stays near 9 ms instead of the 0.3 ms of the warm runs, but they start from a usable place and float32 does not.

### When the Originals Do Not Fit

A first attempt capped the container at 1 GiB, below the 2.1 GB of originals, for the whole experiment. That measured something else: under the cap, the index build was OOM-killed for scalar, binary, TurboQuant, and float32, and only product quantization completed. At 512 MiB on the BGE corpus, three of five builds hit a four-hour timeout. Qdrant needs headroom above the originals to merge segments and build the graph, and a cap below them is a build problem before it is a search problem. The results are kept as a recorded outcome.

*Pending: the corrected design builds each index under the normal cap and lowers the container cap in place to 1 GiB, or 512 MiB for BGE, only for the measured passes, so that rescoring has to read from disk. Those runs and the third embedding model at 768 dimensions are in progress and will replace this paragraph.*

## Choosing

Start from three numbers: the RAM you will give Qdrant, the recall@10 you can accept against exact search, and the p95 you can afford. Then evaluate in this order and stop at the first configuration that meets all three.

**If 4× is enough, or you need Manhattan distance,** scalar. It has no distribution assumptions and met the target on every workload, rescoring off on most of the Cohere ones. It stops working when your budget needs more than 4×.

**If you need 8×,** 4-bit TurboQuant. On all eight workloads it matched scalar's recall at half the memory and ran slightly faster. The exception is Manhattan distance, where its scoring falls back to a slow path.

**If you need 16× to 32× and query speed is the priority,** binary, with rescoring and 4× to 8× oversampling budgeted in. It was the fastest method on every workload where it passed. Check the sign imbalance of your corpus first: above roughly 0.19 it did not reach 0.95 anywhere in the grid, and that happened on three of four BGE corpora and one Cohere corpus.

**If you need 16× to 32× and recall is the priority,** 2-bit or 1-bit TurboQuant with rescoring on. They reached 0.99 and 0.94 to 0.98 on the corpora where binary stalled. Turning rescoring off is what breaks them: without the originals, 1-bit TurboQuant loses 15 to 25% of the exact top ten.

**If you need 64× and latency does not matter,** product quantization. A p95 target is what rules it out; at `x8` it was already the slowest method at matched recall in every run, slower than unquantized float32 at fixed search effort, and the only method whose latency more than doubled under eight concurrent clients.

**If disk is the constraint rather than RAM,** `turbo4` storage, with the recall loss above priced in.

Whatever you pick, leave the originals as `cold`, pin the quantized copy, and leave rescoring on until a measurement tells you it is not needed. Rescoring 20 candidates costs microseconds when the originals are in the page cache. The only reason to turn it off is that they are not, and you find that out by measuring, not by guessing.

## Measure It on Your Data

Every number above came from embeddings that are not yours. The procedure transfers; the numbers do not. The companion notebook runs the procedure below on SciFact against any Qdrant 1.19 cluster, with no embedding API key:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/Quantization-experiments/quantization-guide/quantization_guide.ipynb)

Here is the minimum that catches the mistakes we see most often.

Compute exact float32 neighbors once, outside the index, for a few hundred queries. Qdrant's `exact=True` with quantization ignored does this against a live collection:

```python
def top_ids(query, **params):
    return [
        point.id
        for point in client.query_points(
            collection_name="articles",
            query=query,
            limit=10,
            search_params=models.SearchParams(**params),
        ).points
    ]

exact = top_ids(
    query_vector,
    exact=True,
    quantization=models.QuantizationSearchParams(ignore=True),
)
quantized = top_ids(
    query_vector,
    hnsw_ef=128,
    quantization=models.QuantizationSearchParams(rescore=True, oversampling=2.0),
)
recall_at_10 = len(set(exact) & set(quantized)) / 10
```

Report unquantized HNSW too, so you can see how much error the graph adds before quantization does. At the selected points float32 HNSW scored 0.96 to 0.996 across the eight workloads, so part of the gap to 1.0 in the charts belongs to the graph, not the codes.

Check the sign imbalance before you try binary. Over a sample of your stored vectors, take the share of positive values per coordinate, subtract one half, and average the absolute value. Below 0.15 binary is worth testing; above 0.19 it did not pass here.

Then tune on queries you will not report, freeze, and evaluate once. Keep the tuning sweep small: `hnsw_ef` and oversampling are the two knobs that matter, rescoring is a switch you should test both ways, and three builds of the index tell you whether a 0.01 difference is real. On every workload here, build-to-build recall varied by less than 0.005.

The [benchmark repository](https://github.com/qdrant-labs/quantization-comparison-bench) runs this whole protocol with one command per dataset and writes the tables in this guide. Point it at your own embeddings by replacing the prepared arrays; the format is a float32 matrix, an ID list, and a relevance file.

## Where This Stops

Two embedding models and four datasets establish the shape of the trade and a way to measure it, not universal rules. The sign-imbalance threshold comes from eight points, so treat it as a test to run on your own embeddings, not a constant. We did not check whether it holds within one model family at a different size, and no third model at 768 dimensions is part of these results.

Latency here comes from a machine that had nothing else to do, and the throughput run shares its CPUs between client and server. The relative ordering is robust, but the absolute milliseconds and queries per second are not a capacity plan. The cold-start table prices the first touch of a cold disk. We did not measure steady-state search where the originals permanently do not fit in memory, so the cost of rescoring from disk under sustained load is the main open question. If your originals exceed RAM, run `scripts/memory-pressure.sh` from the benchmark repository on your own data before you rely on a rescoring setup.

One build of 57 did not behave: on FiQA with BGE, `turbo4` storage with a 4-bit TurboQuant copy returned recall 0.0 on every query in one of its three builds and 0.90 in the other two. That build is excluded from the datatype figures and reported to the Qdrant engineers as a defect, not a trade-off.

Neural quantizers, learned rotations, and dimensionality reduction were outside the agreed scope and are not covered. Turbo8 is merged in Qdrant's main branch but not in v1.19.2, so it is not measured.
