---
title: Filtrable
icon: data-1
weight: 30
---

Qdrant supports additional payload associated with vectors.
Qdrant not only stores payload but also allows filter results based on payload values. \
Unlike Elasticsearch k-NN search, Qdrant does not perform post-filtering, so it guarantees that all relevant vectors will be retrieved.
