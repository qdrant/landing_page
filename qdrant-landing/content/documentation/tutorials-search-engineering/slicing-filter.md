---
title: Deterministic Slicing with the Slice Filter
short_description: "Split a Qdrant collection into disjoint, deterministic subsets with the slice filter for parallel scroll and reproducible sampling."
description: "Use Qdrant's slice filter to divide a collection into fixed, deterministic subsets for parallel scroll across workers, reproducible sampling, and stratified sampling with a payload filter."
weight: 15
aliases:
  - /documentation/tutorials/slicing-filter/
---

# Deterministic Slicing for Parallel Scroll and Sampling

| Time: 20 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/blob/master/slicing-filter/Slicing_Filter.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/slicing-filter/Slicing_Filter.ipynb) |
| --- | ----------- | ----------- | ----------- |

Exporting or re-embedding a large collection with a single `scroll` call is slow, and splitting the work across worker processes usually means paging through the collection and dividing IDs by hand, or reaching for random sampling that returns a different set of points on every run. Qdrant's `slice` filter condition, available as of v1.19.0, solves both: it divides a collection into a fixed number of deterministic, disjoint subsets, so several workers can each claim one subset with no coordination, and a single subset makes a reproducible sample for evaluation or a train/test split.

A point matches slice `index` of `total` when `hash(id) % total == index`, using SipHash-2-4 over the point ID bytes. For a fixed `total`, slices `0` through `total - 1` are disjoint and together cover the whole collection. Unlike [random sampling](/documentation/search/search/#random-sampling), a given slice always returns the same points, and it composes with any other filter condition, including a payload filter.

This tutorial covers three uses: parallel `scroll` across workers, reproducible sampling for evaluation, and stratified sampling by combining `slice` with a payload filter.

## Setup

The [Cloud Quickstart](/documentation/cloud-quickstart/) covers creating a cluster and connecting a client. This tutorial uses [Qdrant Cloud Inference](/documentation/inference/cloud-inference/) to embed the sample data server-side, with the free model `sentence-transformers/all-MiniLM-L6-v2`.

```python
import os

from qdrant_client import AsyncQdrantClient, models

client = AsyncQdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
)

collection_name = "slicing-demo"
embedding_model = "sentence-transformers/all-MiniLM-L6-v2"

await client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)
```

<aside role="status">
To self-host, generate dense vectors on the client with a library like <a href="/documentation/fastembed/">FastEmbed</a> and pass them as raw vectors instead of <code>models.Document</code>.
</aside>

Upload a small catalog of product descriptions. Each point's vector is a `Document` object, embedded server-side:

```python
import random

random.seed(0)

products = {
    "electronics": ["wireless earbuds", "4K monitor", "mechanical keyboard", "USB-C hub", "smartwatch"],
    "books": ["science fiction novel", "cookbook", "history book", "graphic novel", "poetry collection"],
    "clothing": ["running shoes", "wool sweater", "denim jacket", "rain jacket", "cotton t-shirt"],
    "home": ["cast iron pan", "ceramic mug", "throw blanket", "desk lamp", "storage basket"],
}
categories = list(products)

points = []
for i in range(500):
    category = random.choice(categories)
    description = random.choice(products[category])
    points.append(
        models.PointStruct(
            id=i,
            payload={"category": category},
            vector=models.Document(text=description, model=embedding_model),
        )
    )

await client.upload_points(collection_name=collection_name, points=points, wait=True)
```

## Scrolling a Single Slice

A `SliceCondition` takes an `index` and a `total`. This scrolls slice `3` of `8`, one eighth of the collection:

```python
result, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(
        must=[models.SliceCondition(slice=models.Slice(index=3, total=8))],
    ),
    limit=500,
    with_payload=False,
    with_vectors=False,
)

print(f"slice 3 of 8: {len(result)} points")
# slice 3 of 8: 61 points
```

With `total: 8` and 500 points, each slice holds roughly 60 points, close to `500 / 8`.

## Concurrent Scrolling Across Workers

The main use case is splitting a full scroll into `N` independent, non-overlapping scrolls, one per worker. Each worker only needs its own `index`, and since the slices don't overlap, the requests have nothing to coordinate on and can run concurrently. Use `AsyncQdrantClient` with `asyncio.gather` to fire all requests at once instead of waiting on them one at a time.

```python
import asyncio


async def scroll_slice(index: int, total: int) -> list[models.Record]:
    records, _ = await client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[models.SliceCondition(slice=models.Slice(index=index, total=total))],
        ),
        limit=500,
        with_payload=True,
        with_vectors=False,
    )
    return records


total_slices = 4
slices = await asyncio.gather(*(scroll_slice(i, total_slices) for i in range(total_slices)))

for i, s in enumerate(slices):
    print(f"worker {i}: {len(s)} points")
print(f"sum across workers: {sum(len(s) for s in slices)}")
# worker 0: 115 points
# worker 1: 143 points
# worker 2: 118 points
# worker 3: 124 points
# sum across workers: 500
```

Every point appears in exactly one slice, so the counts add up to the full collection with no overlap and no gaps:

```python
ids_per_slice = [{r.id for r in s} for s in slices]
overlap = set.intersection(*ids_per_slice)
union = set.union(*ids_per_slice)

count_result = await client.count(collection_name=collection_name)

print(f"overlapping IDs: {len(overlap)}")
print(f"union covers full collection: {len(union) == count_result.count}")
# overlapping IDs: 0
# union covers full collection: True
```

## Reproducible Sampling

Because the hash is stable across runs and Qdrant versions, a single slice makes a reproducible sample. Requesting slice `0` of `total: 10` always returns the same 10% of the collection, which makes it a solid choice for a recall benchmark or a train/test split that has to be repeatable.

```python
sample, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(
        must=[models.SliceCondition(slice=models.Slice(index=0, total=10))],
    ),
    limit=10000,
    with_payload=False,
    with_vectors=False,
)
sample_ids = {p.id for p in sample}

sample_again, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(
        must=[models.SliceCondition(slice=models.Slice(index=0, total=10))],
    ),
    limit=10000,
    with_payload=False,
    with_vectors=False,
)

print(f"sample size: {len(sample_ids)}")
print(f"identical on repeat: {sample_ids == {p.id for p in sample_again}}")
# sample size: 47
# identical on repeat: True
```

Slices with different `total` values are also correlated: slice `0` of `total: 4` is always a subset of slice `0` of `total: 2`. Growing the number of slices refines a sample instead of reshuffling it:

```python
coarse, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(must=[models.SliceCondition(slice=models.Slice(index=0, total=2))]),
    limit=10000,
    with_payload=False,
    with_vectors=False,
)
fine, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(must=[models.SliceCondition(slice=models.Slice(index=0, total=4))]),
    limit=10000,
    with_payload=False,
    with_vectors=False,
)

fine_ids = {p.id for p in fine}
coarse_ids = {p.id for p in coarse}

print(f"slice 0/4 is a subset of slice 0/2: {fine_ids.issubset(coarse_ids)}")
# slice 0/4 is a subset of slice 0/2: True
```

## Stratified Sampling with Payload Filters

`slice` is a normal filter condition, so it combines with any other condition. This gives a reproducible sample restricted to one category, useful for a canary rollout or for evaluating a change against a single segment of the data.

```python
await client.create_payload_index(
    collection_name=collection_name,
    field_name="category",
    field_schema=models.PayloadSchemaType.KEYWORD,
)

stratified, _ = await client.scroll(
    collection_name=collection_name,
    scroll_filter=models.Filter(
        must=[
            models.SliceCondition(slice=models.Slice(index=0, total=5)),
            models.FieldCondition(key="category", match=models.MatchValue(value="electronics")),
        ],
    ),
    limit=10000,
    with_payload=True,
    with_vectors=False,
)

print(f"electronics points in slice 0/5: {len(stratified)}")
print(f"all match the category: {all(p.payload['category'] == 'electronics' for p in stratified)}")
# electronics points in slice 0/5: 28
# all match the category: True
```

## Related Reading

- [Filtering](/documentation/search/filtering/) for the full set of filter clauses `slice` combines with.
- [Scroll Points](/documentation/manage-data/points/#scroll-points) for paging through a collection.
- [Random Sampling](/documentation/search/search/#random-sampling) for a non-deterministic alternative when reproducibility doesn't matter.
- [Qdrant Cloud Inference](/documentation/inference/cloud-inference/) for generating the dense embeddings server-side.
