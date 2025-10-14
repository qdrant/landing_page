---
title: The Universal Query API
weight: 2
---

{{< date >}} Day 5 {{< /date >}}

# The Universal Query API

Picture this: a customer types "leather jackets" into your store's search bar. You want to show items that match the style semantically - so a bomber jacket surfaces even if it doesn't mention "leather jackets" verbatim - but you also need to enforce your business rules. Only products under $200, only items in stock, only jackets released within the past year. Traditionally, you'd fire off a search, gather results, then apply filters and glue code. With Qdrant's [Universal Query API](/documentation/concepts/hybrid-queries/), all of that happens in one declarative request.

## Run dense + sparse retrieval in parallel with RRF

First, you retrieve candidates from multiple sources in parallel and fuse their ranks. Below, we blend dense semantics from a BGE model with sparse keyword matching from SPLADE by using [Reciprocal Rank Fusion](/documentation/concepts/hybrid-queries/#hybrid-search) to merge the two lists:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)

response = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(
            query=dense_vector,
            using="dense_bge",
            limit=20
        ),
        models.Prefetch(
            query=sparse_vector,
            using="sparse_splade",
            limit=20
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10
)
```

Qdrant sends both prefetches concurrently, fuses the two ranked lists by reciprocal rank, and returns your top ten products that satisfy both semantic and keyword relevance.

## Dense Retrieval + ColBERT Rerank

Next, imagine you want to rerank a larger candidate set with a more precise model. You retrieve 100 items quickly with your dense field, then apply your ColBERT multivector to rescore those hundred and pick the very best ten:

```python
response = client.query_points(
    collection_name="articles",
    prefetch=[
        models.Prefetch(
            query=dense_query_vector,
            using="bge-dense",
            limit=100
        )
    ],
    query=colbert_query_multivector,
    using="colbert",
    limit=10
)
```

Behind the scenes Qdrant fetches the 100 nearest points from the dense index, then for each document applies the MaxSim late-interaction score from your ColBERT subvectors, returning the ten highest-scoring results.

## Global and Prefetch-Specific Filters

Finally, you layer in filtering wherever it makes sense. In the snippet below, you specify global filters at the query level - price under $200 and release date after January 1, 2023 - which automatically propagate to all prefetches. Then, you add an additional prefetch-specific filter on the dense search to only retrieve products that are in stock and in the "jackets" category:

```python
response = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(
            query=dense_query_vector,
            using="bge-dense",
            limit=100,
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="in_stock",
                        match=models.MatchValue(value=True)
                    ),
                    models.FieldCondition(
                        key="category",
                        match=models.MatchValue(value="jackets")
                    )
                ]
            )
        ),
        models.Prefetch(
            query=sparse_query_vector,
            using="sparse-splade",
            limit=100
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    filter=models.Filter(
        must=[
            models.FieldCondition(
                key="price",
                range=models.Range(lt=200.0)
            ),
            models.FieldCondition(
                key="release_date",
                range=models.DatetimeRange(
                    gte="2023-01-01T00:00:00Z"
                )
            )
        ]
    ),
    limit=10
)
```

The global filters (price and release_date) apply to both prefetches automatically. The first prefetch adds extra constraints (in_stock and category), while the second prefetch only uses the global filters. This eliminates the need to repeat common filters across every prefetch. All filtering happens efficiently during the retrieval phase - there's no separate post-processing step. The entire pipeline - hybrid retrieval, filtering, fusion, and reranking - executes in one API call.

## The Universal Query API Structure

The Universal Query API enables complex search patterns through a simple declarative interface:

- **Prefetch Stage**: Execute multiple searches in parallel against different vector fields. Each prefetch can have its own filters, limits, and vector types used.
- **Fusion Stage**: Combine results from multiple prefetches using algorithms like Reciprocal Rank Fusion (RRF) or Distribution-Based Score Fusion (DBSF).
- **Reranking Stage**: Or rerank candidates from a single prefetch with a stronger scorer such as ColBERT. Fusion and reranking are alternative final steps in most pipelines.
- **Filtering**: Apply filters globally at the query level (propagated to all prefetches) or add prefetch-specific filters for additional constraints on individual searches.

This architecture eliminates the need for multiple API calls, client-side result merging, and complex orchestration code. Everything happens server-side in a single, optimized request.

## Next

In our next lesson, you'll bring these building blocks together in a personalized recommendation pipeline. You'll learn how to retrieve candidate from three different vector representations, fuse their signals, rerank with ColBERT, apply user-segment filters, and deliver highly relevant suggestions without writing a single line of glue code.