---
title: "Large-Scale Data Ingestion"
short_description: "Choose the right ingestion strategy for Qdrant: batched upserts, upload_points, and streaming uploads for million- and billion-scale workloads."
description: Master large-scale vector ingestion in Qdrant. Compare upsert, upload_points, and upload_collection, and learn how to stream a large dataset into a collection without loading it into memory.
weight: 4
isLesson: true
---

{{< date >}} Day 4 {{< /date >}}

# Large-Scale Data Ingestion

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/Rawvm7TP1XI"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

In vector search applications inserting a few thousand data points is straightforward but the dynamics change completely when dealing with millions or billions of records. Tiny inefficiencies in the ingestion process compound into significant time losses, increased memory pressure, and degraded search performance.

Every individual upsert call initiates a transaction that consumes memory and disk I/O to build parts of the index. At scale, this naive approach can overwhelm your system, causing upload times to spike and search quality to decrease. Efficiently preparing and loading your data into Qdrant is paramount for building a reliable and scalable AI application.

## Choosing Your Ingestion Strategy

The Qdrant client gives you three ways to get points in. The first has you managing the batching; the other two hand that to the client.

- **upsert** is the basic write operation, and the one every client library has. Send points one at a time for real-time updates, or [in batches](/documentation/manage-data/points/#upload-points) for a bulk load, which minimizes the overhead of opening a connection per point. You decide the batch size and you send the requests.

- **upload_points** takes an iterable of `models.PointStruct`, the record-oriented shape: one object per point, carrying its own id, vector, and payload.

- **upload_collection** takes `vectors`, `payload`, and `ids` as separate arguments, the column-oriented shape.

![upsert takes models.Batch or a list and you batch it yourself. upload_points is record-oriented, an iterable of PointStruct. upload_collection is column-oriented, taking vectors, payload and ids as parallel columns. All three write into the collection.](/courses/day4/choosing-an-upload-method.svg)

Those last two are the same tool in two shapes. Both add [parallelization, retries, and lazy batching](/documentation/manage-data/points/#python-client-optimizations) on top of upsert, and because both accept iterators, neither needs the whole dataset in memory. Pick whichever matches how your data already sits: the docs note the two formats are equivalent internally and offered for convenience.

> **<font color='red'>Note:</font>** You can also skip generating embeddings yourself. With [inference](/documentation/inference/), you send the text or image and the model name, and Qdrant produces the vector on upsert.

`upload_points` and `upload_collection` are helpers in the client library rather than server endpoints, so what's available depends on your language:

| Client | Bulk helper |
|---|---|
| Python | `upload_points`, `upload_collection` |
| Rust | `upsert_points_chunked(request, chunk_size)` |
| TypeScript, Go, Java, C# | Batched `upsert` calls |

> **<font color='red'>Note:</font>** The bottleneck during upload is usually the client library, not the Qdrant server. If ingestion speed is your priority, the [Rust client](https://github.com/qdrant/rust-client) is the fastest option.

## The Collection Configuration

When a collection is too large to hold in memory, each structure takes a `memory` parameter that says where it lives. `pinned` stays on the heap, `cached` is memory-mapped and pre-warmed, and `cold` is memory-mapped and read on demand.

```python
from qdrant_client import QdrantClient, models
import os

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    prefer_grpc=True,
)

client.create_collection(
    collection_name="my_collection",
    vectors_config=models.VectorParams(
        size=512,
        distance=models.Distance.COSINE,
        datatype=models.Datatype.FLOAT16,
        memory=models.Memory.COLD,
    ),
    payload=models.PayloadStorageParams(memory=models.Memory.COLD),
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(memory=models.Memory.PINNED),
    ),
    hnsw_config=models.HnswConfigDiff(memory=models.Memory.PINNED),
)
```

Two things catch people out. `pinned` is rejected for dense vectors, which support only `cached` or `cold`. And `max_segment_size` and `indexing_threshold` are both measured in kilobytes rather than points. See [Memory Tiers](/documentation/ops-configuration/memory-tiers/) for which tier suits which structure.

> **<font color='red'>Note:</font>** `memory` arrived in Qdrant v1.19. If you are following older material, it replaces `on_disk` on the vectors, `on_disk_payload` on the collection, `always_ram` in the quantization config, and `on_disk` in the HNSW config. Those still work but are deprecated, and `pinned` has no equivalent among them.

## The Upload Process

Hand the method an iterable and it takes care of the requests. Because it accepts an iterator, you can feed it a generator that reads from disk as it goes, rather than materializing the whole set first.

```python
import tqdm

client.upload_collection(
    collection_name="my_collection",
    vectors=embeddings,
    payload=payloads,
    ids=tqdm.tqdm(ids),
    batch_size=256,
    parallel=4,
)
```

A few things worth knowing about these parameters:

- **`ids`** must be unique across the whole upload. Writes are [idempotent](/documentation/manage-data/points/#idempotence), so a point sent under an id that already exists overwrites it instead of erroring. That is what you want on a retry, and what bites you if two batches reuse the same numbers.
- **`batch_size`** controls how many points go in each request. The [Bulk Upload guide](/documentation/manage-data/bulk-upload/) covers how to pick it, along with sharding and payload indexes.
- **`parallel`** starts worker processes. Each one opens its own connection, so if batches begin failing after you raise it, drop back to `1`.
- **`tqdm`** around any of the iterables gives you progress. There is no `show_progress` parameter.
- **`prefer_grpc=True`** on the client skips JSON serialization on every batch.
- **`update_mode=models.UpdateMode.INSERT_ONLY`** (v1.17) makes a resumed upload skip points already in the collection rather than rewriting them. See [Update Mode](/documentation/manage-data/points/#update-mode).
- **On Windows and macOS**, `parallel` greater than 1 needs the upload call behind a `if __name__ == "__main__":` guard in a script, because Python starts workers by re-importing your module. Without it the upload hangs instead of failing. Notebooks are unaffected.

> **<font color='red'>Best Practice:</font>** Start small and test. Before attempting to upload your entire dataset, ingest a smaller chunk to validate your configuration and process.

> **Want to try this workflow hands-on?**  
> Run the [Google Colab notebook](https://colab.research.google.com/github/qdrant/examples/blob/master/course/day_4/large_scale_ingestion.ipynb) to see large-scale vector ingestion, quantized search, and efficient RAM/disk optimization in action!

> **Want to see it at 400 million points?** The [LAION-400M benchmark](https://github.com/qdrant/laion-400m-benchmark) has the full download, processing, and upload scripts.

