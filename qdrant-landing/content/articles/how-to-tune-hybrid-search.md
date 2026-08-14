---
title: "How to Tune Hybrid Search in Qdrant"
short_description: "Tune hybrid search with RRF or DBSF, choose k from relevance labels, and learn why weights are pairs instead of ratios."
description: "Tune hybrid search fusion in Qdrant: choose between RRF and DBSF, set the constant k from your relevance labels, and get weights right."
preview_dir: /articles_data/how-to-tune-hybrid-search/preview
social_preview_image: /articles_data/how-to-tune-hybrid-search/preview/social_preview.jpg
weight: -211
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - hybrid search tuning
  - reciprocal rank fusion
  - RRF k parameter
  - fusion weights
  - DBSF
category: search-quality
---

Before you tune fusion, use the [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) to verify index state and set a labeled baseline.

Hybrid search retrieves dense and sparse candidate lists, then fuses them into one ranking. The dense prefetch finds similar meaning; the sparse prefetch finds matching keywords. Fusion cannot rank a candidate neither prefetch returned.

<aside role="status">
In a multi-shard collection, each shard applies its own prefetch <code>limit</code>. With root-level fusion, Qdrant combines those candidates across shards. A larger limit can expose more candidates to fusion, but it also adds retrieval work and candidates for a downstream reranker. Fusion nested inside a prefetch runs per shard. The <a href="/articles/candidate-depth/">candidate depth guide</a> explains how to set it.
</aside>

## Confirm Fusion Beats Either Prefetch

Before tuning, compare dense retrieval, sparse retrieval, and their default RRF result with `nDCG@10`. It grades the top 10 results and gives more credit to relevant documents near the top. The last column is default RRF's `nDCG@10` minus the better individual prefetch.

These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with `all-MiniLM-L6-v2` for dense retrieval and Qdrant's core BM25 for sparse retrieval.<br>
Each reported gain was evaluated with a 95% interval. The held-out validation section explains how to use it. [Building a labeled set](/articles/before-tuning-a-qdrant-collection/) explains the method.

| Dataset | Dense alone | Sparse alone | Both, RRF (`k=2`) | Over the better one |
|---|---|---|---|---|
| SciFact | 0.6239 | 0.6886 | 0.7175 | +0.0289 |
| ArguAna | 0.4905 | 0.4224 | 0.5216 | +0.0311 |
| WANDS | 0.6921 | 0.7098 | 0.7254 | +0.0156 |
| CodeSearchNet | 0.6299 | 0.5126 | 0.6555 | +0.0256 |
| DBPedia-entity | 0.4677 | 0.3857 | 0.4638 | -0.0039 |

Fusion outscored both prefetches in four datasets. DBPedia-entity shows why this is a measurement, not an assumption: fusion trails dense retrieval by 0.0039. The differences are small, so they do not establish a gain on your dataset.

The second prefetch costs a second index, a second vector per point, and 0.6 to 1.5 ms of query time in these single-shard measurements. Keep it when it improves relevance on your own labels.

## RRF and DBSF Use Different Signals

[Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) (RRF) uses only a candidate's position in each prefetch. [Distribution-based score fusion](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf) (DBSF) normalizes each prefetch's scores using that prefetch's mean and standard deviation, then sums them. DBSF can use the size of a score lead; RRF cannot.

## Compare RRF and DBSF on Your Labels

Use your [labeled query set](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) to compare RRF and DBSF over the same prefetches.<br>
Start with RRF at `k=2` and equal weights, then run DBSF. If RRF wins, test `k` values from 2 to 61. If DBSF wins, take it forward to held-out validation. Lower values favor a document one prefetch ranks highly; higher values give more credit to documents both prefetches retrieve.

```python
import os

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key=os.environ["QDRANT_API_KEY"],
)

# Both prefetches must use the models the collection was indexed with.
from your_embedding_setup import dense_query, sparse_query

dense_prefetch = models.Prefetch(query=dense_query, using="dense", limit=200)
sparse_prefetch = models.Prefetch(query=sparse_query, using="bm25", limit=200)
prefetches = [dense_prefetch, sparse_prefetch]

rrf_response = client.query_points(
    collection_name="products",
    prefetch=prefetches,
    query=models.RrfQuery(rrf=models.Rrf(k=2, weights=[1.0, 1.0])),
    limit=10,
)

dbsf_response = client.query_points(
    collection_name="products",
    prefetch=prefetches,
    query=models.FusionQuery(fusion=models.Fusion.DBSF),
    limit=10,
)

# For an RRF variant, change k and keep the tested weight pair:
# models.Rrf(k=20, weights=[1.0, 1.0])
```

This code requires Qdrant v1.17 or later and a compatible `qdrant-client` release that exposes `models.RrfQuery`.

## Use Labels to Choose a `k` Range

The constant `k` applies to RRF only. Qdrant scores a document at position `pos` in one prefetch as `1 / ((pos + 1) / weight + k - 1)`, then sums across prefetches. With equal weights that reduces to `1 / (pos + k)`, and `k` alone decides how steeply the head of a list outranks its tail.

{{< figure src="/articles_data/how-to-tune-hybrid-search/rrf-k-rank-weight.png" alt="Grouped bar chart comparing the share of a retrieval prefetch's top-10 score mass at each rank, for k equal to 2 and k equal to 61. At k=2 rank 1 takes 24.8 percent and rank 10 takes 4.5 percent. At k=61 the shares are nearly flat, 10.7 percent at rank 1 and 9.3 percent at rank 10." caption="At Qdrant's default of k=2, rank 1 is worth 5.50x rank 10. At k=61 it is worth 1.15x, so a candidate's presence in a prefetch matters almost as much as its position." width="100%" >}}

The table gives nDCG@10 at equal weights across five values of `k`, with the best RRF cell per row in bold. The `k=2` column is default RRF, and DBSF appears beside it.

Every dataset ran the same stack: `all-MiniLM-L6-v2` for the dense prefetch, Qdrant's core BM25 for the sparse one, and 200 candidates from each.

For the DBSF column, a document retrieved by one prefetch keeps that prefetch's normalized score. A document retrieved by both carries two normalized scores.

| Dataset | Queries | Relevant per query | k=1 | k=2 | k=5 | k=20 | k=61 | DBSF |
|---|---|---|---|---|---|---|---|---|
| ArguAna | 1,401 | 1.0 | 0.517 | 0.522 | **0.530** | 0.527 | 0.521 | 0.517 |
| CodeSearchNet | 1,000 | 1.0 | 0.650 | 0.656 | **0.658** | 0.651 | 0.626 | 0.672 |
| SciFact | 300 | 1.1 | 0.712 | **0.717** | 0.715 | 0.712 | 0.707 | 0.732 |
| DBPedia-entity | 400 | 38.2 | 0.462 | 0.464 | 0.464 | **0.468** | 0.461 | 0.482 |
| WANDS | 480 | 358.9 | 0.723 | 0.725 | 0.734 | 0.757 | **0.761** | 0.764 |

On ArguAna, DBSF is 0.0045 below default RRF. That difference sits inside the dataset's measurement interval, so the result is inconclusive.

These five datasets suggest a direction: with about one relevant document per query, the best `k` was 2 or 5; with tens or hundreds, it was 20 or 61. Count relevant documents per query in your labeled query set, then try that part of the range first. This is a starting direction, not a setting to copy.

One porting note matters if you are moving an RRF configuration into Qdrant. Some other search systems use `k=60` with one-based ranks, while Qdrant defaults to `k=2` and uses zero-based positions.

Those systems score one-based ranks as `1 / (rank + constant)`, while Qdrant scores zero-based positions. Qdrant's `k` therefore equals their constant plus one at every rank. Use `k=61` to reproduce a classic `k=60`.

<aside role="status">
When RRF assigns the same score to documents at the final result limit, repeated queries can return different documents at that cutoff. Request more final results than you display, sort by descending score and ascending ID on the client, then truncate. If the last returned score still equals the score at the display cutoff, Qdrant has not returned the whole tied group.
</aside>

## Weights Are Pairs, Not Ratios

Start with equal weights. Try a different pair only when a measured result supports it: weights look like a ratio but behave as an absolute pair.<br>
Each prefetch contributes `1 / ((pos + 1) / weight + k - 1)`, so scaling both weights by the same factor changes every score and can change the final order. On WANDS at `k=5`, `(1, 2)` and `(2, 4)` share a ratio but achieve `nDCG@10` values of 0.739 and 0.751. Copy the exact pair you tested.

A weight of 0.0 keeps every document from that prefetch and scores each one 0.0. The documents stay at the bottom of the fused list instead of disappearing.

## Confirm the Selected Configuration on Held-Out Queries

A configuration can score best on the queries used to select it and still fail on held-out queries. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) provide both tests: a bootstrap interval on per-query gain, and a split between selection and held-out queries.

Both tests matter here. On SciFact's 300 queries, nothing we tried cleared its interval. DBSF gains 0.0148, but its interval runs from -0.0001 to +0.0290 and still crosses zero. Across 200 random splits, a selected fusion configuration kept 67% to 95% of its gain on held-out queries.

Use a configuration only when it clears both checks. Keeping the default because nothing cleared is a real answer, and it was the right one on one of our five datasets.

## Int8 Quantization Barely Moved Fusion Here

Every number above comes from an unquantized collection. For RRF, quantization changes fusion only when it reorders the candidate lists. For DBSF, changes to the returned scores can also change the fused result.

The effect was negligible here. Rebuilding SciFact and DBPedia-entity with int8 scalar quantization changed none of the conclusions: the best `k` stayed 2 and 20, DBSF still beat the default, and fused nDCG@10 moved by at most 0.0002. [Candidate depth](/articles/candidate-depth/) has the full measurement, including what `rescore` and `oversampling` recover.

Next, if a downstream model could improve the order of your retrieved candidates, [test whether a reranker is worth its cost](/articles/when-a-reranker-is-worth-it/).
