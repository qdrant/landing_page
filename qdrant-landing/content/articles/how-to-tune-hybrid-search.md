---
title: "How to Tune Hybrid Search in Qdrant"
short_description: "Tune hybrid search with RRF or DBSF, choose k from relevance labels, and learn why weights are pairs instead of ratios."
description: "Tune hybrid search fusion in Qdrant: choose between RRF and DBSF, set the constant k from your relevance labels, and get weights right."
preview_dir: /articles_data/how-to-tune-hybrid-search/preview
social_preview_image: /articles_data/how-to-tune-hybrid-search/preview/social_preview.jpg
weight: -210
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-13T00:00:00+03:00
draft: false
keywords:
  - hybrid search tuning
  - reciprocal rank fusion
  - RRF k parameter
  - fusion weights
  - DBSF
category: search-quality
---

Hybrid search gives you two lists and one ranking. A dense prefetch finds similar meaning; a sparse prefetch finds matching terms such as identifiers, SKUs, and error codes. Fusion combines them.

When the ranking looks plausible but not quite right, fusion is the cheapest place to look. It is arithmetic over two lists you already paid to retrieve: no rebuild, no extra latency, no second model.

There are three knobs: the fusion method, RRF's `k`, and the weights. The numbers come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25, unquantized on a single shard. Every gain carries a 95% interval from resampling per-query differences, and [building a labeled set](/articles/before-tuning-a-qdrant-collection/) has the method.

Fusion can only rank what the two prefetches retrieved. [Candidate depth](/articles/candidate-depth/) decides that. Start the prefetch `limit` at 100 or 200 before tuning fusion.

That `limit` is per shard. Each shard runs the prefetch against its own data and returns up to `limit` candidates, so on twelve shards a `limit` of 200 gives the root-level fusion up to 2,400 documents to merge. The root-level fusion itself runs once, at collection level; only a fusion nested inside a prefetch runs per shard.

## Start With This Sweep

If you have a labeled query set, try these settings in order:

1. Compare the RRF default with [DBSF](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf).
2. If RRF wins, sweep `k` around 2 for queries with one clear answer, and around 20 to 61 when many documents can be relevant.
3. Keep equal weights unless a measured difference supports a specific pair of weights.
4. Confirm the winner on fresh queries. [Measuring retrieval relevance](/documentation/improve-search/retrieval-relevance/) explains how to build the evaluation set.

This is a small experiment with no rebuild and no new model call.

## What Each Fusion Setting Changes

**The fusion method** decides how the two ranked lists become one. [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) (RRF) reads only each document's position in a list. [Distribution-based score fusion](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf) (DBSF) normalizes each prefetch's scores against its own mean and standard deviation, then sums them. In other words, DBSF can use the size of a score lead, while RRF cannot.

**The constant `k`** applies to RRF only. Qdrant scores a document at position `pos` in one prefetch as `1 / ((pos + 1) / weight + k - 1)`, then sums across prefetches. With equal weights that reduces to `1 / (pos + k)`, and `k` alone decides how steeply the head of a list outranks its tail.

{{< figure src="/articles_data/how-to-tune-hybrid-search/rrf-k-rank-weight.png" alt="Grouped bar chart comparing the share of a retrieval prefetch's top-10 score mass at each rank, for k equal to 2 and k equal to 61. At k=2 rank 1 takes 24.8 percent and rank 10 takes 4.5 percent. At k=61 the shares are nearly flat, 10.7 percent at rank 1 and 9.3 percent at rank 10." caption="At Qdrant's default of k=2, rank 1 is worth 5.50x rank 10. At k=61 it is worth 1.15x, and the prefetch contributes little more than a membership vote." width="100%" >}}

Low `k` rewards a document that one prefetch ranked first. High `k` flattens the curve until appearing in both lists matters more than either one's top rank.

**A weight per prefetch** stretches or compresses that prefetch's positions. Both `k` and the weights live in `models.Rrf`. The plain `models.FusionQuery(fusion=models.Fusion.RRF)` form takes no parameters, so anything you want to tune goes through `RrfQuery`:

```python
from qdrant_client import models

# Both prefetches must use the models the collection was indexed with.
from your_embedding_setup import dense_query, sparse_query

dense_prefetch = models.Prefetch(query=dense_query, using="dense", limit=200)
sparse_prefetch = models.Prefetch(query=sparse_query, using="bm25", limit=200)

response = client.query_points(
    collection_name="products",
    prefetch=[dense_prefetch, sparse_prefetch],
    query=models.RrfQuery(rrf=models.Rrf(k=61, weights=[1.0, 1.0])),
    limit=10,
)
```

Those two named prefetches carry through every example below.

## Test DBSF Before Tuning RRF

RRF is the right default, and it is Qdrant's, because it works when the two prefetches produce scores on incompatible scales. DBSF is one line to try.

It was the better choice more often than not here: across five corpora it beat the RRF default on four, and on three of those the gain was large enough to survive a change of query sample.

```python
query=models.FusionQuery(fusion=models.Fusion.DBSF)
```

A document retrieved by only one prefetch keeps that prefetch's normalized score under DBSF. The prefetch that missed it adds nothing. The document therefore competes with one score against documents carrying the sum of two, which is why DBSF favors agreement.

Its one loss was on ArguAna, 0.0045 below the default. That difference sits inside the corpus's measurement interval, so the result is inconclusive.

## Relevant Documents Per Query Point `k` in the Right Direction

The table gives nDCG@10 at equal weights across five values of `k`, with the best RRF cell per row in bold and DBSF alongside. nDCG@10 grades the top 10 results and gives more credit to relevant documents near the top; [choosing a metric](/articles/before-tuning-a-qdrant-collection/#choose-a-metric-before-you-tune) covers when to use it.

Every corpus ran the same stack: `all-MiniLM-L6-v2` for the dense prefetch, Qdrant's core BM25 for the sparse one, and 200 candidates from each.

| Corpus | Queries | Relevant per query | k=1 | k=2 | k=5 | k=20 | k=61 | DBSF |
|---|---|---|---|---|---|---|---|---|
| ArguAna | 1,401 | 1.0 | 0.517 | 0.522 | **0.530** | 0.527 | 0.521 | 0.517 |
| CodeSearchNet | 1,000 | 1.0 | 0.650 | 0.656 | **0.658** | 0.651 | 0.626 | 0.672 |
| SciFact | 300 | 1.1 | 0.712 | **0.717** | 0.715 | 0.712 | 0.707 | 0.732 |
| DBPedia-entity | 400 | 38.2 | 0.462 | 0.464 | 0.464 | **0.468** | 0.461 | 0.482 |
| WANDS | 480 | 358.9 | 0.723 | 0.725 | 0.734 | 0.757 | **0.761** | 0.764 |

The best `k` is different on every corpus, and it tracks how many documents are relevant per query.

Where about one document per query is relevant, the winner sits at 2 or 5. The prefetch that found that document first should carry it.

Where tens or hundreds are relevant, the winner climbs to 20 or 61. Agreement between the two beats either one's top result.

So count the relevant documents per query in your labeled set and sweep in that direction first. Five corpora do not make a rule, and this is a starting direction rather than a setting to copy.

One porting note matters if you are moving a configuration into Qdrant. Qdrant defaults to 2; the 2009 paper that introduced RRF used 60, and [Elasticsearch defaults `rank_constant` to 60](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion).

Those systems score one-based ranks as `1 / (rank + constant)`, while Qdrant scores zero-based positions. Qdrant's `k` therefore equals their constant plus one at every rank. Use `k=61` to reproduce a classic `k=60`.

## Inspect Which Prefetch Produced Each Result

Take the top 10 for a handful of queries and label each result by which prefetch found it: dense only, sparse only, or both. On SciFact under the default, both found 79% of all top-10 results and 97% of the relevant ones. This shows the agreement effect in your own results before you run a broad sweep.

The WANDS query "entrance table" shows that inspection on one query. The two ends of the `k` range disagree on the top result for 202 of the 480 WANDS queries. This is one of them.

| Setting | Top result | Dense rank | Sparse rank | Label |
|---|---|---|---|---|
| k=2 | "puzzle table" | 1 | not retrieved | Irrelevant |
| k=2, tied | "console table sofa table for entryway with drawers" | not retrieved | 1 | Exact |
| k=61 | "natasha 44'' console table" | 8 | 6 | Exact |

At `k=2`, the first result is a product only the dense prefetch retrieved, scoring 0.5 for being its rank 1 and nothing else. At `k=61`, the first result is a console table that both prefetches found in their top 10, and it is labeled Exact.

Raising `k` changed which retrieved document got to be first.

The tie in that table is worth its own note. Both `k=2` rows score exactly 0.5, because a document at rank 1 scores `1/(0+2)` whichever prefetch it came from.

Fusion sorts on score alone and leaves tied documents in hash-map order, so two identical queries can return them in different orders. On SciFact, 12.5% of the fused top 10 sits in a tied group at `k=2`, against 2.8% at `k=61` and none under DBSF.

Sorting the response by score and then by ID makes display order deterministic, but membership can still move. The server applies `limit` after sorting on score alone. When a tie straddles the cutoff, the server decides which documents survive before it builds the response.

To stabilize membership, ask for more than you show, then sort and truncate on the client:

```python
# Over-fetch so a tied group at the boundary lands inside the response
# instead of being cut inside the server, then decide the order yourself.
response = client.query_points(
    collection_name="products",
    prefetch=[dense_prefetch, sparse_prefetch],
    query=models.RrfQuery(rrf=models.Rrf(k=2)),
    limit=50,
)
top10 = sorted(response.points, key=lambda p: (-p.score, p.id))[:10]
```

Over-fetching works only when the larger response contains the whole tied group. Compare the score at rank 10 with the score of the last point fetched. If they match, the server is still cutting the group, so raise the fetch limit until the scores differ.

## Weights Are Pairs, Not Ratios

Weights look like a ratio and behave like a pair of numbers. Each prefetch contributes `1 / ((pos + 1) / weight + k - 1)`, so scaling both weights by the same factor changes every score and can change the final order. On WANDS at `k=5`, `(1, 2)` and `(2, 4)` share a ratio and score 0.739 and 0.751. Copy the exact pair you tested.

Two edges of the same knob behave in ways a ratio does not predict. A weight of 0.0 keeps every document from that prefetch and scores each one 0.0. The documents stay at the bottom of the fused list instead of disappearing.

A prefetch with no query scores every point 1.0, which under DBSF gives it zero standard deviation and flattens it to a constant 0.5 for every document, contributing no ordering at all.

## Check the Winner on Fresh Queries

A sweep always produces a winner. You still need to know whether it beat the default or only fit this set of queries. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) provide both tests: a bootstrap interval on per-query gain, and a split between the queries that choose the setting and the queries that report it.

Both tests matter here. On SciFact's 300 queries, nothing we tried cleared its interval. DBSF gains 0.0148, but its interval runs from -0.0001 to +0.0290 and still crosses zero. Across 200 random splits, a swept fusion winner kept 67% to 95% of its gain on queries that had no say in choosing it.

Ship the setting that clears the split, and if two clear, take the one with equal weights, since a weight pair is absolute and does not survive being rescaled. Keeping the default because nothing cleared is a real answer, and it was the right one on one of our five corpora.

## Quantization Barely Moved Fusion Here

Every number above comes from an unquantized collection, while a collection at scale is usually quantized. Fusion reads ranks, so quantization matters only when it reorders the candidate lists enough to change the result.

The effect was negligible here. Rebuilding SciFact and DBPedia with int8 scalar quantization changed none of the conclusions: the best `k` stayed 2 and 20, DBSF still beat the default, and fused nDCG@10 moved by at most 0.0002. [Candidate depth](/articles/candidate-depth/) has the full measurement, including what `rescore` and `oversampling` recover.

## Adjacent Work

- [Cormack, Clarke, and Buettcher (2009)](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) introduced RRF and fixed `k=60` in a pilot, reporting that the choice "was not critical" for fusing 30 runs of one engine. Two prefetches of different kinds is a different problem, and the table above is why the constant is worth a sweep.
- [Bruch, Gai, and Ingber (2023)](https://arxiv.org/abs/2210.11934) find RRF sensitive to its parameters and report gains on eight of nine datasets from dropping `k` from 60 to 5. They measure at rank 1000, where these numbers are at 10.
- [Hybrid queries](/documentation/search/hybrid-queries/) covers the full prefetch and fusion API, including nested prefetches and Formula Query for custom scoring.
- [Choosing a Fusion Method](https://github.com/qdrant/examples/blob/master/fusion-methods/Choosing_a_Fusion_Method.ipynb) is the earlier notebook this work extends, on SciFact alone.
