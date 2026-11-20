---
figure: /img/rethink-reranking/merge-engines.svg
figureAlt: 'Today two engines merge in code; in Qdrant one query fuses keyword and vector retrieval'
title: Keyword Meets Vector, and the Query Does the Merging
description: A recruiter searches "senior Rust engineer, Berlin." Keyword search knows Rust is a language, vectors know a systems programmer fits, and merge code decides who wins. Run BM25 and dense vectors as prefetches in the same query, fuse them with RRF or DBSF, and filter at each stage.
callout:
  text: 'Himalayas: moved from Algolia and Elasticsearch to hybrid search with payload filters.'
  url: https://qdrant.tech/blog/case-study-himalayas/
  label: Read the Himalayas case study
sitemapExclude: true
---
