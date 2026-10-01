---
label: Filter Execution Strategy
title: Control boolean, distance, and candidates for filtered queries
cards:
  - id: 0
    title: Get predictable results across boolean, distance, and candidate-count scenarios.
    description: Understanding how Qdrant selects and ranks candidates under different filter conditions lets you tune for the accuracy and efficiency your workload needs.
  - id: 1
    title: Set strict mode to block queries on unindexed fields.
    description: Enable strict mode and set unindexed_filtering_retrieve to false, and Qdrant blocks any query that tries to filter on a field with no payload index.
  - id: 2
    title: Build a payload index per field and type for fast boolean filtering.
    description: This index is built for a specific field and type, and is used for quick point requests by the corresponding filtering condition.
  - id: 3
    title: Run post filtering iterations to close in on the target distance.
    description: After multiple iterations of post filtering, Qdrant can quickly approach the target position in the candidate set.
  - id: 4
    title: Compare accuracy and efficiency against public benchmarks.
    description: Second, it is one of the most accurate and fastest algorithms, according to public benchmarks.
button:
  text: Read the filterable-hnsw docs →
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
