---
label: Generative search engine
title: Retrieve the Right Context for Every Generated Answer
description: A generative search engine writes its answer from the results retrieval hands it. When the search returns the right passages, the LLM has what it needs to answer well. Qdrant, an open source vector search engine written in Rust, runs that retrieval step.
image:
  src: /img/lp-generative/retrieve-then-generate.png
  alt: A question goes to Qdrant, which runs dense and sparse retrieval with a filter, fuses the rankings, and passes ranked passages to the LLM for the answer.
cards:
  - id: 0
    title: Match keywords and meaning in one call.
    description: Run dense and sparse retrieval in one Query API request and fuse the two rankings with Reciprocal Rank Fusion (RRF).
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Filter on metadata during the search.
    description: Qdrant applies payload filters while it traverses the HNSW graph, so every passage already matches the user, product, or date range you scoped.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 2
    title: Rank by your business logic.
    description: Boost results by recency, document section, or any payload field with score formulas.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
