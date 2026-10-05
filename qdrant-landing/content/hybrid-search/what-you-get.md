---
label: What you get
title: Fuse Keyword and Vector Results Into One Ranked List
description: Legal, e-commerce, and enterprise retrieval teams reach for hybrid search when neither keyword search nor vector search alone surfaces the right results. Combining signals from both representations into a single ranked result is where the real retrieval gains come from.
snippet:
  lang: http
  source: 'https://qdrant.tech/documentation/search/hybrid-queries/#hybrid-search'
  label: See the full hybrid search query
  code: |
    POST /collections/{collection_name}/points/query
    {
    "prefetch": [
    {
    "query": {
    "indices": [1, 42],    // <┐
    "values": [0.22, 0.8]  // <┴─sparse vector
    },
    "using": "sparse",
    "limit": 20
    },
    {
    "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
    "using": "dense",
    "limit": 20
    }
    ],
    "query": { "rrf": {} }, // <--- reciprocal rank fusion with defaults
    "limit": 10
    }
cards:
  - id: 0
    title: Fuse queried points from each representation into a single result.
    description: When the same data has different representations, one of the most common problems is combining the queried points for each representation into a single result.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Boost results that rank near the top in both retrievers.
    description: RRF considers the positions of results within each query and boosts those that appear closer to the top in multiple sets of results.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Check which retriever is stronger for your workload.
    description: In reality, one retriever is often stronger than the other for a given workload.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
callout:
  text: 'Mixpeek used Qdrant''s native Reciprocal Rank Fusion support to streamline retriever implementations, reducing hybrid search code by 80%.'
  url: https://qdrant.tech/blog/case-study-mixpeek/
  label: Read the Mixpeek case study
sitemapExclude: true
---
