---
title: "Candidate Depth: How Much Retrieval Is Enough?"
short_description: "Raising candidate depth raises the best score a later ranking stage could reach, but barely moves the current score in our measurements."
description: "Set candidate depth and hnsw_ef in Qdrant, measure the gap between your ranking and a perfect one, and balance relevance, latency, and memory."
preview_dir: /articles_data/candidate-depth/preview
social_preview_image: /articles_data/candidate-depth/preview/social_preview.jpg
weight: -213
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - candidate depth
  - hnsw_ef
  - scalar quantization
  - memory tiers
  - HNSW tuning
category: search-quality
---

When a collection has to operate within real latency, memory, disk, and build-time budgets, retrieval tuning is no longer only about relevance. The same controls determine how many candidates retrieval returns, how hard the index works to find them, and what the collection costs to keep in RAM.

Candidate depth is the number of candidates a retrieval stage passes to a later ranking stage. It matters only when a later stage can use the extra candidates. In hybrid search, each prefetch has its own `limit`. In dense-only or sparse-only search, it is the number of candidates you pass to a reranker or other downstream stage.

In our hybrid measurements, more depth mostly raised the best score a better ranker could reach later. The current fused ranking barely moved.

The measurements come from five public datasets of 5,183 to 100,000 documents. We used `all-MiniLM-L6-v2` for dense retrieval and Qdrant's core BM25 for sparse retrieval, on a single shard in Docker on a laptop. Index behavior changes with scale, so use the checks in this article to find your own numbers.

## The Short Version

1. Start the `limit` for a downstream ranking stage at 100 or 200. That range gave a later ranking stage useful choice here, and depth multiplies across shards and reranker candidates, so treat it as the start of a sweep rather than a production default.
2. Measure approximate-search recall against an exact search before raising `hnsw_ef`. If recall has already plateaued, a larger value only adds latency. [Measuring ANN recall](/documentation/tutorials-search-engineering/ann-recall/) provides a guided version of that test.
3. When RAM is the constraint, test quantization before reducing candidate depth. [Quantization](/documentation/manage-data/quantization/) shows the collection settings, and [memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) prices what keeping the quality costs once the originals no longer fit.

## More Candidates Raise the Best Possible Score

Score the candidate set as if it were ordered perfectly. That is the best `nDCG@10` any later ranking of those candidates could reach. In hybrid search, the candidate set is the union of the dense and sparse prefetches. In a single-prefetch pipeline, it is the candidates passed to the downstream stage. `nDCG@10` grades the top 10 results and gives more credit to relevant documents near the top; [choosing a metric](/articles/before-tuning-a-qdrant-collection/#choose-a-metric-before-you-tune) covers when to use it.

| Dataset | Best Possible at 10 | Best Possible at 500 | Current Score at 10 | Current Score at 500 |
|---|---|---|---|---|
| SciFact | 0.890 | 0.993 | 0.709 | 0.717 |
| ArguAna | 0.878 | 0.999 | 0.521 | 0.523 |
| WANDS | 0.859 | 0.983 | 0.720 | 0.727 |
| CodeSearchNet | 0.813 | 0.962 | 0.645 | 0.655 |
| DBPedia-entity | 0.688 | 0.970 | 0.460 | 0.463 |

In our hybrid measurements, 50 times the candidates moved the best-possible score by 0.10 to 0.28. The current score moved by 0.002 to 0.010.

The gap between the best-possible and current score widens at every step on every dataset. On DBPedia-entity, it opens from 0.229 at depth 10 to 0.507 at depth 500.

Depth is not even monotonic on the current score. CodeSearchNet's best fusion setting peaks at `limit=100` and is lower at 500, and DBPedia's peaks at 200. Past a point, extra candidates compete for ten seats against documents that already deserved them.

Start `limit` around 100 to 200 and sweep from there on your own labels. Candidates have to exist before another stage can rank them, but the current score may not follow. [A reranker](/articles/when-a-reranker-is-worth-it/) can use that extra choice. A [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) can rescore the same candidates using payload fields such as recency or popularity.

Depth has a lower per-candidate cost than a model call, but it is not free. In one fused `query_points` request, going from `limit=10` to `limit=500` added 40% to 45% to the median: 2.14 ms to 3.06 ms on SciFact, and 2.77 ms to 3.94 ms on DBPedia-entity.

Those are single-shard figures on one machine with no concurrent load. Under a tight p95 budget, concurrent load, or shard fan-out, 45% is material. Take the shape and measure the magnitude yourself.

**Depth is per shard.** Each shard receives its own `limit` and searches its own data. In hybrid search, on 12 shards a `limit` of 200 means collection-level fusion sees up to 2,400 candidates. Root-level fusion runs once at collection level; only a fusion nested inside a prefetch runs per shard. Both matter when you are reading a latency profile and wondering why depth cost more than you budgeted.

## Raise `hnsw_ef` Only When Recall Is Still Climbing

For dense vectors, `hnsw_ef` decides how wide the HNSW graph traversal searches. It trades approximate-search recall for latency, with no memory cost.

The sweep was flat on these datasets. Moving through 16, 64, 128, and 512 at depth 200 changed the fused score by at most 0.0022 on any of the five, and candidate recall by at most 0.0040. On SciFact, the results at 128 and 512 are byte-identical.

That result describes collections of 5,000 to 100,000 documents on one shard, where graph recall saturates almost immediately.

When approximate-search recall has not saturated, `hnsw_ef` is a recall-against-latency knob. Point count is only one input. Vector distribution, filters, and query difficulty also move the saturation point, so no collection size tells you which side you are on.

Measure approximate search against exact search on your own data instead:

```python
import os
import time

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key=os.environ["QDRANT_API_KEY"],
)
# Your own query vectors, embedded with the model the collection was built with.
queries = [...]


def exact_top(queries, limit=100):
    """Ground truth, computed once: a full scan does not depend on hnsw_ef."""
    return [
        {point.id for point in client.query_points(
            collection_name="products", query=vector, using="dense",
            limit=limit, search_params=models.SearchParams(exact=True),
        ).points}
        for vector in queries
    ]


def recall_at(ef, queries, truth, limit=100):
    """Share of the exact top-`limit` an approximate search at this hnsw_ef returns."""
    found, elapsed = 0.0, 0.0
    for vector, wanted in zip(queries, truth):
        started = time.perf_counter()
        approx = client.query_points(
            collection_name="products", query=vector, using="dense",
            limit=limit, search_params=models.SearchParams(hnsw_ef=ef, exact=False),
        ).points
        elapsed += time.perf_counter() - started
        found += len({point.id for point in approx} & wanted) / limit
    return found / len(queries), elapsed / len(queries) * 1000


truth = exact_top(queries)
for ef in (16, 64, 128, 256, 512):
    print(ef, recall_at(ef, queries, truth))
```

`exact=True` runs a full scan, which is the ground truth the approximation is trying to match. Sweep `ef` and plot recall against the millisecond figure. On SciFact's 5,183 documents, over 50 queries:

| `hnsw_ef` | Recall against exact | Milliseconds per query |
|---|---|---|
| 16 | 0.986 | 1.98 |
| 64 | 0.993 | 1.98 |
| 128 | 0.999 | 2.18 |
| 256 | 1.000 | 2.45 |
| 512 | 1.000 | 2.25 |

Recall starts at 0.986 and has almost nowhere to go. In our fused query at prefetch `limit` 200, raising `hnsw_ef` from 16 to 512 added between 4% and 49% to median latency across the five datasets, for at most 0.0022 of `nDCG@10`. Here, the larger search budget is close to pure cost.

That is what a saturated graph looks like. On a collection where the recall column climbs, the knee is your setting. If it is flat from the start, do not spend more latency on `hnsw_ef`.

Read the recall column here rather than inferring index state from two result lists that match. [The pre-tuning audit](/articles/before-tuning-a-qdrant-collection/) covers why equal lists prove nothing and what to read instead.

## When RAM Is the Constraint

Once RAM becomes the binding constraint, reducing candidate depth looks like an easy saving. What it saves is latency: the sections above priced depth at 40% to 45% between depths 10 and 500. Cutting it also removes the candidates a later ranking stage needs. Test quantization first.

**Quantization** stores each vector in fewer bits, and int8 scalar quantization is a quarter the size of float32. We rebuilt SciFact and DBPedia-entity with it to measure what the saving costs downstream.

| Setting | Dense top-10 agreement with unquantized | Fused nDCG@10 change |
|---|---|---|
| No rescoring | 0.984 | -0.0001 to +0.0000 |
| `rescore=True` | 0.997 to 1.000 | -0.0001 to +0.0000 |
| `rescore=True`, `oversampling=4` | 0.998 to 1.000 | +0.0000 to +0.0001 |

Quantization does reorder the candidate list: without rescoring, 1.6% of the dense prefetch's top 10 moves. In our fused query, almost none of that reached the final results, because fusion used ranks. `rescore` re-scores the shortlist with the original vectors, `oversampling` fetches extra compressed candidates for it to choose from, and on SciFact rescoring recovered the exact unquantized ordering. [The quantization guide](/documentation/manage-data/quantization/#searching-with-quantization) explains the controls.

That is int8 scalar quantization on one shard at 5,000 and 100,000 documents. Binary quantization is a far more aggressive trade and we did not test it here.

**Once the collection outgrows RAM**, the question changes from how many candidates to fetch to which structures stay resident and what recovering the lost quality costs on the query path. [Memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) measures that boundary on 4.6 million vectors and carries the placement rules.

The remaining index knobs each wait for a specific condition. `m` and `ef_construct` require a rebuild, so consider them only when candidate recall remains below target and a rebuild is acceptable. The [ACORN search algorithm](/documentation/search/search/#acorn-search-algorithm) is off until you enable it; consider it when several strict filters combine on a filtered collection. The quantization `quantile` is a refinement after quantization is already on. Reach for each one when its condition arrives.

## Use the Gap to Find the Bottleneck

One number links these trade-offs: the difference between what your candidate set could score if perfectly ordered and what it does score. On these datasets that gap ran from 0.14 to 0.51 and grew every time we fetched more candidates.

You can measure it on your own collection with a [labeled set](/articles/before-tuning-a-qdrant-collection/). In hybrid search, take the union of the two prefetch results. In a single-prefetch pipeline, use the candidates passed to the downstream stage. Score that set as if perfectly ordered, then compare it with what you ship.

A large gap means the documents are already present and the ranking stage is leaving them at rank 40. Fusion and depth tuning moved that gap very little here. A small gap means the ranking is close to the best this candidate set allows, so the next gain needs better candidates from the embedding model or another prefetch.

The gap was large on all five datasets. [Reranking](/articles/when-a-reranker-is-worth-it/) tests whether another ranking stage can collect it, and what that stage costs.
