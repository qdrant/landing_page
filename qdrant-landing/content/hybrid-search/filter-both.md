---
label: Filtered hybrid search
title: Filter Both Searches in One Query
description: Most production queries carry a hard constraint. Stock and price in a catalog. A tenant ID in a multi-tenant app. A license or network in healthcare. Hybrid search in Qdrant applies that constraint to the keyword search and the semantic search before fusion merges them, so every result in the ranked list already passes the filter.
variant: visual
snippet:
  lang: python
  source: /documentation/search/hybrid-queries/#hybrid-search
  label: See the full hybrid search query
  caption: On Qdrant Cloud, Cloud Inference computes both vectors from the query text. Self-hosted, install <code>qdrant-client[fastembed]</code> and the client computes them locally.
  code: |
    from qdrant_client import models

    in_stock_under_150 = models.Filter(
        must=[
            models.FieldCondition(key="in_stock", match=models.MatchValue(value=True)),
            models.FieldCondition(key="price", range=models.Range(lte=150)),
            models.FieldCondition(key="title", match=models.MatchPhrase(phrase="pegasus 40")),
        ]
    )
    query = "nike pegasus 40 running shoes"

    client.query_points(
        collection_name="products",
        prefetch=[
            models.Prefetch(  # semantic search
                query=models.Document(
                    text=query, model="sentence-transformers/all-minilm-l6-v2"
                ),
                using="dense",
                filter=in_stock_under_150,
            ),
            models.Prefetch(  # keyword search
                query=models.Document(text=query, model="Qdrant/bm25"),
                using="bm25",
                filter=in_stock_under_150,
            ),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),  # merge
        limit=10,
    )
cards:
  - title: Tight filters keep recall high.
    description: Qdrant evaluates filters during HNSW graph traversal, so a tight filter keeps recall high instead of emptying the candidate list.
    links:
      - text: How filterable HNSW works
        url: /filterable-hnsw/
  - title: Full-text conditions work the same way.
    description: Require an exact phrase or term as a filter while BM25 and dense vectors rank what's left. Text indices support stemming, stopwords, multilingual tokenization, and phrase matching.
  - title: Create a payload index on every field you filter on.
    description: Qdrant Cloud strict mode rejects filters on unindexed fields.
links:
  - text: Filtering docs
    url: /documentation/search/filtering/
  - text: Full-text filtering docs
    url: /documentation/search/text-search/text-filtering/
  - text: Payload index docs
    url: /documentation/manage-data/indexing/#payload-index
sitemapExclude: true
---
