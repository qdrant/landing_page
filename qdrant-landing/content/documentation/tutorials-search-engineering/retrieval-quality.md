---
title: Measuring ANN Precision
aliases:
  - /documentation/tutorials/retrieval-quality/
  - /documentation/beginner-tutorials/retrieval-quality/
weight: 5
---

# Measuring ANN Precision

| Time: 15 min | Level: Beginner |  |    |
|--------------|---------------------|--|----|

This tutorial focuses on **ANN precision**: how closely approximate nearest-neighbor (ANN) search matches exact kNN search.
To measure ANN precision, you compare Qdrant's approximate top-k against the exact kNN top-k using `precision@k`, then tune HNSW parameters to trade memory and build time for higher precision.

To learn more about retrieval quality evaluation, see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#the-evaluation-ladder" target="_blank">evaluation ladder</a>.

## Measure ANN Precision with the Web UI

Qdrant's Web UI has a Search Quality tab that measures the gap between approximate and exact search without requiring evaluation code. Open the dashboard at `http://localhost:6333/dashboard` (or your cluster's dashboard on Qdrant Cloud), navigate to your collection, open the Search Quality tab, and click **Check Index Quality** to run the comparison.

![Search Quality tab with default evaluation results](/documentation/tutorials/retrieval-quality/search-quality-tab.png)

The tab reports average **precision@k** (1.0 = perfect overlap; 0.95+ is typical for well-tuned HNSW). HNSW has tunable parameters that trade memory and index build time for higher precision.

## Tuning the HNSW Parameters

HNSW is a hierarchical graph where each node has a set of links to other nodes. The `m` parameter controls the number of edges per node: higher `m` means higher precision at the cost of more memory. The `ef_construct` parameter controls how many neighbors are considered during index building: higher `ef_construct` means higher precision at the cost of longer indexing time. Defaults are `m=16` and `ef_construct=100`.

For the full list of HNSW parameters, including on-disk storage and precision/memory trade-offs, see [Optimize Performance](/documentation/ops-optimization/optimize/).

Toggle **advanced mode** in the Search Quality tab to tune these parameters inline. Raise `m` to 32 and `ef_construct` to 200, then run the evaluation again.

![Search Quality advanced mode with HNSW parameters](/documentation/tutorials/retrieval-quality/search-quality-advanced.png)

Precision should increase at the cost of higher build time and memory.

![Search Quality results after HNSW tuning](/documentation/tutorials/retrieval-quality/search-quality-after-tuning.png)

Tune until you hit the point that matches your quality and cost targets.

## Automate in CI with Python

The Web UI is the fastest way to check precision interactively. For continuous integration or scripted regression tests, the Qdrant client exposes the same exact-search mode via `search_params=models.SearchParams(exact=True)`. Compare the ANN and exact top-k sets yourself and compute precision@k.

This helper takes a list of query vectors and returns the average precision@k. Use a representative sample of query vectors from your workload as your test set.

```python
from qdrant_client import QdrantClient, models


def avg_precision_at_k(
    client: QdrantClient,
    collection_name: str,
    test_vectors: list,
    k: int,
) -> float:
    precisions = []
    for vector in test_vectors:
        ann_ids = {
            p.id for p in client.query_points(
                collection_name=collection_name,
                query=vector,
                limit=k,
            ).points
        }
        knn_ids = {
            p.id for p in client.query_points(
                collection_name=collection_name,
                query=vector,
                limit=k,
                search_params=models.SearchParams(exact=True),
            ).points
        }
        precisions.append(len(ann_ids & knn_ids) / k)

    return sum(precisions) / len(precisions)
```

Wire it into CI and fail the job when precision falls below your target threshold. This catches regressions from embedding model swaps or index config changes before they reach production.

## Wrapping Up

Measuring ANN precision keeps HNSW tuning honest. The Search Quality tab gives you a quick interactive read; the Python helper plugs into CI to catch regressions after embedding model changes or index config updates.

Once ANN precision is on target, the next layer is whether the retrieved results are relevant to users. See [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/).