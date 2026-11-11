---
label: High-performance search at scale
title: From Prototype to Billions of Vectors
description: Qdrant is a vector search engine built entirely in-house, from the search algorithms to the storage engine. It's written in Rust.
cards:
  - id: 0
    title: Grow to billions of vectors.
    description: Qdrant runs billion-scale workloads with predictable, low-latency search.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Control memory and cost.
    description: Qdrant stores vectors as 32-bit floats, so memory grows with dimensionality. Turn on quantization to shrink that footprint.
    icon:
      src: /icons/outline/disk-storage-blue.svg
      alt: ""
  - id: 2
    title: Deploy where your data lives.
    description: Start on Qdrant Cloud, or run the same engine in your own infrastructure.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
callout:
  text: 'Bazaarvoice keeps billions of vectors on Qdrant Hybrid Cloud in its own VPC: about 100x less storage than in PostgreSQL, with sub-100 ms queries at about 98% nearest-neighbor accuracy.'
  url: https://qdrant.tech/blog/case-study-bazaarvoice/
  label: Read the Bazaarvoice case study
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
