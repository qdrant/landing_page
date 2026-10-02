---
label: What you get
title: Find the Actual Filtering Path Before You Scale to Millions of Vectors
description: Knowing which filtering path fits each query keeps search accurate as your collection grows.
snippet:
  lang: http
  source: 'https://qdrant.tech/documentation/manage-data/indexing/#filterable-hnsw-index'
  label: See the full filterable HNSW index query
  code: |
    PUT /collections/{collection_name}/index
    {
    "field_name": "name_of_the_field_to_index",
    "field_schema": {
    "type": "keyword",
    "enable_hnsw": false
    }
    }
cards:
  - id: 0
    title: Use HNSW indexes as-is for high-selectivity (weak) filters.
    description: In the case of high-selectivity (weak) filters, you can use the HNSW index as it is.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Check your metadata filtering approach for the middle cases.
    description: For filters that fall between high- and low-selectivity, the HNSW-only path does not work well on its own.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Watch for strict filters that cause the actual HNSW graph to fall apart.
    description: When filters are too strict, the HNSW graph degrades and search quality drops.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
sitemapExclude: true
---
