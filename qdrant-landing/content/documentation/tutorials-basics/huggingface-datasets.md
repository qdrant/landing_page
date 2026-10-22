---
title: Hugging Face Dataset Ingestion
short_description: "Load Hugging Face datasets directly into Qdrant collections, including precomputed embeddings, with batched uploads and streaming."
description: "Step-by-step guide to ingest Hugging Face datasets into Qdrant collections using the Python SDK, with batching and streaming for large vector workloads."
hideInSidebar: true
aliases:
  - /documentation/tutorials/huggingface-datasets/
  - /documentation/database-tutorials/huggingface-datasets/
weight: 3
goal: Data & Filtering
stack:
  - Python
  - Hugging Face
---

# Load Hugging Face Datasets into Qdrant

[Hugging Face](https://huggingface.co/) provides a platform for sharing and using ML models and
datasets. [Qdrant](https://huggingface.co/Qdrant) also publishes datasets along with the
embeddings that you can use to practice with Qdrant and build your applications based on semantic
search. **Please [let us know](https://qdrant.to/discord) if you'd like to see a specific dataset!**

Loading your own dataset changes the parts worth getting right. The Load a dataset into Qdrant prompt has an agent pick streaming, batch size, and indexing settings from your record count and shape.

{{< prompt "load-a-dataset" >}}

## arxiv-titles-instructorxl-embeddings

[This dataset](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings) contains 
embeddings generated from the paper titles only. Each vector has a payload with the title used to 
create it, along with the DOI (Digital Object Identifier).

```json
{
    "title": "Nash Social Welfare for Indivisible Items under Separable, Piecewise-Linear Concave Utilities",
    "DOI": "1612.05191"
}
```

You can find a detailed description of the dataset in the [Practice Datasets](/documentation/datasets/#journal-article-titles) 
section. If you prefer loading the dataset from a Qdrant snapshot, it also linked there.

The recommended way to load it is streaming. With `streaming=True`, `load_dataset` does not download the dataset first; records are fetched from the Hub as you iterate, so you can start ingesting within seconds and nothing is written to the local cache ahead of time. You can read more about it in the [Hugging Face documentation](https://huggingface.co/docs/datasets/stream).

```python
from datasets import load_dataset

dataset = load_dataset(
    "Qdrant/arxiv-titles-instructorxl-embeddings", split="train", streaming=True
)
```

The dataset contains 2,250,000 vectors. The streamed dataset still exposes its schema, so this is how you can check the list of the features:

```python
dataset.features
```

```text
{'id': Value('string'), 'title': Value('string'), 'DOI': Value('string'), 'vector': List(Value('float32'))}
```

### Downloading the dataset instead

If you want a local copy, for example to iterate over it several times, call `load_dataset` without `streaming=True`:

```python
from datasets import load_dataset

dataset = load_dataset("Qdrant/arxiv-titles-instructorxl-embeddings")
```

<aside role="status">A full download fetches 44 Parquet files, about 7.2 GB, and converts them into an Arrow cache on top of that, so it takes a while and needs the disk space. Streaming needs neither.</aside>

The rest of this page uses the streamed dataset. The ingestion code is the same for a downloaded one, except that a downloaded `load_dataset` call without `split` returns a dictionary of splits, so iterate over `dataset["train"]`.

### Loading the dataset into Qdrant

You can load the dataset into Qdrant using the [Python SDK](https://github.com/qdrant/qdrant-client).
The embeddings are already precomputed, so you can store them in a collection, that we're going
to create in a second:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="arxiv-titles-instructorxl-embeddings",
    vectors_config=models.VectorParams(
        size=768,
        distance=models.Distance.COSINE,
    ),
)
```

It is always a good idea to use batching, while loading a large dataset, so let's do that.
We are going to need a helper function to split the dataset into batches:

```python
from itertools import islice

def batched(iterable, n):
    iterator = iter(iterable)
    while batch := list(islice(iterator, n)):
        yield batch
```

If you are a happy user of Python 3.12+, you can use the [`batched` function from the `itertools`
](https://docs.python.org/3/library/itertools.html#itertools.batched) package instead. It yields tuples rather than lists; the upsert below accepts either.

No matter what Python version you are using, you can use the `upsert` method to load the streamed dataset,
batch by batch, into Qdrant:

```python
batch_size = 100

for batch in batched(dataset, batch_size):
    ids = [point.pop("id") for point in batch]
    vectors = [point.pop("vector") for point in batch]

    client.upsert(
        collection_name="arxiv-titles-instructorxl-embeddings",
        points=models.Batch(
            ids=ids,
            vectors=vectors,
            payloads=batch,
        ),
    )
```

Each batch is fetched from the Hub as the loop reaches it. On a laptop with `datasets` 5.1.0 and `qdrant-client` 1.20.0 against Qdrant 1.20.0, the first record arrived about 15 seconds after the `load_dataset` call, 2,000 points took 18 seconds to upsert at a batch size of 100, and the local Hugging Face cache did not grow. Expect the full 2,250,000 vectors to take hours at that rate; raise the batch size and use [parallel uploads](/documentation/manage-data/bulk-upload/) when you load everything.

To check the result, count the points and query with a vector you have just inserted:

```python
client.count(collection_name="arxiv-titles-instructorxl-embeddings")

client.query_points(
    collection_name="arxiv-titles-instructorxl-embeddings",
    query=vectors[0],
    limit=1,
)
```

The top result is the point that vector belongs to, with a score of 1.0 and `title` and `DOI` in its payload, since `id` and `vector` were popped out of the payload before the upsert.

Your collection is ready to be used for search! Please [let us know using Discord](https://qdrant.to/discord) 
if you would like to see more datasets published on Hugging Face hub.
