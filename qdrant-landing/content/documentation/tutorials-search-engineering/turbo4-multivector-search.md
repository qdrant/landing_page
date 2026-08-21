---
title: "Turbo4 Multivector Search"
short_description: "Combine the turbo4 datatype with multivector late interaction to cut on-disk vector size at a bounded recall cost."
description: "Tutorial: store multivector late interaction embeddings with Qdrant's turbo4 datatype and query them alongside dense and sparse vectors."
weight: 14
aliases:
  - /documentation/tutorials-search-engineering/multivector-turbo4/
---

# Turbo4 Multivector Search

| Time: 25 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/blob/master/multivector-turbo4/Multivector_Turbo4.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/multivector-turbo4/Multivector_Turbo4.ipynb) |
| --- | ----------- | ----------- | ----------- |

As of [Qdrant 1.19](https://qdrant.tech/blog/qdrant-1.19.x/), Qdrant supports `turbo4`, a datatype that stores dense vectors on disk as 4-bit values per dimension instead of the 32 bits per dimension that `float32` uses. That's an eighth of the storage, at some cost to recall.

`turbo4` is inspired by [Google's TurboQuant](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) quantization technique: each vector is mathematically rotated so its information spreads evenly across all dimensions, which keeps the loss during compression low. Each rotated value is then stored as one of 16 levels, which fits in 4 bits and shrinks the vector to an eighth of its original size. `turbo4` is a standalone datatype rather than a wrapper around TurboQuant, so you can quantize it further. For example, you can combine `turbo4` with 1-bit TurboQuant quantization.

This tutorial focuses on a case that datatype comparisons usually skip: `turbo4` on [multivector representations](/documentation/tutorials-search-engineering/using-multivector-representations/). You'll build a product search collection that stores a ColBERT late interaction vector as `turbo4`, alongside a `turbo4` image vector and a BM25 sparse vector, and query all three together with the Query API.

This tutorial assumes you're comfortable with [named vectors](/documentation/manage-data/vectors/#named-vectors), [multivectors and late interaction](/documentation/tutorials-search-engineering/using-multivector-representations/), and the [Query API](/documentation/search/hybrid-queries/).

## Setup

You'll use [Qdrant Cloud Inference](/documentation/cloud/inference/) to generate embeddings server-side, so `qdrant-client` is the only Qdrant dependency you need. `huggingface-hub` and `polars` download and process the dataset; `httpx` fetches a product image at the end.

```bash
pip install qdrant-client huggingface-hub polars httpx
```

<aside role="status">
This tutorial uses <a href="/documentation/cloud/inference/">Qdrant Cloud Inference</a>, which is Cloud-only. To self-host, generate the ColBERT, CLIP, and BM25 vectors on the client with a library like <a href="/documentation/fastembed/">FastEmbed</a> and pass them as raw vectors instead of <code>models.Document</code> and <code>models.Image</code>.
</aside>

## Dataset

You'll work with the `Pet_Supplies` category of the [`McAuley-Lab/Amazon-Reviews-2023`](https://huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023) dataset, loaded with Polars:

```python
from huggingface_hub import snapshot_download
import polars as pl

path = snapshot_download(
    "McAuley-Lab/Amazon-Reviews-2023",
    repo_type="dataset",
    allow_patterns=["raw/meta_categories/meta_Pet_Supplies.jsonl"],
)

df = pl.read_ndjson(path + "/raw/meta_categories/meta_Pet_Supplies.jsonl", ignore_errors=True, n_rows=200_000)
```

Keep only the columns this tutorial embeds, and drop rows missing an image or a description:

```python
df = df.drop_nans()
df = df.drop_nulls()
df = df.select(["title", "description", "images", "price", "details"])
df = df.filter((pl.col("images").list.len() > 0) & (pl.col("description").list.len() > 0))
print(f"Dataset size: {df.height}")
```

This leaves 49,310 products, each with:

- `title`: the product name, embedded with [BM25](/documentation/inference/inference-bm25/) as a sparse vector.
- `description`: the product description, embedded with [ColBERT](/articles/late-interaction-models/), a late interaction model that produces one vector per token instead of one vector per document.
- `images`: the product images, embedded with the `qdrant/clip-vit-b-32-vision` model.
- `details` and `price`, kept as payload metadata.

## Create a Collection

Create a [Qdrant cluster](/documentation/cloud/create-cluster/#standard-clusters), save its URL and API key, and use them to instantiate the client with `cloud_inference=True`:

```python
import os

from qdrant_client import AsyncQdrantClient

client = AsyncQdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=600,
    cloud_inference=True,
)
```

Now create the collection. Both dense vectors use `datatype=models.Datatype.TURBO4`. `description` also sets `multivector_config` with `MAX_SIM` as the comparator, which tells Qdrant to score each document by its best-matching token pair, the way ColBERT's late interaction retrieval works:

```python
from qdrant_client import models

await client.create_collection(
    collection_name="pet_supplies",
    vectors_config={
        "description": models.VectorParams(
            size=96,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            datatype=models.Datatype.TURBO4,
        ),
        "image": models.VectorParams(
            size=512,
            distance=models.Distance.COSINE,
            datatype=models.Datatype.TURBO4,
        ),
    },
    sparse_vectors_config={
        "title": models.SparseVectorParams(modifier=models.Modifier.IDF)
    },
)
```

`turbo4` applies to both the single dense `image` vector and the per-token `description` multivector. The datatype choice is independent of whether a field holds one vector per point or hundreds.

## Upload Data

With the collection created, upload the data and let Cloud Inference embed it server-side, so you never load an embedding model locally:

```python
import uuid
from typing import Any


def get_image(img_dict: dict[str, Any]) -> str:
    try:
        return img_dict["large"]
    except KeyError:
        return img_dict[next(iter(img_dict))]


for batch in df.iter_slices(100):
    points = []
    for row in batch.iter_rows(named=True):
        image_url = get_image(row["images"][0])
        description = "\n".join(row["description"])
        points.append(models.PointStruct(
            id=str(uuid.uuid4()),
            vector={
                "description": models.Document(
                    text=description,
                    model="answerdotai/answerai-colbert-small-v1",
                ),
                "image": models.Image(
                    image=image_url,
                    model="qdrant/clip-vit-b-32-vision",
                ),
                "title": models.Document(
                    text=row["title"],
                    model="qdrant/bm25",
                ),
            },
            payload={
                "price": row["price"],
                "details": row["details"],
                "title": row["title"],
                "image": image_url,
                "description": description,
            },
        ))
    await client.upsert(collection_name="pet_supplies", points=points)
```

`get_image` prefers the `large` image variant and falls back to whichever variant is present, since not every product lists the same set of sizes.

## Query

[Prefetch](/documentation/search/hybrid-queries/) candidates using either the image vector or the title vector, then rescore them with the ColBERT `description` vector through late interaction. Give the prefetch a `limit` well above the final `limit`, so the rescore has a real candidate pool to work with instead of just reordering one or two results:

```python
query = "Orijen dry cat food"
image_query = models.Document(text=query, model="qdrant/clip-vit-b-32-text")
title_query = models.Document(text=query, model="qdrant/bm25")
colbert_query = models.Document(text=query, model="answerdotai/answerai-colbert-small-v1")

response = await client.query_points(
    collection_name="pet_supplies",
    prefetch=models.Prefetch(
        query=image_query,
        using="image",
        limit=50,
    ),
    query=colbert_query,
    limit=1,
    with_payload=True,
    using="description",
)

result = response.points[0]
print(result.payload["title"])
```

```text
ORIJEN® Dry Adult Cat Food, Grain Free, Premium, High Protein, Fresh & Raw Animal Ingredients, Guardian 8, 10lb
```

The image prefetch retrieves candidates whose product photo is close to the CLIP text embedding of the query, and the ColBERT rescore reorders those candidates by token-level match against the description. Swap the prefetch to `title_query` on `using="title"` and the same query reranks BM25 title matches instead:

```python
response_bm25 = await client.query_points(
    collection_name="pet_supplies",
    prefetch=models.Prefetch(
        query=title_query,
        using="title",
        limit=50,
    ),
    query=colbert_query,
    limit=10,
    with_payload=True,
    using="description",
)
```

Both queries reuse the same `description` multivector for rescoring. Only the retrieval path, image or title, changes.

## Wrapping Up

`turbo4` is a general-purpose datatype, not a special case for single dense vectors: this collection stores it on a 512-dimensional image vector and on a per-token ColBERT multivector, side by side with a BM25 sparse vector, and queries all three through one Query API call. Set `datatype=models.Datatype.TURBO4` on any `VectorParams`, dense or multivector, where you want the 4-bit on-disk footprint.

Related reading:

- [Multivectors and Late Interaction](/documentation/tutorials-search-engineering/using-multivector-representations/) for why late interaction rescoring works and when to skip HNSW indexing on the multivector.
- [Hybrid Queries reference](/documentation/search/hybrid-queries/) for the full Query API surface, including prefetch and fusion.
- [Qdrant 1.19 release notes](/blog/qdrant-1.19.x/) for the rest of what shipped alongside `turbo4`.
