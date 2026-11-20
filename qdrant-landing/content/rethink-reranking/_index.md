---
title: 'Rethink Reranking | Qdrant'
description: Fuse, rescore, and apply business rules inside the Qdrant query, then give your reranker only the judgment calls.
keywords: [reranking, rerank search results, hybrid search, rescoring, reciprocal rank fusion]
type: marketing/rethink-reranking
build:
  render: always
cascade:
  - type: marketing/rethink-reranking
  - build:
      list: local
      publishResources: false
      render: never
---
