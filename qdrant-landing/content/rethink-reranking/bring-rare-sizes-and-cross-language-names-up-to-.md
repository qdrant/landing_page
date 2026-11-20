---
figure: /img/rethink-reranking/representations.svg
figureAlt: 'Today each vector is queried and merged in code; in Qdrant named vectors feed one rescoring query'
title: Bring Rare Sizes and Cross-Language Names Up to Page One
description: A marketplace wants rare sizes on page one. An analyst types a company's German name and expects the English record. Store each representation as a named vector, prefetch each one filtered and unfiltered, then rescore with a stronger vector or a multivector. For the analyst, BM25 scores each trading name in a list, and Qdrant ranks the record by its best match.
callout:
  text: 'Tripadvisor: represents each traveler as a set of vectors, across over a billion reviews and contributions.'
  url: https://qdrant.tech/blog/case-study-tripadvisor/
  label: Read the Tripadvisor case study
sitemapExclude: true
---
