---
label: Fusion and reranking
title: Merge and Rerank on the Server
description: Fusion merges the two result lists into one. When fusion needs a second opinion, add a reranking stage to the same request. One request, three stages, one ranked list.
variant: visual
snippet:
  lang: python
  source: /documentation/search/hybrid-queries/#multi-stage-queries
  label: See the multi-stage query docs
  caption: Qdrant retrieves candidates with the dense and keyword prefetches, fuses them, then rescores the top candidates with a late-interaction model stored as a multivector on the same point.
  code: |
    client.query_points(
        collection_name="products",
        prefetch=models.Prefetch(
            prefetch=[dense_prefetch, bm25_prefetch],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=100,
        ),
        query=models.Document(text=query, model="colbert-ir/colbertv2.0"),
        using="colbert",
        limit=10,
    )
cards:
  - title: Two fusion methods, both on the server.
    description: Reciprocal Rank Fusion (RRF) uses each result's position, so a document near the top of both lists wins. Distribution-Based Score Fusion (DBSF) rescales each list's scores, so a strong lead in one list still counts. Tune them on your own labeled queries before you add anything heavier.
    links:
      - text: How to tune hybrid search in Qdrant
        url: /documentation/search-tuning/how-to-tune-hybrid-search/
  - title: Rerank with a late-interaction model in the same request.
    description: Qdrant rescores the fused candidates with a model such as ColBERT, stored as a multivector on the same point, with no second round trip.
  - title: Test cross-encoders against tuned fusion first.
    description: Cross-encoder rerankers run in your application on the candidates Qdrant returns. In Qdrant's published tests, most of a reranker's gain over default fusion disappeared once fusion was tuned on labeled queries.
    links:
      - text: When is a reranker worth it?
        url: /documentation/search-tuning/when-a-reranker-is-worth-it/
links:
  - text: Hybrid queries docs
    url: /documentation/search/hybrid-queries/#hybrid-search
  - text: Multi-stage queries docs
    url: /documentation/search/hybrid-queries/#multi-stage-queries
sitemapExclude: true
---
