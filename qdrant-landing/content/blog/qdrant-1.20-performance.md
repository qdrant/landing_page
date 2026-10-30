---
draft: false
title: "Faster and Cheaper Search With Qdrant 1.20"
slug: qdrant-1.20-performance
short_description: "How the new turbo8 and turbo16 datatypes and per-element nested indexes in Qdrant 1.20 perform."
description: "Measurements of Qdrant 1.20 performance: turbo8 and turbo16 match float32 recall at a quarter and half of the storage, and per-element indexes make nested filters up to 4 times faster."
preview_image: /blog/qdrant-1.20-performance/hero.jpg
social_preview_image: /blog/qdrant-1.20-performance/preview/social_preview.jpg
date: 2026-10-27T00:00:00-01:00
author: Clelia Bertelli
author_profile: clelia-bertelli
featured: false
tags:
  - vector search
  - quantization
  - filtering
  - benchmark
---

With [Qdrant 1.20](/blog/qdrant-1.20.x/), we shipped two main features that can make your search cheaper and faster: two new quantization-native datatypes (`turbo8` and `turbo16`) and advanced metadata indexing for nested fields. We measured the performance and cost improvements so you don't have to, and in this blog post we go through our findings.

## Reduce Your Disk Usage, Not Your Recall

Storing vectors is always the main expense when it comes to semantic search: they cost disk when cold, and memory when warm.

Quantization-native datatypes can help mitigate this by reducing the number of bits needed to store each dimension of a vector: `turbo8` uses 8 bits and `turbo16` uses 16, so the same collection takes a quarter (`turbo8`) or half (`turbo16`) of the space of `float32`. For teams that are running out of RAM or disk, that means fewer nodes, or room for more data on the nodes they already have.

You might now be thinking: "Why should I prefer this over the existing `float16` and `uint8`?" The answer is straightforward: turning a `float32` into a `float16` or a `uint8` loses not only _precision_ (fewer bits) but also _information_, since the compression relies on simple transformations.

Quantization-native datatypes, instead, use [TurboQuant](/articles/turboquant-quantization/), a rotation-based compression algorithm that works well on most datasets (thanks in part to a couple of tricks we added in Qdrant). It preserves the relevant information while still reducing the precision, and thus the storage needed for each vector. This makes it a good fit for resource-constrained workloads that still need high search quality.

{{< chart id="datatypes/storage-recall" caption="The same 100,000 vectors with 1,536 dimensions, stored as float32, turbo16, and turbo8. Storage falls with each step down in bits, and recall stays level." >}}

`turbo4`, the 4-bit datatype from version 1.19, saves even more (8x less storage), but it gives up a few percentage points of recall on some datasets. Go for it when resource constraints are a more pressing issue than high search quality.

To use the new datatypes, choose one when you create a collection. You can then upload regular `float32` vectors as usual, and Qdrant rotates them with TurboQuant and stores them on an 8-bit or 16-bit integer grid:

```http
PUT /collections/{collection_name}
{
  "vectors": {
    "size": 1536,
    "distance": "Cosine",
    "datatype": "turbo8"
  }
}
```

## "But Doesn't Quantization Increase Latency?"

Yes, quantization can increase latency, but as the next figure shows, `turbo8` and `turbo16` stay within 10% of the server-side latency of `float32` vectors. The stored vectors are already quantized, but the incoming query is not. Cleverly, Qdrant does not apply the full TurboQuant pipeline to the query as well: it only rotates it and keeps it at `float32` precision (asymmetric scoring), so the overhead is minimal and search remains fast.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/datatype-latency"
    width="85%" ratio="520 / 400"
>}}
![Scatter plot of recall@100 against median server latency in ms, on a log scale. float32, turbo16, turbo8, and turbo4 answer in about 1 to 2 ms. Scalar int8 and binary quantization with rescoring take about 100 ms.](/blog/qdrant-1.20-performance/datatype-latency.svg)
{{< /island >}}

For scalar and binary quantization, which shrink the vectors that Qdrant searches but keep the full-precision copies as well, the story is a bit different. To recover recall, they can rescore the best candidates against the `float32` originals. When those originals are on disk, as they often are when memory is tight, every query waits for disk reads. You could skip rescoring to avoid the wait, but then recall would drop.

The TurboQuant datatypes have no rescoring step, because the compact vectors _are_ the vectors and the `float32` originals are discarded. Nothing waits on the disk, and recall stays close to `float32`.

> We ran every datatype on 14 embedding datasets with 512 to 3,072 dimensions. HNSW is the index, and exact search gives the ground truth. The figures use the three datasets with 1,536 dimensions, at a limit of 100 results and 2x oversampling for scalar and binary quantization. The code is in the [modern-quantization-bench](https://github.com/qdrant-labs/modern-quantization-bench) repository.

## Dot-Driven Filtering

In a [2017 paper](https://kar.kent.ac.uk/67139/1/paper.pdf), Tomas Petricek described _dot-driven development_ as a way to explore data through nested, chained member access (as in `string.strip().toUpper()`). The same nestedness is very common in the metadata payloads associated with vectors in Qdrant, which often contain arrays of objects, like the authors of a paper.

A [nested filter](/documentation/search/filtering/#nested-object-filter) asks for one element that meets every condition, such as an author whose first name is Ada and whose last name is Hopper. Until now, Qdrant answered it in two steps (we call these _regular_ nested filters here). First, an index lookup finds the candidate points that match every condition, though not necessarily in the same element. Then Qdrant reads the payloads of those candidates (from disk or memory, depending on the placement) and narrows them down to the points that actually satisfy all the conditions in a single element.

With Qdrant 1.20, we introduced per-element indexing for nested fields, which lets Qdrant skip the second step and check the whole filter with index lookups alone.

{{< chart id="nested-filters/modes" caption="p95 latency of flat filters, nested filters on regular indexes, and nested filters on a per-element index, on 1 million papers. Lower is better." caption2="Throughput of the same three modes with 16 concurrent clients. Higher is better." caption3="Recall@10 of the same three modes, scored against exact nested results. Flat filters return wrong points, so their recall is lower." >}}

On 1 million arXiv papers, the per-element index served up to four times as many queries per second as regular indexes, with the same correct results. A flat filter (see the next section) is close in speed, but it misses between a fifth and a third of the right papers.

> The code for this benchmark is in the [nested-filters-bench](https://github.com/qdrant-labs/nested-filters-bench) repository.

### Work Smarter, Not Harder

A _flat filter_ checks each condition on its own. It uses index lookups only, so it works like a regular nested filter without the second step of reading payloads. The per-element index, on the other hand, stores each author as its own entry, so it returns the same correct points as a regular nested filter without reading a single payload.

Flat filters are usually the fastest, since the conditions can match different elements of an array, but they should not be used on arrays of objects, as they return many false positives.

The next figure follows a filter for an author named Ada Hopper through each mode. Pick a mode, or replay it, and follow the steps.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/nested-filter-modes"
    width="90%" ratio="564 / 372"
>}}
![A payload index next to payload storage. A flat filter returns P1 by mistake, because P1 has an Ada and a Hopper in different authors. A nested filter on regular indexes reads both payloads to reject P1. A nested filter on a per-element index returns only P2 with index lookups alone.](/blog/qdrant-1.20-performance/nested-filter-modes.svg)
{{< /island >}}

You create a per-element index by setting `nested` to the array key when you create a payload index on a field inside its elements:

```http
PUT /collections/{collection_name}/index
{
  "field_name": "authors[].first",
  "field_schema": {
    "type": "keyword",
    "nested": "authors"
  }
}
```

Create the same index for each field in the filter, and your existing nested filters get faster without any change to the search request.

## Try It

Both features are available in [Qdrant 1.20](/blog/qdrant-1.20.x/). Set `datatype` to `turbo8` or `turbo16` when you create a collection, and add `nested` to the payload indexes behind your nested filters. Tell us how it goes on [Discord](https://discord.gg/qdrant).
