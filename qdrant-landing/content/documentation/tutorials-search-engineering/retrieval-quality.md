---
title: Measuring ANN Precision
aliases:
  - /documentation/tutorials/retrieval-quality/
  - /documentation/beginner-tutorials/retrieval-quality/
weight: 6
---

# Measuring ANN Precision

| Time: 15 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial measures **layer 1** of the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#connecting-the-levels-in-practice" target="_blank">evaluation ladder</a>, **ANN precision**: the share of Qdrant's approximate nearest-neighbor top-k that appears in the exact kNN top-k. For retrieval relevance (layer 2), see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-golden-set/" target="_blank">Building a Golden Query Set</a> tutorial.

We'll measure Qdrant's ANN precision with `precision@k` and tune HNSW parameters to control the precision/latency trade-off. The ANN algorithm is one of several levers that shape retrieval quality in a production pipeline, alongside the embedding model, retrieval strategy (dense, sparse, hybrid, and multi-vector), filtering, and reranking.

## ANN Precision

Embedding quality sets the ceiling on search quality and is measured separately via benchmarks like [MTEB](https://huggingface.co/spaces/mteb/leaderboard). The retrieval pipeline can still underperform that ceiling: vector search engines such as Qdrant don't run pure kNN at query time but use **approximate nearest-neighbor** (ANN) algorithms for speed. ANN is faster than exact search but can return suboptimal results. **ANN precision** measures that gap.

For a broader discussion of the full evaluation ladder (ANN quality, retrieval relevance, business impact), see [Retrieval Quality Fundamentals](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/). This tutorial measures the ANN layer with `precision@k`: the fraction of ANN's top-k results that appear in the exact kNN top-k. In ANN-benchmarks terminology this is equivalent to `recall@k`, since both searches return exactly `k` items.

## Measure ANN Precision with the Web UI

Qdrant's Web UI has a Search Quality tab that measures the gap between approximate and exact search without requiring evaluation code. Open the dashboard at `http://localhost:6333/dashboard` (or your cluster's dashboard on Qdrant Cloud), navigate to your collection, and click the Search Quality tab. A run launches automatically with a default sample size of 10 queries, comparing ANN against exact kNN.

<!-- SCREENSHOT 1: Search Quality tab with the default run results visible (sample size 10, ANN vs kNN). Filename: search-quality-tab.png -->
![Search Quality tab with default evaluation results](/documentation/tutorials/retrieval-quality/search-quality-tab.png)

The tab reports average **precision@k**. The score is typically high but not always perfect. When you need higher precision and can accept higher latency or more memory, HNSW is tunable.

## Tweaking the HNSW Parameters

HNSW is a hierarchical graph where each node has a set of links to other nodes. The `m` parameter controls the number of edges per node: higher `m` means higher precision at the cost of more memory. The `ef_construct` parameter controls how many neighbours are considered during index building: higher `ef_construct` means higher precision at the cost of longer indexing time. Defaults are `m=16` and `ef_construct=100`.

For the full list of HNSW parameters, including on-disk storage and precision/memory trade-offs, see [Optimize Performance](/documentation/ops-optimization/optimize/).

Toggle **advanced mode** in the Search Quality tab to tune these parameters inline. Raise `m` to 32 and `ef_construct` to 200, then run the evaluation again.

<!-- SCREENSHOT 2: Advanced mode panel with HNSW parameter inputs (m, ef_construct) visible. Filename: search-quality-advanced.png -->
![Search Quality advanced mode with HNSW parameters](/documentation/tutorials/retrieval-quality/search-quality-advanced.png)

Precision should increase at the cost of higher build time and memory.

<!-- SCREENSHOT 3: Results view after m=32 / ef_construct=200, showing higher precision than the first run. Filename: search-quality-after-tuning.png -->
![Search Quality results after HNSW tuning](/documentation/tutorials/retrieval-quality/search-quality-after-tuning.png)

Tune until you hit the point that matches your quality and cost targets.

## Automate in CI with Python

The Web UI is the fastest way to check precision interactively. For continuous integration or scripted regression tests, the Qdrant client exposes the same exact-search mode via `search_params=models.SearchParams(exact=True)`. Compare the ANN and exact top-k sets yourself and compute precision@k.

The helper below takes a list of query vectors and returns the average precision@k. Supply your own test set: a representative sample of query vectors from your workload, held out from training.

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

Drop it into your CI pipeline and fail the job if precision drops below a threshold after an embedding model change or index config update.

## Wrapping Up

Measuring ANN precision keeps HNSW tuning honest. The Search Quality tab gives you a quick interactive read; the Python helper above plugs into CI to catch regressions after embedding model changes or index config updates.

HNSW covers most workloads well and is tunable when you need higher precision. Other ANN algorithms exist, such as [IVF*](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes#cell-probe-methods-indexivf-indexes), but they generally [perform worse than HNSW on quality and performance](https://nirantk.com/writing/pgvector-vs-qdrant/#correctness).
