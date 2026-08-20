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

Hybrid search retrieves dense and sparse candidate lists, then fuses them into one ranking. The dense prefetch finds similar meaning; the sparse prefetch finds matching keywords. Fusion reorders the candidates the prefetches return, so a document missing from both lists cannot appear in the result.

## Confirm Fusion Beats Either Prefetch

Before tuning, compare dense retrieval, sparse retrieval, and default [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) (RRF) at `k=2` and equal weights. Score all three with `nDCG@10`, which grades the top 10 results and gives more credit to relevant documents near the top.

Qdrant defaults to `k=2`. The original RRF paper uses 60, which maps to `k=61` in Qdrant's formula. That gap is what most of this article is about.

<aside role="status">
<strong>Note:</strong> These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with <code>all-MiniLM-L6-v2</code> for dense retrieval, Qdrant's core BM25 for sparse retrieval, and 200 candidates from each prefetch. Each reported gain was evaluated with a 95% interval, and the winning configuration was rechecked on held-out queries. <a href="/articles/before-tuning-a-qdrant-collection/">Building a labeled set</a> explains the method.
</aside>

`Over the Better One` is default RRF's `nDCG@10` minus the better individual prefetch. `Second Prefetch Cost` is the median latency the second prefetch adds over the dense prefetch alone.

| Dataset | Dense Alone | Sparse Alone | Both, RRF (`k=2`) | Over the Better One | Second Prefetch Cost |
|---|---|---|---|---|---|
| SciFact | 0.6239 | 0.6886 | 0.7175 | +0.0289 | +0.73 ms |
| ArguAna | 0.4905 | 0.4224 | 0.5216 | +0.0311 | +1.47 ms |
| WANDS | 0.6921 | 0.7098 | 0.7254 | +0.0156 | +0.60 ms |
| CodeSearchNet | 0.6299 | 0.5126 | 0.6555 | +0.0256 | +0.68 ms |
| DBPedia-entity | 0.4677 | 0.3857 | 0.4638 | -0.0039 | +0.64 ms |

Fusion outscored both prefetches in four datasets, and each gain's 95% interval excludes zero. DBPedia-entity is the exception: fusion trails dense retrieval by 0.0039, and its interval crosses zero.

The second prefetch also needs a second index and a second vector per point. Keep it when it improves relevance on your own labels.

<aside role="status">
Every collection was built in one batch and queried unfiltered, so a graph shaped by continuous upserts and optimizer merges can behave differently. Latency medians come from one Qdrant container on an idle laptop, single shard, one request at a time, so re-measure under your own p95 budget, concurrency, and shard fan-out. Rebuilding SciFact and DBPedia-entity with int8 scalar quantization moved fused <code>nDCG@10</code> by at most 0.0002, and <a href="/articles/candidate-depth/">candidate depth</a> carries that measurement.
</aside>

## RRF and DBSF Use Different Signals

[Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) (RRF) uses only a candidate's position in each prefetch. A document at rank 1 scores the same whether it beat rank 2 by a wide margin or a narrow one. [Distribution-based score fusion](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf) (DBSF) puts both lists on one scale for each query, using each list's average score and how spread out its scores are. Adding the two rescaled scores carries the size of a lead into the fused ranking, and a document only one prefetch retrieved keeps that single rescaled score.

{{< figure src="/articles_data/how-to-tune-hybrid-search/fusion-signals.png" alt="Two panels of dot plots, RRF on the left and DBSF on the right. Each panel has a dense line, a sparse line, and a fused line holding documents A, B, C, and D. The RRF lines space every document evenly and label the slots 4, 3, 2, 1. The DBSF lines keep the raw score spacing on one shared axis, dense running 0.55 to 0.91 with A far out to the right and B, C, and D clustered, sparse running 12.9 to 14.8. The fused lines put B first under RRF and A first under DBSF." caption="RRF reads each document's slot, so A's dense lead flattens to one step and B, ranked near the top by both prefetches, wins. DBSF keeps the spacing on a shared axis, so A's lead survives the sum and A wins." width="100%" >}}

RRF ignores score scale, so a cosine similarity and a BM25 score combine without either dominating. DBSF assumes the size of a score gap means something, so one outlying score can move the result. Which one wins depends on your data, so run both against your labels.

## Compare RRF and DBSF on Your Labels

Use your [labeled query set](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) to compare RRF and DBSF over the same prefetches. Run RRF at `k=2` and equal weights, then run DBSF.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
)
```

Both queries read the same two candidate lists, so build the prefetches once. They must use the models the collection was indexed with.

```python
from your_embedding_setup import dense_query, sparse_query

dense_prefetch = models.Prefetch(query=dense_query, using="dense", limit=200)
sparse_prefetch = models.Prefetch(query=sparse_query, using="bm25", limit=200)
prefetches = [dense_prefetch, sparse_prefetch]
```

`RrfQuery` carries both RRF settings, `k` and the weight pair, shown here at their defaults. It requires Qdrant v1.17 or later and a compatible `qdrant-client` release.

```python
rrf_response = client.query_points(
    collection_name="products",
    prefetch=prefetches,
    query=models.RrfQuery(rrf=models.Rrf(k=2, weights=[1.0, 1.0])),
    limit=10,
)
```

The DBSF query differs only in the fusion step.

```python
dbsf_response = client.query_points(
    collection_name="products",
    prefetch=prefetches,
    query=models.FusionQuery(fusion=models.Fusion.DBSF),
    limit=10,
)
```

<aside role="status">
In a multi-shard collection, each shard applies its own prefetch <code>limit</code>. With root-level fusion, Qdrant combines those candidates across shards. A larger limit can expose more candidates to fusion, but it also adds retrieval work and candidates for a downstream reranker. Fusion nested inside a prefetch runs per shard, and DBSF rescales against the score distribution of each shard's own candidates. The <a href="/articles/candidate-depth/">candidate depth guide</a> explains how to set the limit.
</aside>

On three of these five datasets, DBSF scored higher than default RRF by a margin whose 95% interval excludes zero. SciFact's 0.0148 gain and ArguAna's 0.0045 loss both cross zero, so those two datasets are inconclusive.

| Dataset | DBSF | Over Default RRF |
|---|---|---|
| ArguAna | 0.5171 | -0.0045 |
| CodeSearchNet | 0.6716 | +0.0161 |
| SciFact | 0.7323 | +0.0148 |
| DBPedia-entity | 0.4822 | +0.0184 |
| WANDS | 0.7637 | +0.0383 |

DBSF takes no parameters: `k` and the weight pair are RRF settings, and the public API accepts them only on an `RrfQuery`. So if DBSF wins on your labels, skip the next two sections and go to the held-out check.

## Use Labels to Choose a `k` Range

Qdrant scores a document at position `pos` in one prefetch as `1 / ((pos + 1) / weight + k - 1)`, then sums across prefetches. With equal weights that reduces to `1 / (pos + k)`, and `k` alone decides how steeply the head of a list outranks its tail.

{{< figure src="/articles_data/how-to-tune-hybrid-search/rrf-k-rank-weight.png" alt="Grouped bar chart comparing the share of a retrieval prefetch's top-10 score mass at each rank, for k equal to 2 and k equal to 61. At k=2 rank 1 takes 24.8 percent and rank 10 takes 4.5 percent. At k=61 the shares are nearly flat, 10.7 percent at rank 1 and 9.3 percent at rank 10." caption="At Qdrant's default of k=2, rank 1 carries 5.50 times the score weight of rank 10. At k=61, it carries 1.15 times the weight, so a candidate's presence in a prefetch matters almost as much as its position." width="100%" >}}

Rank 1 outweighs rank 10 by 2.80 times at `k=5` and 1.45 times at `k=20`, so most of the movement sits below `k=20`. A sweep in even steps of five would spend most of its runs past the point where the curve stops moving.

Sweep `k` over 1, 2, 5, 20, and 61, changing only `k` in `models.Rrf` and keeping equal weights. Lower values favor a document one prefetch ranks highly, and higher values give more credit to documents both prefetches retrieve.

The table gives `nDCG@10` at equal weights across five values of `k`, with `k=2` as default RRF. A star marks the best `k` in each row.

| Dataset | Queries | Relevant per Query | k=1 | k=2 | k=5 | k=20 | k=61 |
|---|---|---|---|---|---|---|---|
| ArguAna | 1,401 | 1.0 | 0.517 | 0.522 | 0.530* | 0.527 | 0.521 |
| CodeSearchNet | 1,000 | 1.0 | 0.650 | 0.656 | 0.658* | 0.651 | 0.626 |
| SciFact | 300 | 1.1 | 0.712 | 0.717* | 0.715 | 0.712 | 0.707 |
| DBPedia-entity | 400 | 38.2 | 0.462 | 0.464 | 0.464 | 0.468* | 0.461 |
| WANDS | 480 | 358.9 | 0.723 | 0.725 | 0.734 | 0.757 | 0.761* |

On WANDS, `k=2` and `k=61` chose a different top result for 202 of 480 queries, while `nDCG@10` rose by 0.036. A small aggregate gain can still change what a user sees first.

These five datasets suggest a direction: with about one relevant document per query, the best `k` was 2 or 5; with tens or hundreds, it was 20 or 61. Count relevant documents per query in your labeled query set, then try that part of the range first.

If you are porting an RRF configuration from another system, remember that Qdrant uses zero-based positions. To reproduce [the `1 / (rank + 60)` convention from Cormack et al.](https://dl.acm.org/doi/10.1145/1571941.1572114) with one-based ranks, use `k=61`.

<aside role="status">
Tied scores are more common at low <code>k</code>. Averaged over SciFact's queries, 12.5% of default RRF's top 10 results share a score with the result next to them, against 2.8% at <code>k=61</code> and none under DBSF. Fusion sorts on score alone, so a tied group comes back in whatever order storage produced and the same query can return a different document at rank 10. Request more than 10 results, sort them on the client by descending score and ascending ID, then keep the first 10. If the score at rank 10 still matches the last result returned, request more.
</aside>

## Tune Weights Last

A weight pair gives one multiplier to each prefetch, in the order the prefetches appear in the query. The pair is absolute, so `(1, 2)` and `(2, 4)` are two different settings: the formula divides the position by the weight, so scaling both weights changes every score. On WANDS at `k=5`, `(1, 2)` scores 0.739 and `(2, 4)` scores 0.751.

Settle `k` first, since a pair is only valid for the `k` you tested it with. On WANDS, `(2, 4)` beats equal weights at `k=5`. At `k=61`, that dataset's best value, equal weights win: 0.7614 against 0.7567.

Then sweep a few pairs and let your labels pick the winner. A prefetch's own score does not say which way to lean. Weights act on positions inside each list, so the pair is decided by which prefetch ranks relevant documents highly on the queries the other one misses.

On DBPedia-entity, dense retrieval scores 0.4677 against sparse retrieval's 0.3857, yet the winning pair `(1, 3)` gives sparse three times the dense weight and gains 0.0060. CodeSearchNet leans the other way and gains 0.0096 at `(2, 1)`. Both intervals exclude zero.

Equal weights are a real outcome. Six pairs ran at each dataset's best `k`, and `(1, 1)` won outright on two of the five. ArguAna's best pair gained 0.0029, with an interval that crosses zero.

A weight of 0.0 keeps every document from that prefetch and scores each one 0.0. The documents stay at the bottom of the fused list instead of disappearing.

## Confirm the Selected Configuration on Held-Out Queries

A configuration can score best on the queries used to select it and still fail on held-out queries. Run both checks from [the pre-tuning article](/articles/before-tuning-a-qdrant-collection/): a bootstrap interval on per-query gain, and a split between selection and held-out queries. Ship a configuration when its interval excludes zero and its selected gain holds on the held-out half.

On SciFact's 300 queries, nothing we tried had a 95% interval that excluded zero, including DBSF's 0.0148 gain. Across 200 random splits, a selected fusion configuration kept 67% to 95% of its gain on held-out queries. Keeping the default is a real answer, and it was the right one on one of our five datasets.

## Tune in This Order

Each step is cheap enough to run in a single session.

1. Confirm fusion beats either prefetch alone.
2. Pick RRF or DBSF on your labels.
3. Set `k` from the number of relevant documents per query.
4. Sweep a few weight pairs at that `k`.
5. Validate the winner on held-out queries before shipping.

Next, if a downstream model could improve the ranking of your retrieved candidates, [test whether a reranker is worth its cost](/articles/when-a-reranker-is-worth-it/).
