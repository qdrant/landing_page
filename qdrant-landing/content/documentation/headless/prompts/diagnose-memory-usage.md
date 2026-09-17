---
title: "Diagnose high memory usage"
skills:
  - qdrant-performance-optimization/memory-usage-optimization
page: /documentation/ops-optimization/optimize/
---
My Qdrant memory usage is higher than I expected, or a node was killed for running out of memory. Read https://skills.qdrant.tech/qdrant-performance-optimization/memory-usage-optimization/SKILL.md first, then ask me for my collection configuration before proposing anything. Tell me which component is actually consuming the memory, whether that is the vectors, the HNSW index, or the payload indexes, and give me the fixes in order of impact. Say which ones need a reindex, and what recall I would lose if I quantize.
