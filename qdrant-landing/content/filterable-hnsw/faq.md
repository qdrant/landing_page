---
title: FAQs
questions:
  - id: 0
    question: Does filterable HNSW only apply to dense vector search, or does it also affect sparse vector searches?
    answer: Since sparse vector search does not use the HNSW index, it is unnecessary to build extra edges in the HNSW graph for these fields.
  - id: 1
    question: When should I create payload indexes relative to ingesting data?
    answer: For the HNSW graph to be optimized for filtered search, it's highly recommended to create all payload indices immediately after collection creation, before ingesting data.
  - id: 2
    question: How does Qdrant handle filtered search when a strict filter matches only a small number of points?
    answer: In the case of low-selectivity (strict) filters, you can use the payload index and do a complete rescore.
  - id: 3
    question: What happens if a query filters on a field that has no payload index?
    answer: To block queries that filter on unindexed fields, enable strict mode and set unindexedfilteringretrieve to false.
sitemapExclude: true
---
