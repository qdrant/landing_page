---
title: "Fast Approximate Search: HNSW"
short_description: "Module 2 of the Beginner Course: the graph index that keeps large-scale vector search fast."
description: "Learn how the HNSW graph index makes search over millions of vectors fast, and what recall you trade for that speed."
weight: 6
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# Fast Approximate Search: HNSW

Searching millions of vectors by computing similarity against every single one (brute force) is slow. Qdrant uses HNSW (Hierarchical Navigable Small World), a graph-based approximate nearest neighbor (ANN) index that makes large-scale search fast at a small, measurable recall cost.

![HNSW search enters the sparse top layer, hops toward the query, and drops through denser layers to the nearest neighbor.](/courses/beginners/module-2/hnsw.png)

### How HNSW Works

- **Graph structure**: Each vector is a node. Nodes are connected to their nearest neighbors by bidirectional edges, forming a navigable graph.
- **Hierarchical layers**: The graph has multiple layers. The top layer has few nodes and long-range connections. Lower layers are denser with short-range connections.
- **Search by traversal**: Query entry starts at the top layer. The search "jumps" through neighbors, zooming in on the region of interest at each layer.
- **Approximate, not exact**: HNSW trades some recall (see below) for massive speed gains. Whether that trade-off is worth it depends on your data and queries, so measure recall on queries representative of your actual workload rather than assuming it.

### Tunable Parameters

HNSW exposes three tunable parameters: `m`, `ef_construct`, and `hnsw_ef`. They balance search speed, recall (the fraction of true nearest neighbors found), memory usage, and indexing time.

Defaults work well for most use cases, so tune them only after benchmarking a real recall or latency gap. This course won't cover tuning in detail; see the [Qdrant Essentials Course](/course/essentials/day-2/what-is-hnsw/) when you're ready.

Real-world queries often combine similarity with metadata filters. Qdrant applies these filters during HNSW traversal instead of searching the full graph and filtering afterward. See [Filterable HNSW](/articles/filterable-hnsw/) for details. [Payload Filtering](/course/beginners/module-2/payload-filtering/) covers filtering next.
