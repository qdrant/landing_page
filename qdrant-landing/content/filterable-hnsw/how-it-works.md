---
label: How it works
title: Create Payload Indexes so Filter Detail Missing From Queries Gets Filled
steps:
  - number: 1
    title: Use dot notation to index a nested field directly.
    description: Specify a nested field for indexing using dot notation, and the filter reaches a field buried inside a document object with the payload structure intact.
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 2
    title: Create payload indexes by reshaping keys into values at collection setup.
    description: Reshape the keys into values under a fixed field and index it at collection setup.
    icon:
      src: /icons/outline/puzzle-blue.svg
  - number: 3
    title: Set strict mode to block queries on unindexed fields.
    description: Enable strict mode and set unindexed_filtering_retrieve to false to block queries that filter on unindexed fields, so higher use cases with many filter criteria route every query through an indexed path.
    icon:
      src: /icons/outline/shield-check-blue.svg
callout:
  text: Bayer used Qdrant payload indexes to build per-tenant subgraphs so one team's 50,000 documents do not slow down another team's 500.
  url: https://qdrant.tech/blog/case-study-bayer/
  label: Read the Bayer case study
button:
  text: Learn more about on-disk payload index
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
