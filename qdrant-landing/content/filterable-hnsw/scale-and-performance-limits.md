---
label: Scale and Performance Limits
title: Set metadata filter and search limits that hold at scale
cards:
  - id: 0
    title: Store vectors and HNSW index on disk to limit memory costs.
    description: Store both vectors and the HNSW index on disk to keep memory use low while retaining high-precision search. You trade some latency for a significantly smaller memory footprint, which matters when you are capturing thousands of vectors tied to metadata on parent records.
  - id: 1
    title: Scale horizontally and vertically on Managed Cloud as load grows.
    description: Horizontal and vertical scaling
  - id: 2
    title: Filter by metadata, source, or flags without a separate index.
    description: A key feature of Qdrant is the effective combination of vector and traditional indexes.
button:
  text: Read the filterable-hnsw docs →
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
