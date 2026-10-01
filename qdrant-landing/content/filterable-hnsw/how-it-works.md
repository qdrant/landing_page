---
label: How it works
title: Enable HNSW and boolean filtering for faster filtered search
steps:
  - number: 1
    title: Enable or disable HNSW indexing per payload field, your choice.
    description: Qdrant does not decide which fields get HNSW indexing.
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 2
    title: Keep production queries from hitting unindexed fields.
    description: Qdrant provides an option to block queries that filter on unindexed fields.
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 3
    title: Enable tenant indexing to optimize storage for your content.
    description: To optimize storage further, you can enable tenant indexing for payload fields.
    icon:
      src: /icons/outline/layers-blue.svg
callout:
  text: Bayer For knowledge base collections, the global HNSW index is disabled entirely (m=0).
  url: https://qdrant.tech/blog/case-study-bayer/
button:
  text: Read the filterable HNSW docs
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
