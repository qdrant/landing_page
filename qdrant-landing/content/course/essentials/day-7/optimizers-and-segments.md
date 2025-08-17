---
title: Optimizers and Segments
weight: 3
---

{{< date >}} Day 7 {{< /date >}}

# Optimizers and Segments

The optimizer in Qdrant maintains the internal health of your collection. As data is inserted, updated, and deleted, storage can fragment and segments can grow inefficient. Optimizers merge segments, clean up deleted points, and keep indexing performant.

These settings shape insertion throughput, memory efficiency, and long‑term scalability. They don’t change single‑query latency directly, but they determine how the system behaves over time.

<img src="/documentation/guides/collection-config-guide/optimization.svg" width="800">

## Key Optimizer Settings

| Parameter                   | Default | Description                                                  | When to Adjust                                                   |
|----------------------------|---------|--------------------------------------------------------------|------------------------------------------------------------------|
| deleted_threshold          | 0.2     | Proportion of deleted points in a segment that triggers cleanup | Lower if you delete often                                        |
| vacuum_min_vector_number   | 1000    | Minimum segment size eligible for merging                    | Lower to reduce fragmentation in small datasets                  |
| default_segment_number     | 2       | Initial number of segments                                   | Raise to parallelize ingestion at startup                        |
| max_segment_size           | 50000   | Upper size of segments (KB)                                  | Raise for fewer, larger segments                                 |
| memmap_threshold           | 20000   | Switch large segments to memory‑mapped files                 | Lower on memory‑constrained systems                              |
| indexing_threshold         | 20000   | Size at which HNSW indexing is triggered                     | Raise to delay indexing during heavy writes                      |
| flush_interval_sec         | 5       | Interval to flush WAL to disk                                | Lower for durability; raise to reduce I/O                        |
| max_optimization_threads   | 0       | Threads for background optimization (0 = auto)               | Set explicitly on multi‑core systems                             |

### Example: Read‑Heavy, Update‑Frequent Workloads

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE
    ),
    optimizers_config=models.OptimizersConfigDiff(
        deleted_threshold=0.05,
        vacuum_min_vector_number=1000,
        default_segment_number=2,
        max_segment_size=75000,
        memmap_threshold=50000,
        indexing_threshold=15000,
        flush_interval_sec=3,
        max_optimization_threads=3
    )
)
```

## Segment Basics

A collection is composed of segments — independently stored and indexed units that enable Qdrant to scale and optimize incrementally.

- Many small segments can hurt recall and query performance.
- Merging segments reduces overhead and improves index locality.
- Indexing thresholds determine when HNSW is built per segment.

### Best Practices

- Ingestion‑heavy workloads: increase `default_segment_number` (e.g., 4–8) and `max_segment_size` to reduce early merges.
- High‑delete workloads: lower `deleted_threshold` and `vacuum_min_vector_number` for earlier cleanup.
- Memory constrained: lower `memmap_threshold` so very large segments are mmap’ed instead of fully in RAM.
- Bulk imports: raise `indexing_threshold` to delay indexing until segments are larger, then rebuild indexes.

Read More: [Optimizer](https://qdrant.tech/documentation/concepts/optimizer/) and [Storage](https://qdrant.tech/documentation/concepts/storage/) 