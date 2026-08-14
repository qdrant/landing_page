---
title: "Candidate Depth: How Much Retrieval Is Enough?"
short_description: "Raising candidate depth raises the best score a later ranking stage could reach, but barely moves the current score in our measurements."
description: "Set candidate depth and hnsw_ef in Qdrant, measure the gap between your ranking and a perfect one, and balance relevance, latency, and memory."
preview_dir: /articles_data/candidate-depth/preview
social_preview_image: /articles_data/candidate-depth/preview/social_preview.jpg
weight: -213
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-09T00:00:00+03:00
draft: false
keywords:
  - candidate depth
  - hnsw_ef
  - scalar quantization
  - memory tiers
  - HNSW tuning
category: search-quality
---

Before you tune candidate depth, use the [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) to verify index state and set a labeled baseline.

Candidate depth is the number of candidates a retrieval stage passes to a later ranking stage. It matters only when a later stage can use the extra candidates.<br>
In hybrid search, each prefetch has its own `limit`. In dense-only or sparse-only search, it is the number of candidates you pass to a reranker or other downstream stage.

Unless noted otherwise, these measurements use five public datasets with 5,183 to 100,000 documents. Each ran unquantized on one shard in Docker with `all-MiniLM-L6-v2`; the hybrid measurements also used Qdrant's core BM25 for sparse retrieval.<br>
Use the checks in this article to find the depth your own labels and latency budget support.

## The Short Version

1. Test [`limit`](/documentation/search/hybrid-queries/#multi-stage-queries) at 100 and 200 for a downstream ranking stage. Treat that range as a starting range, not a production default: `limit` applies per shard, and a reranker scores every candidate.
2. Before raising [`hnsw_ef`](/documentation/search/search/#search-api), compare approximate-search recall with an [exact search](/documentation/search/search/#exact-search). If recall has plateaued, a larger value adds latency without improving recall. [Measuring ANN recall](/documentation/tutorials-search-engineering/ann-recall/) shows the test.
3. If RAM is the constraint, test quantization before reducing candidate depth. [Quantization](/documentation/manage-data/quantization/) covers the collection settings, and [memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) shows the latency cost of restoring quality after the original vectors no longer fit in RAM.

## More Candidates Can Raise the Best Possible Score

Use your [labeled query set](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) to score the candidate set as if it were ordered perfectly. That is the best possible score any later ranking of those candidates could reach.<br>
Compare it with the current score from the same queries. In these hybrid measurements, the current score is fusion's `nDCG@10` over the same candidates.

For hybrid search, score the union of the dense and sparse prefetches.<br>
For a single-prefetch pipeline, score the candidates passed to the downstream stage.<br>
`nDCG@10` grades the top 10 results and gives more credit to relevant documents near the top.

Each value is the change in `nDCG@10` from `limit=10` to 500.

| Dataset | Best Possible Change | Current Score Change |
|---|---|---|
| SciFact | +0.103 | +0.008 |
| ArguAna | +0.121 | +0.002 |
| WANDS | +0.124 | +0.007 |
| CodeSearchNet | +0.149 | +0.010 |
| DBPedia-entity | +0.282 | +0.003 |

With Qdrant's default [RRF](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf), the top ranks in each `prefetch` contribute far more to the fused score than the tail. Raising `limit` can add candidates without changing the top 10, or replace a more relevant result. CodeSearchNet peaks at `limit=200` and is lower at 500; DBPedia peaks at 50.<br>
Other fusion methods can rank those candidates differently. [Fusion tuning](/articles/how-to-tune-hybrid-search/) shows how to test them on your labels.

Start `limit` around 100 to 200, then test larger values on your own labels. A [reranker](/articles/when-a-reranker-is-worth-it/) can use the added candidates, and a [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) can rescore those same candidates from payload fields.

### Depth Is Per Shard

Raising `limit` adds retrieval work. If a reranker follows, it also increases the number of candidates the reranker scores. In our single-shard tests, raising `limit` from 10 to 500 increased median latency by 37% to 43%.<br>
These results establish the direction, not a portable ratio. Measure the change under your own p95 budget, concurrency, and shard fan-out.

Each shard receives its own `limit` and searches its own data. On 12 shards, `limit=200` means the collection-level stage, fusion or a downstream reranker, can receive up to 2,400 candidates.<br>
[Root-level fusion](/documentation/search/hybrid-queries/#fusion-in-distributed-collections) runs once at collection level; only fusion nested inside a `prefetch` runs per shard.

## Raise `hnsw_ef` Only When Recall Is Still Climbing

For dense vectors, `hnsw_ef` decides how wide the HNSW graph traversal searches. It trades approximate-search recall for latency.

The results were flat on these datasets. Moving through 16, 64, 128, and 512 at depth 200 changed fused `nDCG@10` by at most 0.0022 on any of the five, and relevant-document recall in the candidate union by at most 0.0040. A dense-only nDCG@10 was just as flat, moving by at most 0.0035.<br>
On SciFact, the results at 128 and 512 are byte-identical.

These results apply to clean, unfiltered, unquantized one-shard collections built in one batch. Strict payload filters can leave filterable HNSW short of full accuracy, and this experiment did not cover graphs shaped by continuous upserts or optimizer merges.<br>
Do not assume recall has saturated in either case.

Measure approximate search against exact search on your own data instead. Set `limit` to the value used by the dense-only stage or dense `prefetch` you are testing:

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

`exact=True` runs a full scan, which is the ground truth the approximation is trying to match.<br>
Test `ef` values and plot recall against the millisecond figure. In this one-shard SciFact example, over 50 queries:

| `hnsw_ef` | Recall Against Exact | Milliseconds per Query |
|---|---|---|
| 16 | 0.986 | 1.98 |
| 64 | 0.993 | 1.98 |
| 128 | 0.999 | 2.18 |
| 256 | 1.000 | 2.45 |
| 512 | 1.000 | 2.25 |

In this SciFact example, recall starts at 0.986 and has almost nowhere to go.<br>
Across our five hybrid requests at prefetch `limit=200`, raising `hnsw_ef` from 16 to 512 added between 4% and 49% to median latency, for at most 0.0022 of fused `nDCG@10`. Here, the larger search budget is close to pure cost.

That is what a saturated graph looks like. On a collection where the recall column climbs, choose the lowest `hnsw_ef` that meets your recall target within the latency budget. If it is flat from the start, leave `hnsw_ef` alone.<br>
Test candidate depth only when a downstream stage can use more candidates.

Matching result lists do not prove a full scan. The [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) explain why and show what to inspect.

## When RAM Limits Candidate Depth

Reducing candidate depth does not make the collection smaller. It reduces query work and can leave a later ranking stage with fewer candidates.<br>
If RAM is the constraint, you may want to test quantization on your labels before lowering `limit`. The [TurboQuant quantization guide](/articles/turboquant-quantization/) compares the storage classes.

Int8 scalar quantization uses a quarter of the vector storage of float32. We rebuilt SciFact and DBPedia-entity with it to measure dense top-10 agreement and the effect on the final hybrid result.

| Setting | Dense Top-10 Agreement with Unquantized | Fused `nDCG@10` Change |
|---|---|---|
| No rescoring | 0.984 | -0.0001 to +0.0000 |
| `rescore=True` | 0.997 to 1.000 | -0.0001 to +0.0000 |
| `rescore=True`, `oversampling=4` | 0.998 to 1.000 | +0.0000 to +0.0001 |

Quantization does reorder the candidate list: without rescoring, 1.6% of the dense prefetch's top 10 moves.<br>
In our fused query, almost none of that reached the final results, because the default RRF fusion used ranks.<br>
[`rescore`](/documentation/manage-data/quantization/#searching-with-quantization) rescores the shortlist with the original vectors, [`oversampling`](/documentation/manage-data/quantization/#searching-with-quantization) fetches extra compressed candidates for it to choose from, and on SciFact rescoring recovered the unquantized top 10.

That is int8 scalar quantization on one shard at 5,000 and 100,000 documents. Binary quantization is a far more aggressive trade and we did not test it here.

**Once the collection outgrows RAM**, the question changes from how many candidates to fetch to which structures stay resident and what recovering the lost quality costs on the query path. [Memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) measures that boundary on 4.6 million vectors and explains the placement rules.

## Settings for Specific Cases

If `hnsw_ef` cannot reach your recall target, [`m`](/documentation/manage-data/indexing/#vector-index) increases the graph's connections and [`ef_construct`](/documentation/manage-data/indexing/#vector-index) broadens the search during graph construction. Both can raise the approximate-search recall the index can achieve, but changing either rebuilds the HNSW index.

The [ACORN search algorithm](/documentation/search/search/#acorn-search-algorithm) is disabled by default; set its `enable` flag before it can explore beyond direct graph neighbors when filters exclude them. It can run about two to 10 times slower, so use it when several strict payload filters combine.

On a multi-tenant collection, mark the tenant field's keyword index with [`is_tenant=true`](/documentation/manage-data/multitenancy/#partition-by-payload) so Qdrant groups each tenant's vectors for efficient filtered search.

For scalar quantization, [`quantile`](/documentation/manage-data/quantization/#accuracy-tuning) sets the quantization bounds. A value below `1.0` excludes extreme vector components, preserving more precision for typical values while clipping those extremes. Test it when outliers may be hurting quantization quality. It changes precision, not memory use.

These settings solve different, specific constraints; they are not general-purpose tuning knobs.

## What to Tune Next

Across the five hybrid measurements, more depth raised the best possible score far more than the current score under default RRF. That gap tells you whether the next experiment should focus on ranking or retrieval.<br>
A large gap means relevant candidates are present but not ranked highly enough. In hybrid search, test fusion settings; in any pipeline with a downstream stage, test whether a reranker can recover the gap.<br>
A small gap means ranking is already close to the best the candidate set allows, so improve the candidates instead.

Next, if you use hybrid search, [tune fusion over the candidates you already retrieve](/articles/how-to-tune-hybrid-search/).
