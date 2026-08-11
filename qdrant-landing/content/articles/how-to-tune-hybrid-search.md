---
title: "How to Tune Hybrid Search: Fusion, k, and Weights"
short_description: "The fusion knobs in hybrid search: RRF against DBSF, reading the constant k off your labels, and why weights are pairs and not ratios."
description: "Tune hybrid search fusion in Qdrant: choose between RRF and DBSF, set the constant k from your label density, and get weights right."
preview_dir: /articles_data/how-to-tune-hybrid-search/preview
social_preview_image: /articles_data/how-to-tune-hybrid-search/preview/social_preview.jpg
weight: -210
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-10T00:00:00+03:00
draft: false
keywords:
  - hybrid search tuning
  - reciprocal rank fusion
  - RRF k parameter
  - fusion weights
  - DBSF
category: search-quality
---

Hybrid search gives you two lists and one ranking. The dense prefetch brings semantic matches. The sparse prefetch brings exact terms. Fusion decides which evidence counts.

When the ranking looks plausible but not quite right, fusion is the cheapest place to look. It is arithmetic over two lists you already paid to retrieve: no rebuild, no extra latency, no second model.

There are three knobs: the fusion method, RRF's `k`, and the weights. The numbers come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25, unquantized on a single shard. Every gain carries a 95% bootstrap interval over per-query differences, and [sizing a labeled set](/articles/tuning-retrieval-what-to-check-first/) has the method.

Fusion can only rank what the two prefetches handed it. [Candidate depth](/articles/retrieval-candidate-depth-and-memory/) decides that. Set your prefetch `limit` to 100 or 200 and read on.

## One Curve Drives All Three Knobs

**The fusion method** decides how the two ranked lists become one. [Reciprocal Rank Fusion](/documentation/search/hybrid-queries/#reciprocal-rank-fusion-rrf) (RRF) reads only the position of each document in each list. [Distribution-based score fusion](/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf) (DBSF) normalizes each prefetch's raw scores against its own mean and standard deviation, then sums them, so how far a document led inside a prefetch reaches the final score.

**The constant `k`** applies to RRF only. Qdrant scores a document at position `pos` in one prefetch as `1 / ((pos + 1) / weight + k - 1)`, then sums across prefetches. With equal weights that reduces to `1 / (pos + k)`, and `k` alone decides how steeply the head of a list outranks its tail.

{{< figure src="/articles_data/how-to-tune-hybrid-search/rrf-k-rank-weight.png" alt="Grouped bar chart comparing the share of a retrieval prefetch's top-10 score mass at each rank, for k equal to 2 and k equal to 61. At k=2 rank 1 takes 24.8 percent and rank 10 takes 4.5 percent. At k=61 the shares are nearly flat, 10.7 percent at rank 1 and 9.3 percent at rank 10." caption="At Qdrant's default of k=2, rank 1 is worth 5.50x rank 10. At k=61 it is worth 1.15x, and the prefetch contributes little more than a membership vote." width="100%" >}}

Low `k` rewards a document that one prefetch ranked first. High `k` flattens the curve until appearing in both lists matters more than either one's top rank.

Everything below follows from that curve.

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

The two named prefetches carry through every example.

## DBSF Is the First Free Test

RRF is the right default, and it is Qdrant's, because it works when the two prefetches produce scores on incompatible scales. DBSF is one line to try.

It was the better choice more often than not here: across five corpora it beat the RRF default on four, and on three of those the gain was large enough to survive a change of query sample.

```python
query=models.FusionQuery(fusion=models.Fusion.DBSF)
```

A document only one prefetch retrieved keeps that prefetch's normalized score under DBSF, and the prefetch that missed it adds nothing. It is not zeroed out. It competes with one score against documents carrying the sum of two, which is why DBSF favors documents both prefetches agree on.

Its one loss here was on ArguAna, 0.0045 below the default, which sits inside that corpus's own measurement interval and is therefore not a result either.

## Label Density Points `k` in the Right Direction

The table gives nDCG@10 at equal weights across five values of `k`, with the best cell per row in bold and DBSF alongside. Each corpus ran the same stack, `all-MiniLM-L6-v2` for the dense prefetch and Qdrant's core BM25 for the sparse one, fusing 200 candidates from each.

| Corpus | Queries | Relevant per query | k=1 | k=2 | k=5 | k=20 | k=61 | DBSF |
|---|---|---|---|---|---|---|---|---|
| ArguAna | 1,401 | 1.0 | 0.517 | 0.522 | **0.530** | 0.527 | 0.521 | 0.517 |
| CodeSearchNet | 1,000 | 1.0 | 0.650 | 0.656 | **0.658** | 0.651 | 0.626 | 0.672 |
| SciFact | 300 | 1.1 | 0.712 | **0.717** | 0.715 | 0.712 | 0.707 | 0.732 |
| DBPedia-entity | 400 | 38.2 | 0.462 | 0.464 | 0.464 | **0.468** | 0.461 | 0.482 |
| WANDS | 480 | 358.9 | 0.723 | 0.725 | 0.734 | 0.757 | **0.761** | 0.764 |

The best `k` is different on every corpus, and it tracks label density.

Where about one document per query is relevant, the winner sits at 2 or 5. The prefetch that found that document first should carry it.

Where tens or hundreds are relevant, the winner climbs to 20 or 61. Agreement between the two beats either one's top result.

So count the relevant documents per query in your labeled set and sweep in that direction first. Five corpora do not make a rule, and this is a starting direction rather than a setting to copy.

One porting note if you are moving a configuration in. Qdrant's default is 2, where the 2009 paper that introduced RRF used 60 and [Elasticsearch documents its `rank_constant` as defaulting to 60](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion). Both score one-based ranks as `1 / (rank + constant)` where Qdrant scores zero-based positions, so Qdrant's `k` equals theirs plus one, at every rank. Write `k=61` to reproduce a classic `k=60`.

## Provenance Shows the Curve in One Query

Take the top 10 for a handful of queries and label each result by which prefetch found it: dense only, sparse only, or both. On SciFact under the default, both found 79% of all top-10 results and 97% of the relevant ones, which is the same agreement effect the table shows, visible on your own data without a sweep.

The WANDS query "entrance table" is that read on one query. The two ends of the `k` range disagree on the top result for 202 of the 480 WANDS queries, and this is one of them.

| Setting | Top result | Dense rank | Sparse rank | Label |
|---|---|---|---|---|
| k=2 | "puzzle table" | 1 | not retrieved | Irrelevant |
| k=2, tied | "console table sofa table for entryway with drawers" | not retrieved | 1 | Exact |
| k=61 | "natasha 44'' console table" | 8 | 6 | Exact |

At `k=2`, the first result is a product only the dense prefetch retrieved, scoring 0.5 for being its rank 1 and nothing else. At `k=61`, the first result is a console table that both prefetches found in their top 10, and it is labeled Exact.

Raising `k` changed which retrieved document got to be first.

The tie in that table is worth its own note. Both `k=2` rows score exactly 0.5, because a document at rank 1 scores `1/(0+2)` whichever prefetch it came from.

Fusion sorts on score alone and leaves tied documents in hash-map order, so two identical queries can return them in different orders. On SciFact, 12.5% of the fused top 10 sits in a tied group at `k=2`, against 2.8% at `k=61` and none under DBSF.

Sorting the response by score and then by ID makes the order you display deterministic, and it does not make the membership deterministic. The server applies `limit` to a list it has already sorted on score alone, so when a tied group straddles that cutoff, which of those documents survive is decided before the response is built. To pin membership too, ask for more than you show, then sort and truncate on the client:

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

## Weights Are Pairs, Not Ratios

Weights look like a ratio and behave like a pair of numbers. Each prefetch contributes `1 / ((pos + 1) / weight + k - 1)`, so scaling both weights by the same factor changes every score and can change the final order. On WANDS at `k=5`, `(1, 2)` and `(2, 4)` share a ratio and score 0.739 and 0.751. Copy the exact pair you tested.

Two more edges of the same knob. A weight of 0.0 keeps every one of that prefetch's documents and scores them all 0.0, which parks them at the bottom of the fused list rather than dropping them.

A prefetch with no query scores every point 1.0, which under DBSF gives it zero standard deviation and flattens it to a constant 0.5 for every document, contributing no ordering at all.

## The Winner Has to Survive Fresh Queries

A sweep always produces a winner, so the question is whether yours beat the default or beat this particular set of queries. Two checks settle it: bootstrap a 95% interval on the mean per-query gain and keep the default if it includes zero, then pick the winner on half your queries and report it on the other half. [Sizing a labeled set](/articles/tuning-retrieval-what-to-check-first/) has both, with the query counts each one needs.

Both bite here. On SciFact's 300 queries nothing we tried cleared its interval: DBSF gains 0.0148 with an interval from -0.0001 to +0.0290, missing by a ten-thousandth. Across 200 random splits, a swept fusion winner kept 67% to 95% of its gain on queries that had no say in choosing it.

Take the setting closest to `k=2` with equal weights that still clears, since the extremes are where the ties and the scale traps live. Keeping the default because nothing cleared is a real answer, and it was the right one on one of our five corpora.

## Quantization Barely Moved Fusion Here

Every number above comes from an unquantized collection, and a collection at scale is usually quantized. Fusion reads ranks, so the question is whether quantization reorders the candidate lists enough to change them.

It does not. Rebuilding SciFact and DBPedia with int8 scalar quantization moved 1.6% of the dense prefetch's top 10 without rescoring, and changed none of the conclusions: the best `k` stayed 2 and 20, DBSF still beat the default, tie rates moved by under 0.005, and fused nDCG@10 moved by at most 0.0002.

Turning `rescore` on recovered the exact unquantized ordering on SciFact. That is int8 scalar quantization on one shard at 5,000 and 100,000 documents, and binary quantization is a more aggressive trade that we did not test.

## Adjacent Work

- [Cormack, Clarke, and Buettcher (2009)](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) introduced RRF and fixed `k=60` in a pilot, reporting that the choice "was not critical" for fusing 30 runs of one engine. Two prefetches of different kinds is a different problem, and the table above is why the constant is worth a sweep.
- [Bruch, Gai, and Ingber (2023)](https://arxiv.org/abs/2210.11934) find RRF sensitive to its parameters and report gains on eight of nine datasets from dropping `k` from 60 to 5. They measure at rank 1000, where these numbers are at 10.
- [Hybrid queries](/documentation/search/hybrid-queries/) covers the full prefetch and fusion API, including nested prefetches and Formula Query for custom scoring.
- [Choosing a Fusion Method](https://github.com/qdrant/examples/blob/master/fusion-methods/Choosing_a_Fusion_Method.ipynb) is the earlier notebook this work extends, on SciFact alone.
