---
title: "What to Check Before You Tune a Qdrant Collection"
short_description: "Seven collection settings that fail silently, the order to try changes in, and how many labeled queries you need before a number means anything."
description: "Audit a Qdrant collection before tuning it: seven settings that fail silently, a cost-ordered list of what to change, and how to size a labeled query set."
preview_dir: /articles_data/tuning-retrieval-what-to-check-first/preview
social_preview_image: /articles_data/tuning-retrieval-what-to-check-first/preview/social_preview.jpg
weight: -214
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - retrieval tuning
  - search relevance
  - nDCG
  - labeled query set
  - Qdrant collection audit
category: search-quality
---

Your collection can look healthy while retrieval is already losing quality. Results come back. Latency looks fine. Nobody is complaining loudly. Then relevance becomes someone's quarterly goal, and you are staring at a config reference with forty settings in it.

Most of those settings are not tuning knobs. A few are correctness checks. If one is wrong, every sweep after it is measuring a broken setup.

Spend the first hour on two questions: is the collection configured the way you think it is, and can your labels detect the size of change you are chasing? This article is that first hour. It assumes you can read an API reference and reason about a memory budget, and that you have never had to explain what nDCG measures.

## The Symptom Tells You Where to Start

Start with the failure mode, not the config reference. Retrieval has too many knobs for a linear walk to be useful, and most symptoms point to a narrower part of the stack.

Four companion articles cover the individual moves. Use this table as the shortest route into them.

| What you are seeing | Where to look |
|---|---|
| You cannot tell whether a change helped | This article: the audit, then labeled sets and intervals |
| The right document never comes back at all | [What a second retrieval prefetch buys](/articles/what-a-second-retrieval-prefetch-buys/), then [candidate depth](/articles/retrieval-candidate-depth-and-memory/) |
| Exact identifiers, SKUs or error codes do not match | [What a second retrieval prefetch buys](/articles/what-a-second-retrieval-prefetch-buys/), for the BM25 side |
| The right documents come back in the wrong order | [How to tune hybrid search](/articles/how-to-tune-hybrid-search/), then [when a reranker pays](/articles/when-a-reranker-pays/) |
| Relevance is flat and you have no latency headroom | [How to tune hybrid search](/articles/how-to-tune-hybrid-search/): fusion is free |
| Results are repetitive or near-duplicates | [When a reranker pays](/articles/when-a-reranker-pays/), for diversity and grouping |
| It is too slow, or it does not fit in RAM | [Candidate depth and the memory budget](/articles/retrieval-candidate-depth-and-memory/) |

## The Arithmetic Transfers, the Index Behavior Does Not

Everything measured here and in the companion articles ran on five public corpora between 5,183 and 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25, single shard, unquantized, in a Docker container on a laptop. You should know that before you weigh any of it.

The arithmetic transfers at any size. Fusion is math over two candidate lists, so the fusion results hold whether you have ten thousand documents or ten billion. The measurement method transfers too, and it is the part of this worth the most to you: 50 labeled queries cannot resolve a 0.015 gain at any collection size.

Index behavior does not transfer. When you read "this was flat for us", read it as "here is how to test it." `hnsw_ef` does nothing on 5,000 documents because graph recall saturates immediately. On a collection large enough that it stops saturating, it is the primary recall-against-latency knob.

## Silent Settings Break Quality First

These seven settings have one correct value for a given collection. Every one fails quietly. Nothing errors, results still come back, and quality is worse than it should be.

Check them once before you tune anything else.

| Check | Why it matters |
|---|---|
| `indexed_vectors_count` against `points_count` | The direct read of whether an HNSW graph exists. Zero means every dense search is a full scan |
| `optimizers_config.indexing_threshold` | Defaults to 10,000 KB, about 6,700 vectors at 384 dimensions, and it is measured per segment rather than per collection. A collection splits into 2 to 8 segments by default, so it can take 50,000 vectors before every segment crosses the line |
| `Modifier.IDF` on the sparse vector | Qdrant applies the inverse document frequency term at query time. Without it, a score carries only term frequency and document length, so a word in every document counts for as much as a rare one |
| BM25 `avg_len` | Defaults to 256, and the correct value is the post-stemming token count of the indexed field. Measured across our five corpora: 151.4, 96.5, 46.7, 54.0 and 35.3 |
| A payload index on every filtered field, created before you ingest | Filtering an unindexed field is slower and drains resources other queries need. It also skips the filter-aware edges Qdrant adds to the HNSW graph, which are only built for fields indexed before ingestion. Qdrant Cloud's strict mode rejects the query outright |
| `full_scan_threshold` | On `hnsw_config` it is in KiloBytes, not documents, and the server rejects anything under 10. The sparse index has its own, counted in vectors |
| Fusion placement | Root-level fusion runs once at collection level. Only a fusion nested inside a prefetch runs per shard, so getting this wrong degrades a multi-shard collection quietly |

The first two are the common trap. Qdrant builds an HNSW graph only for a segment larger than `indexing_threshold`. Because the threshold is per segment, not per collection, a modest collection can keep scanning even after the collection as a whole looks large enough.

The read is one call:

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")
info = client.get_collection("products")
print(info.points_count, info.indexed_vectors_count)
```

Zero means no graph exists. Your dense search is scanning everything. Lower `indexing_threshold` or wait for the optimizer, then read it again.

The count aggregates over named vectors, so it is not a straight equality check. A hybrid collection with a dense vector and a BM25 sparse vector on 5,183 points reports 10,366 indexed, not 5,183.

Read it as a floor. Zero is broken. A number that stops climbing well below your point count times your vector count means the optimizer is still working or has stopped early.

One popular check does not work. Running the same query at two `hnsw_ef` values and seeing identical results does not prove a full scan. Recall saturates: on SciFact we get byte-identical lists at `hnsw_ef` 128 and 512 on a graph that is demonstrably HNSW.

Use that as corroboration, never as the decision.

## Cost Order Beats Pipeline Order

Pipeline order puts the expensive changes first. Cost order keeps the cheap evidence flowing.

If you have no latency headroom and no rebuild window, you can still act on the whole first tier today.

| Tier | What | Cost |
|---|---|---|
| Free | Fusion method, RRF `k`, weights | Arithmetic over lists you already retrieved. No rebuild, no extra latency |
| Latency | Prefetch `limit`, `hnsw_ef`, reranking | Buys quality with time, in that order of cheapness |
| A new stage | A second retrieval prefetch, a reranker | An extra model call per query, and a second index for the prefetch |
| Rebuild | Embedding model, quantization, `m` | Re-indexing the collection, and the embedding model sets the ceiling for everything downstream |

## The Metric Decides the Winner

Three metrics cover most of what you need, and each answers a different question.

**nDCG@k** grades relevance rather than treating it as yes or no. It discounts each position logarithmically and normalizes against a perfect ranking. Use it when several documents matter and they matter differently.

**MRR@k** is the mean of one over the rank of the first relevant result. It asks only how fast you got to something good. Use it when a query has essentially one right answer.

**Recall@k** is the share of all relevant documents that made it into the top k. Use it when you are measuring a first stage that feeds something else.

Pick before you sweep, because the metric decides the winner. On WANDS and DBPedia, nDCG@10, MRR@10 and Recall@100 each name a different best setting, and Recall@100 disagrees with nDCG@10 on four of our five corpora.

The trap sits under Recall: it stops meaning anything once relevant documents per query far exceeds k. A query with 359 relevant products cannot score above 0.28 at Recall@100 no matter how good the ranking is, because only 100 of them fit.

WANDS averages 358.9, so the metric spends its whole range near the bottom. The best we measured there was 0.3877, and a reader would call that a broken system when it is a broken measurement.

Count relevant documents per query in your own labels before you choose.

## Small Label Sets Hide Real Gains

A labeled set is queries paired with the documents that should come back for them. [Retrieval relevance](/documentation/improve-search/retrieval-relevance/) covers building one, including the warning that synthetic queries inflate the scores. Its size decides whether any retrieval tuning is visible to you at all.

Resample your queries with replacement to get a 95% interval on the mean per-query gain of one setting over another. If the interval includes zero, keep what you had.

```python
import numpy as np

def interval(per_query_gain, resamples=1000, seed=42):
    """95% interval for the mean per-query gain of one setting over another."""
    gains = np.asarray(per_query_gain, dtype=float)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(gains), size=(resamples, len(gains)))
    return np.percentile(gains[draws].mean(axis=1), [2.5, 97.5])
```

The width of that interval is a function of how many queries you labeled. Across five corpora, the median half-width came out:

| Labeled queries | Interval, either side of the gain |
|---|---|
| 25 | 0.047 |
| 50 | 0.035 |
| 100 | 0.025 |
| 200 | 0.018 |
| 300 | 0.015 |

Now compare the interval with the gain you are trying to see. The fusion gains measured in [how to tune hybrid search](/articles/how-to-tune-hybrid-search/) run from 0.012 to 0.038. A 50-query set can confirm the largest of them and nothing else. Detecting a 0.015 gain took between 200 and 1,000 queries depending on the corpus.

That is not an argument for skipping the work. It is an argument for knowing which tier you are in.

With 50 queries, do the audit and take the free tier, and skip the sweep. At that size, the procedure will tell you to keep the default almost regardless of what is true.

## The Winner Needs a Held-Out Check

A setting picked on one set of queries and reported on the same set is grading its own homework. Split your labeled queries in half, pick the winner on one half, report its gain on the other. We ran that 200 times per corpus.

Sweeping does find something real. The setting chosen on half the queries lands at a median rank of 1 to 4 out of 30 when scored on the held-out half, and it comes out worse than the default on 0% to 6% of splits. It is not fitting noise.

The gain still shrinks. Scored on queries that had no say in picking it, the winner keeps 67% to 95% of what the sweep reported, and its interval clears zero on only 20% to 30% of splits for three of the five corpora.

Expect to keep about three-quarters of any gain you measure. Expect to be unable to prove it unless the gain is large or the labeled set is.

## Index Variance Is Usually Not the Problem

Rule this out before you chase it. Rebuilding an index is nondeterministic, and people assume that instability is what is moving their numbers.

We built the same SciFact collection five times from identical vectors: mean nDCG@10 came out identical across all five, to six decimal places. The graph does move, 11.5% of the positions between ranks 101 and 200 changed, but only 0.04% of the top 10 did, and top-10 membership agreed 99.99% of the time.

Graph variance lives in the tail, below the window your metric reads. What moves your number is which queries you happened to label.

Qdrant has also already made several decisions well enough that they are not worth your afternoon. RRF as the default fusion method is right because it works when two prefetches produce scores on incompatible scales. `m=16` and `ef_construct=100` are reasonable HNSW defaults. The RRF constant of 2 is deliberate rather than an oversight, and [how to tune hybrid search](/articles/how-to-tune-hybrid-search/) explains what it does.

With the audit done and a labeled set sized, go back to the symptom. It tells you which knob is worth touching first.
