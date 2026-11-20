---
title: 'Reranking in Vector Search: Rescore and Fuse | Qdrant'
description: Fuse, rescore, and apply business rules inside the Qdrant query, then give your reranker only the judgment calls.
keywords: [reranking, hybrid search, reranker, reciprocal rank fusion, rescoring, cross-encoder]
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
