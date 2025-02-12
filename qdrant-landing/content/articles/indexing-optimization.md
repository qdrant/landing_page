---
title: "Optimizing Memory for Bulk Uploads"  
short_description: "Best practices to optimize memory usage during high-volume vector ingestion in Qdrant, ensuring stable and efficient deployments."  
description: "Efficient memory management is key when handling large-scale vector data. Learn how to optimize memory consumption during bulk uploads in Qdrant and keep your deployments performant under heavy load."  
preview_dir: /articles_data/indexing-optimization/preview-4
social_preview_image: /articles_data/indexing-optimization/social-preview.png  
weight: -155
author: Sabrina Aquino  
date: 2025-02-12T00:00:00.000Z  
category: vector-search-manuals
---

# Optimizing Memory Consumption During Bulk Uploads

Efficient memory management is a constant challenge when you’re dealing with **large-scale vector data**. In high-volume ingestion scenarios, even seemingly minor configuration choices can significantly impact stability and performance.

Let’s take a look at the best practices and recommendations to help you optimize memory usage during bulk uploads in Qdrant. We'll cover scenarios with both **dense** and **sparse** vectors, helping your deployments remain performant even under high load and avoiding out-of-memory errors.

---

### Indexing for dense vs. sparse vectors

**Dense vectors**  

Qdrant employs an **HNSW-based index** for fast similarity search on dense vectors. By default, HNSW is built or updated once the number of **unindexed** vectors in a segment exceeds a set `indexing_threshold`. Although it delivers excellent query speed, building or updating the HNSW graph can be **memory-intensive** if it occurs frequently or across many small segments.

**Sparse vectors**

Sparse vectors use an **inverted index**. This index is updated at the **time of upsertion**, meaning you cannot disable or postpone it for sparse vectors. In most cases, its overhead is smaller than that of building an HNSW graph, but you should still be aware that each upsert triggers a sparse index update.


### Disabling vs. deferring dense indexing

**`indexing_threshold=0`** 
 
Disables HNSW index creation for dense vectors. Qdrant will not build the HNSW graph for those vectors, letting you upload large volumes of data without incurring the memory cost of index creation.

**`indexing_threshold>0`**  

A positive threshold tells Qdrant how many unindexed dense vectors can accumulate in a segment before building the HNSW graph. Small thresholds (e.g., 100) mean more frequent indexing with less data each time, which can still be costly if many segments exist. Larger thresholds (e.g., 10000) delay indexing to batch more vectors at once, potentially using more RAM at the moment of index build, but fewer builds overall. 

```json
PATCH /collections/your_collection
{
  "optimizer_config": {
    "indexing_threshold": 10000
  }
}
```

<aside role="status">Sparse vectors are always indexed on upsert, regardless of the threshold.</aside>

---

### The `"m"` parameter

For dense vectors, the `m` parameter defines how many edges each node in the HNSW graph can have. Setting `"m": 0` effectively **disables the HNSW graph**, so no dense vector index will be built, no matter the `indexing_threshold`. This can be helpful during massive ingestion if you don’t need immediate searchability.

---

## On-Disk Indexing in Qdrant

By default, Qdrant keeps **vectors and indexes** in **memory** to ensure low-latency queries. However, in large-scale or memory-constrained scenarios, you can configure some or all of those indexes to be stored on-disk. This helps reduce RAM usage at the cost of potential increases in query latency, particularly for cold reads.

**When to use on-disk indexing**:
- You have **very large** or **rarely used** payload indexes, and freeing up RAM is worth potential I/O overhead.  
- Your dataset doesn’t fit comfortably in available memory.  
- You can tolerate slower queries if it ensures the system remains stable under heavy loads.

---


## Memmap storage and segmentation

Qdrant uses **memory-mapped files** (segments) to store data on-disk. Rather than loading all vectors into RAM, Qdrant maps each segment into its address space, paging data in and out on demand. This helps keep the active RAM footprint lower, but each segment still incurs overhead (metadata, page table entries, etc.).

During **high-volume ingestion**, you can accumulate dozens of small segments. Qdrant’s **optimizer** can later merge these into fewer, larger segments, reducing per-segment overhead and lowering total memory usage.

When you create a collection with `"on_disk": true`, Qdrant will store newly inserted vectors in memmap storage from the start. For example:

```json
PATCH /collections/your_collection
{
    "vectors": {
      "on_disk": true
    }
}
```

This approach immediately places all incoming vectors on disk. You can configure a threshold so that small segments are kept in RAM, but large segments automatically move to memmap storage once they exceed that threshold. This is controlled by the `memmap_threshold` in the collection’s `optimizers_config`.

```json
PATCH /collections/your_collection
{
    "optimizers_config": {
        "memmap_threshold": 20000
    }
}
```

If you want both dense and sparse vectors to be stored on disk, you need to enable `on_disk` for each type separately.

For dense vectors, set `on_disk: true` inside `hnsw_config`.

```json
PATCH /collections/your_collection
{
    "hnsw_config": {
        "on_disk": true
    }
}
```

For sparse vectors, configure `on_disk` inside the `index` section of each sparse vector field.

```json
PATCH /collections/your_collection
{
    "sparse_vectors": {
        "text": {
            "index": {
                "on_disk": false
            }
        }
    }
}
```

---

## Best practices for high-volume vector ingestion


Bulk ingestion can lead to high memory consumption and even out-of-memory (OOM) errors. **If you’re experiencing out-of-memory errors with your current setup**, scaling up temporarily (increasing available RAM) will provide a buffer while you adjust Qdrant’s configuration for more a efficient data ingestion. 

The key here is to control indexing overhead. Let’s walk through the best practices for high-volume vector ingestion in a constrained-memory environment.

**1. Disable HNSW for dense vectors (`m=0`)**

During an **initial bulk load**, you can **disable** dense indexing by setting `"m"=0`. This ensures Qdrant won’t build an HNSW graph for incoming vectors.

Keep `indexing_threshold=10000` (or another large number) so that when you re-enable HNSW, you won’t trigger immediate, frequent index builds. This avoids memory spikes from HNSW building as data arrives, but leaves you the option to enable indexing later by setting `m` to a positive value.

```json
PATCH /collections/your_collection
{
  "hnsw_config": {
    "m": 0
  },
  "optimizer_config": {
    "indexing_threshold": 10000
  }
}
```

<aside role="status">If your collection already contains a large number of vectors, changing these parameters will trigger a full index reconstruction, potentially causing downtime or performance degradation.</aside>


**2. Wait for indexation to clear up memory**

Allow Qdrant to finish any ongoing indexing before doing more operations. Large indexing jobs can keep memory usage high until they fully complete. Watch Qdrant logs or metrics to confirm when indexing finishes. Once that happens, memory consumption should drop as intermediate data structures are freed.


**3. Re-enable HNSW post-ingestion**

After the ingestion phase is over and memory usage has stabilized, re-enable HNSW for dense vectors by setting `m` back to a production value (commonly `16` or `32`):

```json
PATCH /collections/your_collection
{
  "hnsw_config": {
    "m": 16
  }
}
```


**4. Enable quantization**

If you had planned to store all dense vectors on disk, be aware that searches can slow down drastically due to frequent disk I/O. A more balanced approach is **scalar quantization**: compress vectors (e.g., to `int8`) so they fit in RAM without occupying as much space as full floating-point values.

```json
PATCH /collections/your_collection
{
  "quantization_config": {
    "scalar": {
      "type": "int8",
      "always_ram": true
    }
  }
}
```
Quantized vectors remain **in-memory** yet consume less space, preserving much of the performance advantage of RAM-based search. Learn more about [vector quantization](https://qdrant.tech/articles/what-is-vector-quantization/).

### Conclusion

High-volume vector ingestion can place significant memory demands on Qdrant, especially if dense vectors are indexed in real time. By following these tips, you can substantially reduce the risk of out-of-memory errors and maintain stable performance in a memory-limited environment.

As always, monitor your system’s behavior. Review logs, watch metrics, and keep an eye on memory usage. Each workload is different, so it’s wise to fine-tune Qdrant’s parameters (e.g., `indexing_threshold`, `m`) according to your hardware and data scale.