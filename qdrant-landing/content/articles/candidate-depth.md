---
title: "Candidate Depth: How Much Retrieval Is Enough?"
short_description: "Raising candidate depth raises the best score a later ranking stage could reach, but default fusion barely used that extra room."
description: "Set candidate depth and hnsw_ef in Qdrant, measure the gap between your ranking and a perfect one, and balance the trade-offs."
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

Before you tune candidate depth, use the [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) to verify index state and set a labeled baseline. Everything below measures against that baseline.

Candidate depth is the number of candidates a retrieval stage passes to a later ranking stage. It matters only when a later stage can use the extra candidates. In hybrid search, every `prefetch` carries its own `limit`, and a [multi-stage query](/documentation/search/hybrid-queries/#multi-stage-queries) that nests one prefetch inside another sets a depth at each level. In dense-only or sparse-only search, it is the number of candidates you pass to a reranker or other downstream stage.

<aside role="status">
<strong>Note:</strong> The measurements in this article use five public datasets chosen to vary in corpus size, document and query shape, and relevance task, so read these depth curves as directional. They range from 5,183 to 100,000 documents, and each ran unquantized on one shard in a laptop Docker container, using <code>all-MiniLM-L6-v2</code> and Qdrant's core BM25.
</aside>

## The Short Version

1. Test `limit` at 100 and 200 for a downstream ranking stage. Treat those values as a starting point, not a production default: `limit` applies per shard, and a reranker scores every candidate.
2. Before raising [`hnsw_ef`](/documentation/search/search/#search-api), compare approximate-search recall with an exact search. If recall has plateaued, a larger value adds latency without improving recall.
3. If RAM is the constraint, test quantization before reducing candidate depth. [Quantization](/documentation/manage-data/quantization/) covers the collection settings.

## More Candidates Can Raise the Best Possible Score

Start by measuring the gap between the candidates you retrieved and the order your pipeline returns them in. Use your [labeled query set](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) to score the candidate set as if it were ordered perfectly. That is the best possible score any later ranking of those candidates could reach. Compare it with the current score from the same queries. In these hybrid measurements, the current score is fusion's `nDCG@10` over the same candidates. `nDCG@10` grades the top 10 results and gives more credit to relevant documents near the top.

Suppose a query retrieves three relevant documents, and fusion ranks them 4, 30, and 180. The current score sees only the one at rank 4, since the other two sit outside the top 10 it grades. The best possible score reorders those same candidates and puts all three at the top. No later ranking stage could do better with the candidates that were retrieved.

For hybrid search, score the union of the dense and sparse prefetches. For a single-prefetch pipeline, score the candidates passed to the downstream stage.

Each value is the change in `nDCG@10` from `limit=10` to 500.

| Dataset | Best Possible Change | Current Score Change |
|---|---|---|
| SciFact | +0.103 | +0.008 |
| ArguAna | +0.121 | +0.002 |
| WANDS | +0.124 | +0.007 |
| CodeSearchNet | +0.149 | +0.010 |
| DBPedia-entity | +0.282 | +0.003 |

{{< figure src="/articles_data/candidate-depth/depth-ceiling-vs-current.png" alt="Five line charts, one per dataset, showing nDCG at 10 as prefetch limit rises from 10 to 500. In each chart the best possible score climbs at every step while the current score stays almost flat, so the shaded gap between the two lines widens." caption="The full sweep behind the table. The best possible score climbs at every depth step on every dataset, while the score fusion returns stays almost flat." width="100%" >}}

The best possible score change rises with corpus size across these five, from 5,183 documents on SciFact to 100,000 on DBPedia-entity, while the current score change stays flat. Size and domain move together here, so re-measure the gap as your own collection grows.

With Qdrant's default [RRF](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf), the top ranks in each `prefetch` contribute far more to the fused score than the tail. Raising `limit` can add candidates without changing the top 10, or replace a more relevant result. The fused score is not always higher at greater depth: CodeSearchNet peaks at `limit=200` and is lower at 500, and DBPedia-entity peaks at 50. Other fusion methods can rank those candidates differently. [Fusion tuning](/articles/how-to-tune-hybrid-search/) shows how to test them on your labels.

Start `limit` around 100 to 200, then test larger values on your own labels. A [reranker](/articles/when-a-reranker-is-worth-it/) can use the added candidates, and a [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) can rescore those same candidates from payload fields.

Raising `limit` adds retrieval work. If a reranker follows, it also increases the number of candidates the reranker scores. In our single-shard tests, raising `limit` from 10 to 500 increased median latency by 37% to 43%. These results establish the direction, not a portable ratio. Measure the change under your own p95 budget, concurrency, and shard fan-out.

<aside role="status">
Depth is per shard. Each shard receives its own <code>limit</code> and searches its own data, so on 12 shards a <code>limit=200</code> means the collection-level stage, fusion or a downstream reranker, can receive up to 2,400 candidates. <a href="/documentation/search/hybrid-queries/#fusion-in-distributed-collections">Root-level fusion</a> runs once at collection level; only fusion nested inside a <code>prefetch</code> runs per shard.
</aside>

## Raise `hnsw_ef` Only When Recall Is Still Climbing

For dense vectors, `limit` decides how many candidates the dense stage returns, and `hnsw_ef` decides how wide the HNSW graph traversal searches for them, trading approximate-search recall for latency. Measure `limit` against your labels when a downstream stage can use more candidates, and measure `hnsw_ef` against exact search to see whether the traversal still misses neighbors.

{{< figure src="/articles_data/candidate-depth/hnsw-ef-saturation.png" alt="A wide HNSW graph with a query, an entry point, and an orange dashed path walking in. A small tinted outline marks the nodes visited at hnsw_ef 16 and a large outline marks the nodes visited at hnsw_ef 512. Four results are ringed. The node just right of the query sits outside the small outline because its only edges run to the far side of the graph, and a hollow gray ring marks the result it displaces once the wider search reaches it." caption="`hnsw_ef` widens the set of nodes the search visits, not the number of results. Here the wider walk reaches a neighbor the narrow one missed, and it displaces the weakest result." width="100%" >}}

Run the same check on your own data, with `limit` set to the value your dense-only stage or dense `prefetch` uses.

```python
import time

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
)
# Your own query vectors, embedded with the model the collection was built with.
queries = [...]
# The limit your dense-only stage or dense prefetch uses.
LIMIT = 100


def top_ids(vector, **search_params):
    return {point.id for point in client.query_points(
        collection_name="products", query=vector, using="dense",
        limit=LIMIT, search_params=models.SearchParams(**search_params),
    ).points}


# The full scan is the ground truth, and it runs once: it does not depend on hnsw_ef.
truth = [top_ids(vector, exact=True) for vector in queries]

for ef in (16, 64, 128, 256, 512):
    found = 0
    started = time.perf_counter()
    for vector, wanted in zip(queries, truth):
        found += len(top_ids(vector, hnsw_ef=ef) & wanted)
    elapsed_ms = (time.perf_counter() - started) / len(queries) * 1000
    print(ef, found / (LIMIT * len(queries)), elapsed_ms)
```

[`exact=True`](/documentation/search/search/#exact-search) runs a full scan. Both columns below come from that loop against a one-shard SciFact collection, over 50 queries, timed from the client so the network round trip sits inside the number:

| `hnsw_ef` | Recall Against Exact | Milliseconds per Query |
|---|---|---|
| 16 | 0.986 | 1.98 |
| 64 | 0.993 | 1.98 |
| 128 | 0.999 | 2.18 |
| 256 | 1.000 | 2.45 |
| 512 | 1.000 | 2.25 |

On these five datasets, raising `hnsw_ef` through 16, 64, 128, and 512 at depth 200 moved fused `nDCG@10` by at most 0.0022. Relevant-document recall in the candidate union moved by at most 0.0040. Median latency rose between 4% and 49% across the five hybrid requests at prefetch `limit=200`. When the graph is already saturated, the wider search budget is close to pure cost.

On your collection, choose the lowest `hnsw_ef` that reaches your recall target inside your latency budget. When recall is flat from the first value, keep `hnsw_ef` where it is and confirm that Qdrant has built an HNSW graph. Qdrant builds that graph after a segment passes the default `indexing_threshold`, and smaller segments use exhaustive search where `hnsw_ef` has no effect. The [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) show how to confirm the graph exists.

Saturation is a property of your own graph. These collections held at most 100,000 documents, built in one batch, unfiltered and unquantized. We ran the same check on the full 4,635,922-document DBPedia-entity collection, and it returned 0.957 of the exact top 10: about 4% of the true nearest neighbors never came back.

If `hnsw_ef` cannot reach your recall target, [`m`](/documentation/manage-data/indexing/#vector-index) increases the graph's connections and [`ef_construct`](/documentation/manage-data/indexing/#vector-index) broadens the search during graph construction. Both raise the recall the index can achieve, and changing either rebuilds the HNSW index. Filters are the other limit on what the traversal reaches: the [ACORN search algorithm](/documentation/search/search/#acorn-search-algorithm) is disabled by default, and its `enable` flag lets the search explore beyond direct graph neighbors when filters exclude them. [ACORN](/articles/filtered-vector-search-acorn/) can run about two to 10 times slower, so use it when several strict payload filters combine.

## When RAM Is the Constraint

`limit` is a query-time budget. Lowering it cuts retrieval work and the candidates a later stage receives, and it leaves the collection's disk and RAM footprint where it was. Quantization moves that footprint, so test it on your labels before lowering `limit` for memory reasons. [TurboQuant in Qdrant](/articles/turboquant-quantization/) compares the storage classes.

Int8 scalar quantization stores a compressed copy at one-quarter the size of the float32 vectors. We rebuilt SciFact and DBPedia-entity with it to measure dense top-10 agreement and the effect on the final hybrid result.

| Setting | Dense Top-10 Agreement with Unquantized | Fused `nDCG@10` Change |
|---|---|---|
| No rescoring | 0.984 | -0.0001 to +0.0000 |
| `rescore=True` | 0.997 to 1.000 | -0.0001 to +0.0000 |
| `rescore=True`, `oversampling=4` | 0.998 to 1.000 | +0.0000 to +0.0001 |

Quantization does reorder the candidate list: without rescoring, 1.6% of the dense prefetch's top 10 moves, though almost none of that reached our fused results, because the default RRF fusion used ranks. [`rescore`](/documentation/manage-data/quantization/#searching-with-quantization) rescores the shortlist with the original vectors, [`oversampling`](/documentation/manage-data/quantization/#searching-with-quantization) fetches extra compressed candidates for that step to choose from, and on SciFact rescoring recovered the unquantized top 10.

This measurement covers int8 scalar quantization on one shard at 5,000 and 100,000 documents. Binary quantization is a far more aggressive trade and we did not test it here.

Compare quantization with cutting `limit`. Dropping depth from 500 to 10 removed 27% to 30% of median latency in our runs and left the footprint where it was. Int8 quantization stored the vectors at one-quarter the size and moved fused `nDCG@10` by at most 0.0001 in either direction. Of the two, quantization is the one that shrinks what the vectors need in RAM.

Once the collection outgrows RAM, the question stops being how many candidates to fetch and becomes which structures stay resident. [Memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) measures that boundary on 4.6 million vectors and explains the placement rules.

## What to Tune Next

The gap between the best possible score and the current score tells you whether the next experiment should focus on ranking or retrieval. A large gap means relevant candidates are present but not ranked highly enough. In hybrid search, test fusion settings; in any pipeline with a downstream stage, test whether a reranker can recover the gap. A small gap means ranking is already close to the best the candidate set allows, so improve the candidates instead.

Next, if you use hybrid search, [tune fusion over the candidates you already retrieve](/articles/how-to-tune-hybrid-search/).
