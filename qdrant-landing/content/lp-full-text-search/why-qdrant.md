---
label: Why Qdrant
title: Run Full Text BM25 Queries and Pass Candidates Into Hybrid Search
image:
  src: /img/lp-full-text-search/bm25-into-hybrid.png
  alt: A text query on a payload field scored by BM25 over the full-text index, the top points passed as a prefetch into dense vector search, and the hybrid results ranked.
cards:
  - id: 0
    title: Run a BM25 query against any indexed payload field.
    description: Issue a text query on the payload field you have indexed for full text search and Qdrant scores results with BM25.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Pass BM25 candidates into dense vector search as a prefetch.
    description: A text query can act as a prefetch stage, letting you feed BM25 candidates directly into a dense vector search for full hybrid search in one pipeline.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Match points whose text contains at least one query term.
    description: A point matches the query when its text contains at least one of the terms you supply.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
sitemapExclude: true
---
