---
title: "Building production vector search shouldn’t be so hard."
type: marketing/elastic-lucene
description: "We asked our users building vector search why they moved to Qdrant 
from Elastic, Opensearch or another Lucene-based search engine."
url: /lp/lucene
build:
  render: always
cascade:
- type: marketing/elastic-lucene
- build:
    list: local
    publishResources: false
    render: never
---
