---
title: 'Tune HNSW Performance Across Every Filter Strength | Qdrant'
description: 'Qdrant keeps HNSW performance benchmarking honest across the full selectivity range: weak filters run straight through the index, strict filters get a dedicated filtered graph, and strict mode blocks queries on unindexed fields before they degrade results.'
build:
  render: always
cascade:
  - build:
      list: local
      publishResources: false
      render: never
---
