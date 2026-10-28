---
draft: false
title: "Qdrant 1.20 Performance: TurboQuant 8 and 16 Bits, and Faster Nested Filters"
slug: qdrant-1.20-performance
short_description: "How the new turbo8 and turbo16 datatypes and per-element nested indexes in Qdrant 1.20 perform."
description: "Benchmarks of Qdrant 1.20: turbo8 and turbo16 match float32 recall at a quarter and half of the storage, and per-element indexes make nested filters up to 4 times faster."
preview_image: /blog/qdrant-1.20-performance/hero.jpg
social_preview_image: /blog/qdrant-1.20-performance/preview/social_preview.jpg
date: 2026-10-27T00:00:00-01:00
author: Clelia Bertelli
featured: false
tags:
  - vector search
  - quantization
  - filtering
  - benchmark
---

[Qdrant 1.20](/blog/qdrant-1.20.x/) brings two changes that make your search cheaper and faster. The new `turbo8` datatype stores vectors in 75% less space at the same recall as `float32`, and per-element indexes cut the p95 latency of nested filters by 80%. In this blog post, we explore why that matters and how it works.

## 75% Less Vector Storage at the Same Recall

Vectors take up most of the memory and disk in a collection, so shrinking them also reduces infrastructure costs. `turbo8` stores each dimension in 8 bits and `turbo16` in 16, which cuts vector storage by 75% and 50% compared to `float32`. Average recall@10 stays at 98.0% and 98.1%, against 97.9% for `float32`. The 4-bit `turbo4` datatype from version 1.19 saves even more, but drops to 93.7%.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/datatype-storage"
    width="85%" ratio="520 / 400"
>}}
![Scatter plot of recall@100 against vector storage in MB. turbo8 stores 147 MB, turbo16 293 MB, and turbo4 74 MB, all at about the recall of float32, which stores 585 MB. Scalar int8 and binary quantization store more than float32, because they keep the originals.](/blog/qdrant-1.20-performance/datatype-storage.svg)
{{< /island >}}

The figure plots 100,000 vectors with 1,536 dimensions: there, `float32` takes 585 MB, `turbo16` takes 293 MB, and `turbo8` takes 147 MB, all with recall in the same range. Quantization-native datatypes such as `turbo8` and `turbo16` _replace_ the original full-precision vectors, so nothing else is stored. Scalar and binary quantization, which we added for comparison, work differently: they keep the `float32` originals and add a smaller quantized copy next to them, which they often keep warm, in-memory, for faster access. That is why they take 732 MB and 604 MB, more than `float32` alone.

### Latency

Storage is only half of the story. The next figure shows recall against median search latency for the same datatypes. The latency axis is a log scale.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/datatype-latency"
    width="85%" ratio="520 / 400"
>}}
![Scatter plot of recall@100 against median server latency in ms, on a log scale. float32, turbo16, turbo8, and turbo4 answer in about 1 to 2 ms. Scalar int8 and binary quantization with rescoring take about 100 ms.](/blog/qdrant-1.20-performance/datatype-latency.svg)
{{< /island >}}

`turbo8` and `turbo16` answer in about 2 ms. This is within about 10% of `float32`. The small gap likely comes from the rotation of the query before scoring, a step that `float32` does not need. The search is a single pass over the compact vectors, and Qdrant reads nothing from disk.

Scalar and binary quantization work in two passes. They search the quantized copy first, then they rescore the best candidates, which means they compare them with the `float32` originals. The second pass raises recall, but it also costs time: in our benchmark the originals are on disk, as in many setups with limited memory, so most rescoring operations are cold reads from disk.

With a limit of 100 results and 2x oversampling (twice as many candidates as results), Qdrant reads 200 original vectors for each query, so latency rises to about 100 ms. Without rescoring, both methods answer in about 1 ms, but, for instance, binary quantization then drops to 71% recall. 

In short, `turbo8` and `turbo16` give the recall of full-precision vectors at a fraction of the size, and they need no rescoring step. `turbo4` is smaller still, but its recall drops: use it when you want the smallest footprint and can accept a small drop in search quality.

> We ran every datatype on 14 embedding datasets with 512 to 3,072 dimensions. HNSW is the index, and exact search gives the ground truth. The figures use the three datasets with 1,536 dimensions, at a limit of 100 results. The code is in the [modern-quantization-bench](https://github.com/qdrant-labs/modern-quantization-bench) repository.

### Using the Datatypes

A vector's [datatype](/documentation/manage-data/vectors/#datatypes) sets how many bits Qdrant spends on each dimension. Version 1.20 adds [`turbo8`](/documentation/manage-data/vectors/#turbo8) and [`turbo16`](/documentation/manage-data/vectors/#turbo16) next to [`turbo4`](/documentation/manage-data/vectors/#turbo4). You set the datatype when you create a collection, upload regular `float32` vectors, and Qdrant rotates them with TurboQuant and stores them on an 8-bit or 16-bit integer grid:

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

Use `turbo16` instead to halve the vector storage with no loss in recall, or `turbo8` to cut it by a factor of four.

## Nested Filters Up to 4x Faster

Many payloads contain arrays of objects, like the authors of a paper. A [nested filter](/documentation/search/filtering/#nested-object-filter) requires that a single element meets all conditions, such as an author whose first name is Ada and whose last name is Hopper.

We tested the new per-element indexes on 1 million arXiv papers, with filters on authors, revisions, and categories. For a filter on a revision created in a 90-day window, p95 latency dropped from 265 ms to 56 ms, and throughput went from 40 to 157 queries per second compared to regular nested filters. Filters that combine an author with a revision, or a revision with a category, saw p95 latency drop by 3.6 to 4.5 times.

{{< chart id="nested-filters/modes" caption="p95 latency of flat filters, nested filters on regular indexes, and nested filters on a per-element index, on 1 million papers. Lower is better." caption2="Throughput of the same three modes with 16 concurrent clients. Higher is better." caption3="Recall@10 of the same three modes, scored against exact nested results. Flat filters return wrong points, so their recall is lower." >}}

The per-element index was the fastest correct option on every filter, and the gain is largest when many candidates survive the index lookup. Compared with a flat filter, it is slightly slower, but it returns the right papers: flat filters reached a recall of only 64% to 80%, against 99.5% or higher for the per-element index. The code is in the [nested-filters-bench](https://github.com/qdrant-labs/nested-filters-bench) repository.

### What Changed

Qdrant can answer a filter on an array of objects in three ways, and they differ in both speed and correctness. Select each one in the figure.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/nested-filter-modes"
    width="80%" ratio="484 / 426"
>}}
![A flat filter returns points 1 and 2, and point 1 is a false match. A nested filter on regular indexes reads two payloads and returns point 2. A nested filter on a per-element index returns point 2 without reading any payload.](/blog/qdrant-1.20-performance/nested-filter-modes.svg)
{{< /island >}}

A flat filter checks each condition on its own, so the first name and the last name can come from different authors. It is fast and wrong. A nested filter on regular indexes is correct, but the indexes only narrow the candidates, and Qdrant reads each candidate payload to check one author at a time. The new per-element index stores every author as its own entry, so the filter is answered from the index alone.

You create one by setting `nested` to the array key when you create a payload index on a field inside its elements:

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

Create the same index for each field in the filter, and existing nested filters get faster without any change to the search request.

## Try It

Both features are available in [Qdrant 1.20](/blog/qdrant-1.20.x/). Set `datatype` to `turbo8` or `turbo16` when you create a collection, and add `nested` to the payload indexes behind your nested filters. Tell us how it goes on [Discord](https://discord.gg/qdrant).
