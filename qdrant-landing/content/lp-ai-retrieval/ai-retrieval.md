---
label: AI retrieval
title: Better Answers Start With Better Retrieval
description: To turn a promising RAG demo into reliable answers, start with retrieval. When the search returns the right chunks, the LLM has what it needs to answer well. Qdrant gives the retrieval step of your RAG pipeline architecture the controls to get context right.
cards:
  - id: 0
    title: Filter on metadata during the search.
    description: Qdrant applies payload filters while it traverses the HNSW graph, so every result already matches the user, product, or date range you scoped. Create a payload index on each field you filter on to keep filtered search fast.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Match keywords and meaning in one call.
    description: Run dense and sparse retrieval in one Query API request and fuse the two rankings with Reciprocal Rank Fusion (RRF).
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Rank by your business logic.
    description: Boost results by recency, document section, or any payload field with score formulas.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
callout:
  text: 'Lucy reaches 94.7% Recall@10 on FinanceBench with retrieval on Qdrant.'
  url: https://qdrant.tech/blog/case-study-lucy/
  label: Read the Lucy case study
button:
  text: Start free with Qdrant Cloud
  url: https://cloud.qdrant.io/signup
sitemapExclude: true
---
