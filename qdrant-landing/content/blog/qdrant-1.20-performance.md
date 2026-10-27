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

[Qdrant 1.20](/blog/qdrant-1.20.x/) ships with two main changes that can make your search cheaper and faster: new quantization-native datatypes (`turbo8` and `turbo16`) and advanced metadata indexing for nested fields. In this blog post, we explore how these improvements can impact your search workloads.

## Smaller Vectors, Same Recall

A vector's [datatype](/documentation/manage-data/vectors/#datatypes) sets how many bits Qdrant spends on each dimension. Version 1.19 introduced [`turbo4`](/documentation/manage-data/vectors/#turbo4), which is the smallest option but loses recall on some datasets. Version 1.20 adds [`turbo8`](/documentation/manage-data/vectors/#turbo8) and [`turbo16`](/documentation/manage-data/vectors/#turbo16). You upload regular `float32` vectors, and Qdrant rotates them with TurboQuant and stores them on an 8-bit or 16-bit integer grid:

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

We compared the datatypes on 15 embedding datasets, from 512 to 3,072 dimensions, with HNSW and exact search as the ground truth. The code is in the [modern-quantization-bench](https://github.com/qdrant-labs/modern-quantization-bench) repository.

{{< chart id="turbo-datatypes/recall" caption="Recall@10 for float32, turbo16, turbo8, and turbo4 on six of the 15 datasets, with the number of dimensions in each label." >}}

`turbo16` and `turbo8` track `float32` on every dataset. Averaged over all 15, recall@10 was 97.9% for `float32` and `turbo8`, and 98.1% for `turbo16`. `turbo4` averaged 93.7%, and fell as far as 8.3 percentage points behind on the arXiv text embeddings.

The savings come with no `float32` copy to keep around, because a datatype replaces the original vectors. For about 100,000 vectors with 1,536 dimensions, storage goes from 585 MB with `float32` to 293 MB with `turbo16`, and to 147 MB with `turbo8`. Search stays close to `float32` speed: median server-side latency was about 10% higher with `turbo16` and 6% higher with `turbo8`, which is likely due to the query being rotated before scoring, something `float32` doesn't need.

In short, `turbo16` halves your vector storage and `turbo8` cuts it by four, and both are close to the full-precision vectors baseline in terms of recall and latency. You should reach for `turbo4` when you want the smallest footprint and can tolerate a relatively small drop in search quality.

## Nested Filters Without Payload Reads

Many payloads contain arrays of objects, like the authors of a paper. A [nested filter](/documentation/search/filtering/#nested-object-filter) requires that a single element meets all conditions, such as an author whose first name is Ada and whose last name is Hopper.

Qdrant can answer that filter in three ways, and they differ in both speed and correctness. Select each one in the figure.

{{< island
    path="content/headless/blog/qdrant-1.20-performance/nested-filter-modes"
    width="80%" ratio="484 / 516"
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

We tested this on 1 million arXiv papers, with filters on authors, revisions, and categories. The code is in the [nested-filters-bench](https://github.com/qdrant-labs/nested-filters-bench) repository.

{{< chart id="nested-filters/modes" caption="p95 latency of flat filters, nested filters on regular indexes, and nested filters on a per-element index, on 1 million papers. Lower is better." caption2="Throughput of the same three modes with 16 concurrent clients. Higher is better." caption3="Recall@10 of the same three modes, scored against exact nested results. Flat filters return wrong points, so their recall is lower." >}}

The per-element index was the fastest correct option on every filter, and we observed that the gain is largest when many candidates survive the index lookup. For a filter on a revision created in a 90-day window, p95 latency dropped from 265 ms to 56 ms, and throughput went from 40 to 157 queries per second compared to regular nested filters. Filters that combine an author with a revision, or a revision with a category, saw p95 latency drop by 3.6 to 4.5 times.

Compared with a flat filter, the per-element index is slightly slower, but it returns the right papers: flat filters reached a recall of only 64% to 80%, against 99.5% or higher for the per-element index.

## Try It

Both features are available in [Qdrant 1.20](/blog/qdrant-1.20.x/). Set `datatype` to `turbo8` or `turbo16` when you create a collection, and add `nested` to the payload indexes behind your nested filters. Tell us how it goes on [Discord](https://discord.gg/qdrant).
