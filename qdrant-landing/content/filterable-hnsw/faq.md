---
title: FAQs
questions:
  - id: 0
    question: Does filterable HNSW only apply to vector search, or does it affect other query types too?
    answer: In simpler terms, a vector index speeds up vector search, and payload indexes speed up filtering.
  - id: 1
    question: If I skip quantization, does that change how the HNSW index is stored in memory?
    answer: 'High Precision + Low Memory: Store vectors and HNSW index on disk.'
  - id: 2
    question: When a filter is very tight and matches very few points, can the extra HNSW edges handle it accurately?
    answer: In some cases, the additional edges built for Qdrant's filterable HNSW may not be sufficient.
  - id: 3
    question: Does scaling nodes up or out on Managed Cloud affect the underlying indexed data?
    answer: On Managed Cloud, both horizontal and vertical scaling are supported. Indexes in each segment exist independently, and index parameters are configured at the collection level, so scaling operations work against that shared configuration.
sitemapExclude: true
---
