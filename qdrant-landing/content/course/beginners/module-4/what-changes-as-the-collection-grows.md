---
title: "What Changes as the Collection Grows"
short_description: "Module 4 of the Beginner Course: what the indexing and storage layers need at scale."
description: "A three-article collection needs no tuning. At millions of points, the indexing and storage layers both need attention. Learn what changes and when."
weight: 4
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# What Changes as the Collection Grows

This three-article collection needs no tuning. At millions of points, both the indexing and storage layers need attention.

### Index Time Against Search Quality

Module 2 introduced `m` and `ef_construct`, which control how much work goes into building the HNSW graph. Higher values make the graph more accurate, but they also make indexing slower and use more memory. The defaults suit most collections. See [Optimize Performance](/documentation/ops-optimization/optimize/) when you have measured a gap you need to close.

### Memory Usage

Qdrant keeps every vector in memory by default, which is fast and expensive. Quantization is the lever to try first, because it cuts memory for a small loss of precision that you can measure. On-disk vectors go further and trade latency for capacity, which fits a collection much larger than the memory you want to pay for.

### Indexing Lag

Points become searchable as soon as they are stored. The HNSW graph may finish indexing them later. `get_collection` reports both numbers, and their difference is the backlog:

```python
info = client.get_collection("news")
print(info.points_count, info.indexed_vectors_count)

# Expected output:
#   3 3
```

On a collection this small, the two numbers match. For the first big upload, use the batching approach in [Bulk Upload](/documentation/manage-data/bulk-upload/), then watch both counts as it runs. If the gap keeps growing, points are arriving faster than Qdrant's optimizer can index them. See [Optimizer](/documentation/ops-optimization/optimizer/) for what to do next.
