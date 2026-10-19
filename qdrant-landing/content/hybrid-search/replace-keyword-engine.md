---
label: Elasticsearch and OpenSearch
title: Replace the Keyword Engine, or Run Both
description: Many teams arrive with Elasticsearch or OpenSearch for keywords and a separate vector store for embeddings. Every query becomes two round trips, a merge step in application code, and two systems to scale, secure, and keep in sync. Here is what changes when you move hybrid search to Qdrant.
variant: grid
cards:
  - title: One collection.
    description: It holds the text index, the BM25 sparse vectors, and the dense vectors.
    icon:
      src: /icons/outline/layers-blue.svg
  - title: One request.
    description: It replaces two calls plus merge code.
    icon:
      src: /icons/outline/code-xml-blue.svg
  - title: One system.
    description: Size, back up, and secure one deployment.
    icon:
      src: /icons/outline/server-rack-blue.svg
  - title: One pipeline to tune.
    description: Filters, grouping, and reranking apply to the merged result.
    icon:
      src: /icons/outline/switches-blue.svg
notes:
  - "What Qdrant's full-text search covers today: tokenization, lowercasing, ASCII folding, stemming, stopword removal, multilingual tokenization, phrase matching, and BM25 ranking with IDF computed per shard at query time."
  - "Where a Lucene-based engine still has more: fuzzy matching. If your queries depend on it, keep the keyword engine for those queries and route hybrid queries to Qdrant. Run both until your labeled queries show Qdrant covers the rest."
  - 'How to test the move: load a sample of your corpus with both vector types, replay your top queries against both systems, and compare the ranked results on labeled queries. <a href="/documentation/search-tuning/before-tuning-a-qdrant-collection/">What to Check Before Tuning a Qdrant Collection</a> walks through the setup.'
links:
  - text: Migrate from Elasticsearch
    url: /documentation/migrate-to-qdrant/from-elasticsearch/
  - text: Migrate from OpenSearch
    url: /documentation/migrate-to-qdrant/from-opensearch/
  - text: Full-text search docs
    url: /documentation/search/text-search/full-text-search/
sitemapExclude: true
---
