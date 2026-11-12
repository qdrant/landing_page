---
label: Payload indexes
title: Index Your Metadata Next to Your Vectors
description: Qdrant combines its vector index with payload indexes on the fields you filter on, so the vector index reads payload values during the search.
cards:
  - id: 0
    title: Get filter-aware links.
    description: When Qdrant builds the HNSW graph, it adds extra edges for fields that already have payload indexes, which keeps filtered search accurate and fast.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Pick an index type per field.
    description: Index keyword, integer, float, datetime, geo, and full-text fields, with a stemmer for your language on text.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Index sparse vectors too.
    description: Sparse vectors get their own inverted index, built in the same optimization process as the dense index.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
sitemapExclude: true
---
