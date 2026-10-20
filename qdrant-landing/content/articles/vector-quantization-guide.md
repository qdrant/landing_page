---
title: "Vector Quantization in Qdrant: Which Method to Use and What You Trade"
short_description: "Scalar, binary, product, and TurboQuant quantization measured on the same corpora: what each one costs in recall, latency, and memory, and how to pick one."
description: "Scalar, binary, product, and TurboQuant quantization in Qdrant, measured: how each works, what rescoring recovers, and how to choose."
social_preview_image: /articles_data/vector-quantization-guide/preview/social_preview.jpg
preview_dir: /articles_data/vector-quantization-guide/preview
author: Ewa Szyszka
author_link: https://www.linkedin.com/in/ewaszyszka/
date: 2026-11-04T10:00:00+01:00
draft: true
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

This guide covers the four methods Qdrant ships, how each one encodes a vector, and what happened when we ran all of them against the same corpora, queries, and index settings on one machine. The numbers come from a [benchmark you can rerun](https://github.com/qdrant-labs/quantization-comparison-bench). Where a recommendation stops working, the guide says so.

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

Two settings decide where the bytes live. The [memory tier](/documentation/ops-configuration/memory-tiers/) of the quantized copy should be `pinned`, so it is heap-allocated and never evicted. The originals can stay `cold`, which means a memory-mapped file that is read on demand, or `cached`, which pre-warms the page cache. Qdrant rejects `pinned` for dense originals. On a machine with spare RAM the page cache keeps cold originals hot anyway; the distinction only bites when the originals do not fit, which is the memory-pressure experiment at the end.

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

Binary only works when the sign of a coordinate carries information. That holds for high-dimensional embeddings whose coordinates are roughly centered. The measurements below show what happens on a 384-dimensional model.

### Product Quantization

Product quantization splits each vector into sub-vectors and replaces each sub-vector with the index of its nearest centroid in a codebook learned from your data. With 256 centroids per sub-vector an index costs one byte. Against four bytes per float32 coordinate, `x8` compression means two coordinates share one byte and `x64` means sixteen do; Qdrant offers `x4` through `x64`. Because neighboring coordinates are encoded together, it captures structure the per-coordinate methods cannot.

The price is paid at search time. Distances go through lookup tables rather than SIMD arithmetic, which makes product quantization the slowest method at any given recall in every run below. Training the codebook also adds indexing time. Choose it when fitting in memory is the only constraint that matters and query latency is not.

### TurboQuant

TurboQuant applies a fast pseudo-random orthogonal rotation to every vector before encoding each rotated coordinate with a shared, precomputed codebook: 16 levels at 4 bits, 4 at 2 bits, 2 at 1 bit, with a 1.5-bit encoding in between. The rotation spreads variance evenly across coordinates, so one codebook fits every dataset instead of needing per-collection calibration. Qdrant's implementation adds length renormalization and per-coordinate anisotropy compensation; the [TurboQuant article](/articles/turboquant-quantization/) walks through both.

Four-bit TurboQuant gives 8× compression and, in every run below, recall indistinguishable from scalar at half the memory. It supports cosine, dot, and Euclidean at SIMD speed. Manhattan distance works but is much slower, which is the one case where scalar still wins on method alone.

## What We Measured

Four English BEIR datasets, each run as its own experiment: SciFact (5,183 documents), NFCorpus (3,633), FiQA (57,638), and Quora (522,931). Two embedding models over the same documents and queries: Cohere embed-english-v3.0 at 1,024 dimensions and BGE-small-en-v1.5 at 384 dimensions. Qdrant v1.19.2 in Docker on a dedicated 8-vCPU, 32 GiB VM, with the client on the same machine, one collection at a time, `m=16`, `ef_construct=100`, and eight indexing threads.

Two quality measures, kept separate. ANN recall@10 is the overlap between what a configuration returns and what exact float32 search returns, so it isolates the error quantization adds. nDCG@10 against the BEIR relevance judgments says whether that error changes what a user would see as relevant. Latency is server-side p95 at concurrency one, five passes over 150 held-out test queries, three independently built indexes. Fifty separate development queries were used for tuning and never for reporting.

This section reports SciFact and NFCorpus. FiQA, Quora, the memory-pressure run, and the cold-start run were still running when this draft was written; their sections are marked below and will carry the memory and latency story, because on a 5,000-document corpus every method answers in well under a millisecond and nothing is memory-bound.

### Rescoring Is Most of the Quality

The first question for any method is what it does with and without rescoring, at a fixed search effort. This is `hnsw_ef=256`, oversampling 2, every method, all four small workloads.

{{< chart id="quantization-guide/rescoring" caption="Recall@10 against exact float32 search for each method with rescoring off and on, SciFact with Cohere 1,024-d vectors, Qdrant v1.19.2, hnsw_ef 256, oversampling 2, 150 held-out queries." caption2="Same configurations on SciFact with BGE-small 384-d vectors. Binary and 1-bit codes lose far more on the lower-dimensional model." caption3="Same configurations on NFCorpus with Cohere 1,024-d vectors." caption4="Same configurations on NFCorpus with BGE-small 384-d vectors." >}}

Across all four workloads:

Scalar, 4-bit TurboQuant, and product `x8` reach 0.99 or better recall with rescoring on and sit between 0.93 and 0.99 with it off. For those three, rescoring is a small, cheap correction.

At 2 bits and below, rescoring is the method. TurboQuant 2-bit goes from 0.80 to 0.96 on NFCorpus with BGE and from 0.90 to 1.00 on SciFact with Cohere. TurboQuant 1-bit goes from 0.63 to 0.81 and from 0.77 to 0.94 on the same two. Without the originals to rescore against, a 1-bit copy returns the wrong document in one slot out of four on the Cohere model and more than one in three on BGE.

Binary quantization on 384-dimensional BGE never recovers. One-bit binary with rescoring reaches 0.60 on NFCorpus and 0.64 on SciFact. The two-bit encoding and the int8 query encoding each add 0.14 to 0.18, which still leaves them below every TurboQuant setting at the same compression. On 1,024-dimensional Cohere the same encodings land between 0.78 and 0.92. That is the documented dimensionality dependence of binary quantization, measured: TurboQuant's rotation is doing for the small model what the model's own dimensionality does for the large one.

On these corpora the latency column barely moves with rescoring, because the originals are in the page cache and 20 extra dot products are cheap. Rescoring from disk is a different cost, and the Quora memory-pressure run below is where it shows.

### Tune to a Target, Then Compare

A compression ratio does not pick a method. A quality target does. For each method we swept `hnsw_ef` over 64, 128, 256, and 512, oversampling over 1, 2, 4, and 8, and rescoring off and on, on the 50 development queries only. The rule, fixed before the sweep: take the fastest point with recall@10 of at least 0.95 and nDCG@10 within 0.01 of exact float32. Then freeze it and run the 150 held-out queries once.

{{< chart id="quantization-guide/selected" caption="Recall@10 on held-out queries at each method's development-selected point, four small workloads. Binary 1-bit misses the 0.95 target on three of four even at its best setting." caption2="Server p95 latency at the same frozen points on an 8-vCPU VM, concurrency one. Product quantization costs 2 to 5 times TurboQuant and scalar at matched quality." >}}

The selected points say more than the bars.

| Method | Where the sweep landed, k=10 | Met 0.95 on held-out |
|---|---|---|
| Scalar int8 | `hnsw_ef` 64; rescoring off on Cohere, on with 2 to 4× oversampling on BGE | 4 of 4 |
| TurboQuant 4-bit | `hnsw_ef` 64; rescoring off on SciFact Cohere, on with 2 to 4× elsewhere | 4 of 4 |
| Product x8 | `hnsw_ef` 64, rescoring on, 2 to 4× | 4 of 4 |
| Binary 1-bit | `hnsw_ef` 64 to 256, rescoring on, 8× every time | 1 of 4 |

TurboQuant 4-bit and scalar reach the target at the lowest search effort Qdrant was offered and at 0.17 to 0.21 ms server p95. Binary needed the maximum oversampling in the grid and still failed on both BGE workloads and on NFCorpus with Cohere. Product `x8` met the target everywhere at 0.43 to 0.93 ms, two to five times slower than the others at the same recall.

Held-out recall tracked development recall within 0.03 at every selected point, so the rule generalizes. The sweep is 264 configurations per workload and took about 20 minutes on 5,000 documents, which makes it cheap enough to copy.

### Storage Datatypes Are a Different Trade

The datatype experiment compares five collections: float32 originals alone, float32 with a 4-bit TurboQuant copy, `turbo4` storage with no copy, float32 with a 1-bit copy, and `turbo4` storage with a 1-bit copy. The last one is the smallest configuration Qdrant can build.

{{< chart id="quantization-guide/datatype" caption="Recall@10 at k=10 with rescoring on and oversampling 2 for float32 originals, turbo4 storage, and each with a TurboQuant search copy, four small workloads." caption2="Collection size on disk after indexing for the same five configurations, including vectors, the quantized copy, the HNSW graph, and the WAL." >}}

`turbo4` storage cuts the collection to about a third of its float32 size, including the graph. It also removes recall that nothing downstream can restore: 0.90 to 0.96 on its own, against 0.996 or better for float32 with a 4-bit copy at a cost of 5 to 11% more disk. Add a 1-bit copy over `turbo4` and rescoring happens against 4-bit values, which lands at 0.79 to 0.93. The same 1-bit copy over float32 originals rescores to 0.82 to 0.95. The gap between those two rows is the precision the datatype threw away.

So `turbo4` is a storage decision. Take it when disk, not RAM, is the constraint and a 4 to 10 point recall loss is acceptable. It is not a replacement for a search copy over float32 originals, and it cannot be undone without re-ingesting.

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

### Memory and Latency at Scale

*Pending: FiQA and Quora results, the 1 GiB memory-pressure run on Quora with Cohere vectors, and cold-start passes with the page cache dropped. This section will report resident memory by method, server p95 at the selected points on 523,000 vectors, and per-query vector reads when the originals do not fit in RAM.*

## Choosing

Start from three numbers: the RAM you will give Qdrant, the recall@10 you can accept against exact search, and the p95 you can afford. Then evaluate in this order and stop at the first configuration that meets all three.

**If 4× is enough, or you need Manhattan distance,** scalar. It has no distribution assumptions and rescoring is optional on 1,024-dimensional embeddings. It stops working when your budget needs more than 4×.

**If you need 8×,** 4-bit TurboQuant. In every run it matched scalar's recall at half the memory and the same latency. The exception is Manhattan distance, where its scoring falls back to a slow path.

**If you need 16× to 32× and query speed is the priority,** binary, with rescoring and 8× oversampling budgeted in. Low-dimensional or uncentered embeddings break it: on 384-dimensional BGE no binary encoding reached 0.95 at any setting in the grid. Test it on your model before you plan around it.

**If you need 16× to 32× and recall is the priority,** 2-bit or 1-bit TurboQuant with rescoring on. They reached 0.96 to 1.00 and 0.81 to 0.94 on the same corpora where binary stalled. Turning rescoring off is what breaks them: without the originals, 1-bit TurboQuant loses a quarter or more of the exact top ten.

**If you need 64× and latency does not matter,** product quantization. A p95 target is what rules it out; it was the slowest method at matched recall in every run.

**If disk is the constraint rather than RAM,** `turbo4` storage, with the recall loss above priced in.

Whatever you pick, leave the originals as `cold`, pin the quantized copy, and leave rescoring on until a measurement tells you it is not needed. Rescoring 20 candidates costs microseconds when the originals are in the page cache. The only reason to turn it off is that they are not, and you find that out by measuring, not by guessing.

## Measure It on Your Data

Every number above came from embeddings that are not yours. The procedure transfers; the numbers do not. Here is the minimum that catches the mistakes we see most often.

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

Report unquantized HNSW too, so you can see how much error the graph adds before quantization does. On these corpora float32 HNSW at `hnsw_ef` 64 or 128 scored 0.97 to 0.996, so part of the gap to 1.0 in the charts belongs to the graph, not the codes.

Then tune on queries you will not report, freeze, and evaluate once. Keep the tuning sweep small: `hnsw_ef` and oversampling are the two knobs that matter, rescoring is a binary you should test both ways, and three builds of the index tell you whether a 0.01 difference is real. On every workload here, build-to-build recall varied by at most 0.013.

The [benchmark repository](https://github.com/qdrant-labs/quantization-comparison-bench) runs this whole protocol with one command per dataset and writes the tables in this guide. Point it at your own embeddings by replacing the prepared arrays; the format is a float32 matrix, an ID list, and a relevance file.

## Where This Stops

Two embedding models and four datasets cannot establish rules. They establish the shape of the trade and a way to measure it. The strongest result here, that binary quantization fails on a 384-dimensional model where TurboQuant at the same compression does not, is consistent with how both methods work. Check it on a third model before building on it.

The small corpora in this draft say nothing about memory or disk. A 5,000-document collection fits in the page cache a hundred times over. The Quora run and the memory-pressure run are what turn this from a quality comparison into a sizing guide, and they will replace the pending section above.

Neural quantizers, learned rotations, and dimensionality reduction were outside the agreed scope and are not covered. Turbo8 is merged in Qdrant's main branch but not in v1.19.2, so it is not measured.
