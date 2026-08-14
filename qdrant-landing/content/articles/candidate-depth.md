---
title: "Candidate Depth: How Much Retrieval Is Enough?"
short_description: "Raising candidate depth raises the best score a later ranker could reach, but barely moves the current score. Learn how to set the trade-offs."
description: "Set candidate depth and hnsw_ef in Qdrant, measure the gap between the best possible and current score, and trade memory with quantization and on-disk storage."
preview_dir: /articles_data/candidate-depth/preview
social_preview_image: /articles_data/candidate-depth/preview/social_preview.jpg
weight: -212
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

Retrieval tuning stops being only about relevance as soon as the collection has to fit somewhere real. Latency, memory, disk, and build time all meet at the same controls: how many candidates you retrieve, how hard the index works to find them, and what the collection costs to keep in RAM.

Candidate depth is the number of results each retrieval step passes to the next stage. It looks like the cleanest quality knob: fetch more candidates, give ranking more to work with, and the score should rise.

It does not behave that way. More depth mostly raises the best score a better ranker could reach later. The current ranking barely moves.

The measurements come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25, on a single shard in Docker on a laptop. Index behavior changes with scale, so use the checks in this article to find your own numbers.

## The Short Version

1. Start each prefetch `limit` at 100 or 200. That range gave a later ranking stage useful choice here, and depth multiplies across shards and reranker candidates, so treat it as the start of a sweep rather than a production default.
2. Measure approximate-search recall against an exact search before raising `hnsw_ef`. If recall has already plateaued, a larger value only adds latency. [Measuring ANN recall](/documentation/tutorials-search-engineering/ann-recall/) provides a guided version of that test.
3. When RAM is the constraint, test quantization before reducing candidate depth. [Quantization](/documentation/manage-data/quantization/) shows the collection settings, and [memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) prices what keeping the quality costs once the originals no longer fit.

The sections that follow explain the trade-offs and the measurements behind that order.

## More Candidates Create Opportunity, Not Better Ranking

Score the union of your two candidate lists as if it were ordered perfectly. That gives the best nDCG@10 any ranking of those candidates could reach. nDCG@10 grades the top 10 results, giving more credit to relevant documents near the top; [choosing a metric](/articles/before-tuning-a-qdrant-collection/#choose-a-metric-before-you-tune) covers when it is the right one. Raising the prefetch `limit` raises that best-possible score a long way.

| Corpus | Best Possible at 10 | Best Possible at 500 | Current Score at 10 | Current Score at 500 |
|---|---|---|---|---|
| SciFact | 0.890 | 0.993 | 0.709 | 0.717 |
| ArguAna | 0.878 | 0.999 | 0.521 | 0.523 |
| WANDS | 0.859 | 0.983 | 0.720 | 0.727 |
| CodeSearchNet | 0.813 | 0.962 | 0.645 | 0.655 |
| DBPedia-entity | 0.688 | 0.970 | 0.460 | 0.463 |

Fifty times the candidates moved the best-possible score by 0.10 to 0.28. The score a reader would see moved by 0.002 to 0.010.

The gap between the best-possible and current score widens at every step on every corpus. On DBPedia it opens from 0.229 at depth 10 to 0.507 at depth 500.

Depth is not even monotonic on the current score. CodeSearchNet's best fusion setting peaks at `limit=100` and is lower at 500, and DBPedia's peaks at 200. Past a point, extra candidates compete for ten seats against documents that already deserved them.

Start `limit` around 100 to 200, because candidates have to exist before anything can rank them, and sweep from there on your own labels. Then stop expecting the score to follow. You are creating opportunity for a later ranking stage. [A reranker](/articles/when-a-reranker-is-worth-it/) is one option. A [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query), which rescores the same candidates using payload fields such as recency or popularity, is another.

Depth costs less latency than a model call, which is the one argument for setting it generously. Measured as a reader would issue it, one fused `query_points` per request, going from `limit=10` to `limit=500` cost between 40% and 45% more median time: 2.14 ms to 3.06 ms on SciFact, 2.77 ms to 3.94 ms on DBPedia-entity. Those are single-shard figures on one machine with no concurrent load. Against a tight p95 budget, under concurrent load, or fanned out across shards, 45% is a real number, so take the shape and measure the magnitude yourself.

**Depth is per shard.** A shard receives its own `limit` and runs the full prefetch against its own data, so on twelve shards a `limit` of 200 means each shard returns up to 200 candidates and collection-level fusion sees up to 2,400. The root-level fusion itself runs once, at collection level; only a fusion nested inside a prefetch runs per shard. Both matter when you are reading a latency profile and wondering why depth cost more than you budgeted.

## Raise `hnsw_ef` Only When Recall Is Still Climbing

`hnsw_ef` decides how wide the HNSW graph traversal searches. It is a pure exchange, recall for latency, with no memory cost.

On these corpora it does nothing. Sweeping 16, 64, 128, and 512 at depth 200 moved the fused score by at most 0.0022 on any of the five, and union recall by at most 0.0040. On SciFact the results at 128 and 512 are byte-identical.

Do not read that as a null result. It is a statement about collections of 5,000 to 100,000 documents on one shard, where graph recall saturates almost immediately.

Once the graph stops saturating, `hnsw_ef` becomes your primary recall-against-latency knob. Point count is one input to that, and the shape of your vectors, the filters in the query, and how hard the queries are each move the same line, so no collection size tells you which side of it you are on. The check below does, by measuring approximate search against exact search on your own data:

```python
import time

from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")
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

Recall starts at 0.986 and has nowhere to go. On a fused query at prefetch `limit` 200, raising `hnsw_ef` from 16 to 512 cost between 4% and 49% of median latency across the five corpora, for at most 0.0022 of nDCG@10.

At this scale, it is close to pure cost.

That is what a saturated graph looks like. On a collection where the recall column climbs, the knee is your setting. If it is flat from the start, spend the latency on breadth instead.

Read the recall column here rather than inferring index state from two result lists that match. [The pre-tuning audit](/articles/before-tuning-a-qdrant-collection/) covers why equal lists prove nothing and what to read instead.

## When RAM Is the Constraint

Above a certain size, the binding constraint stops being relevance and starts being what fits in RAM. Candidate depth looks like the easy saving, and the sections above priced it: depth buys latency at 40% to 45% between 10 and 500, and cutting it removes the opportunity a later ranking stage needs. Test quantization first.

**Quantization** stores each vector in fewer bits, and int8 scalar quantization is a quarter the size of float32. We rebuilt SciFact and DBPedia-entity with it to measure what the saving costs downstream.

| Setting | Dense top-10 agreement with unquantized | Fused nDCG@10 change |
|---|---|---|
| No rescoring | 0.984 | -0.0001 to +0.0000 |
| `rescore=True` | 0.997 to 1.000 | -0.0001 to +0.0000 |
| `rescore=True`, `oversampling=4` | 0.998 to 1.000 | +0.0000 to +0.0001 |

Quantization does reorder the candidate list: without rescoring, 1.6% of the dense prefetch's top 10 moves. Almost none of that reaches the fused result, because fusion reads ranks. `rescore` re-scores the shortlist with the original vectors, `oversampling` fetches extra compressed candidates for it to choose from, and on SciFact rescoring recovered the exact unquantized ordering. [The quantization guide](/documentation/manage-data/quantization/#searching-with-quantization) explains the controls.

That is int8 scalar quantization on one shard at 5,000 and 100,000 documents. Binary quantization is a far more aggressive trade and we did not test it here.

**Once the collection outgrows RAM**, the question changes from how many candidates to fetch to which structures stay resident and what recovering the lost quality costs on the query path. [Memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) measures that boundary on 4.6 million vectors and carries the placement rules.

The remaining index knobs each wait for a specific condition. `m` and `ef_construct` need a rebuild, and Qdrant's defaults of 16 and 100 are reasonable. The [ACORN search algorithm](/documentation/search/search/#acorn-search-algorithm) matters once several strict filters combine on a filtered collection. The quantization `quantile` is a refinement after quantization is already on. Reach for each one when its condition arrives.

## Use the Gap to Find the Bottleneck

One number links these trade-offs: the difference between what your candidate set could score if perfectly ordered and what it does score. On these corpora that gap ran from 0.14 to 0.51 and grew every time we fetched more candidates.

You can measure it on your own collection with a [labeled set](/articles/before-tuning-a-qdrant-collection/). Take the union of your two prefetch results, score it as if perfectly ordered, and compare against what you ship.

A large gap means the documents are already there and your ranking stage is what is leaving them at rank 40. Fusion and depth tuning move that gap very little, as measured here. A small gap means your ranking is close to the best this candidate set allows, and more quality has to come from better candidates, which means the embedding model or a third prefetch.

The gap was large on all five corpora here, from 0.14 to 0.51. [Reranking](/articles/when-a-reranker-is-worth-it/) is the stage that closes it, and it carries a price of its own.
