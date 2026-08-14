---
title: "What to Check Before Tuning a Qdrant Collection"
short_description: "Eight collection settings that degrade retrieval without an error, the order to try changes in, and how many labeled queries a gain needs."
description: "Audit a Qdrant collection: find the settings that degrade retrieval silently, choose the cheapest next change, and size a labeled query set."
preview_dir: /articles_data/before-tuning-a-qdrant-collection/preview
social_preview_image: /articles_data/before-tuning-a-qdrant-collection/preview/social_preview.jpg
weight: -214
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-08T00:00:00+03:00
draft: false
keywords:
  - retrieval tuning
  - search relevance
  - nDCG
  - labeled query set
  - Qdrant collection audit
category: search-quality
---

Before you change a setting, decide what better retrieval means for this workload, and how you will prove it.

You may need the right document at rank one, more candidates for a reranker, lower latency, or a smaller memory footprint. Those goals favor different settings. If your labeled queries cannot detect the improvement you are chasing, you cannot trust it.

Then make sure the collection is not sabotaging the comparison. A few settings are correctness checks, not tuning knobs. Get one wrong, and every benchmark or parameter sweep after it measures a broken setup.

This audit tells you what to verify before you tune.

## The Retrieval Pipeline You Are Tuning

Every query first retrieves candidates, then ranks them. In dense-only search, one vector search does both. Hybrid search adds a sparse prefetch for exact terms, then fusion combines the dense and sparse candidate lists. A reranker, if present, scores the top candidates again.

If you run dense-only search and exact keywords are missing from results, hybrid search is the first change to test. [A second prefetch](/articles/hybrid-search-recall-candidate-list/) covers the setup and evaluation in more depth.

Before you tune:

1. Check that vectors are indexed and that every field used in a filter has a payload index. [Collection details](/documentation/manage-data/collections/#collection-info) and [payload indexing](/documentation/manage-data/indexing/#payload-index) show what to inspect.
2. Build a labeled query set and choose a metric that matches the product experience. A labeled query pairs a real user query with the documents that should be returned. [Measuring retrieval relevance](/documentation/improve-search/retrieval-relevance/) walks through the setup.

## The Symptom Tells You Where to Start

Start with the failure mode, not the config reference. The table maps each symptom to the likely constraint and the next useful check.

| Symptom | Likely Constraint | Next Check |
|---|---|---|
| You can't separate gain from noise | Evaluation resolution | This article: the audit, then labeled sets and intervals |
| Relevant documents are not retrieved | Candidate recall | [Candidate depth](/articles/candidate-depth/), then add a sparse prefetch if needed |
| Keywords, identifiers, SKUs, or error codes do not match | Lexical recall | [Add or tune a sparse prefetch](/articles/hybrid-search-recall-candidate-list/) |
| Relevant documents are misordered | Fusion or ranking | Tune fusion if you use hybrid search, then test [reranking](/articles/when-a-reranker-is-worth-it/) |
| Hybrid relevance is flat, and you cannot spend more latency | Candidate reordering | [Fusion tuning](/articles/how-to-tune-hybrid-search/) |
| Results repeat near-duplicates | Diversity | [Reranking](/articles/when-a-reranker-is-worth-it/), for diversity and grouping |
| Search misses its p95 target | Retrieval cost | [Candidate depth](/articles/candidate-depth/), starting with the prefetch `limit` |
| The collection no longer fits in RAM | Memory placement | [Memory placement and rescoring](/articles/when-your-collection-outgrows-ram/) |

## How to Read These Measurements

The procedure transfers: choose a metric that matches the product experience, compare settings on labeled queries, and validate the winner on fresh queries. Your workload decides which setting to keep.

The relevance measurements in this article and the linked articles come from five public datasets between 5,183 and 100,000 documents. Each ran unquantized on one shard in a laptop Docker container, using `all-MiniLM-L6-v2` and Qdrant's core BM25, except the depth article's quantization comparison. [The memory article](/articles/when-your-collection-outgrows-ram/) is the exception: its 4.6 million vectors are large enough to cross a real RAM boundary.

Qdrant's API and algorithm mechanics carry across collections. The result of a parameter sweep depends on the embedding model, dataset, query mix, filters, index state, shard layout, and deployment. Use each result to choose a test on your own collection, then keep only the settings your labels support.

## Silent Settings Can Break Quality

Check the stages you run before tuning anything else. These prerequisites each have a correct state for a given collection, and each can fail without an error. The query returns results, scores look plausible, and the retrieval setup is still wrong. Fix them before a benchmark or sweep. Otherwise, you are measuring a configuration error, not a trade-off.

Other retrieval settings depend on a latency, memory, or rebuild budget you supply. These checks do not.

### Dense Search and Indexing

A small collection can deliberately stay unindexed; segment size decides when Qdrant builds HNSW.

**[indexed_vectors_count](/documentation/manage-data/collections/#collection-info) against [points_count](/documentation/manage-data/collections/#collection-info)**<br>
Call `GET /collections/{collection_name}`. In a dense-only collection, `indexed_vectors_count` should reach `points_count` once indexing finishes. In a hybrid collection with one dense and one sparse vector on every point, it should reach twice `points_count`. A lower count means indexing is still running or stopped early.

**[optimizers_config.indexing_threshold](/documentation/ops-optimization/optimizer/#indexing-optimizer)**<br>
It is healthy when every segment that needs ANN search has crossed this threshold and received an HNSW graph. The default is 10,000 KB per segment, which converts to a vector count using your own embedding's dimension: about 6,700 at 384 dimensions, proportionally fewer as dimension rises. The same threshold gates a sparse vector's compact index too, sized by its own bytes rather than dimension. With one segment per two CPUs by default, clamped to between two and eight, multiply the relevant per-segment figure by your segment count to see when the whole collection is covered.

**[full_scan_threshold](/documentation/manage-data/indexing/#vector-index)**<br>
`full_scan_threshold` tells Qdrant when to use an exact full scan instead of HNSW. For dense vectors, the threshold is in kilobytes, not vector count, and must be at least 10 KB. Sparse vectors have a separate threshold, expressed in vectors. Do not copy a value between the two index types. Start from the default and confirm it is in the right unit before tuning it.

### Sparse Retrieval

These settings apply whether the collection has thousands of documents or billions.

**[Modifier.IDF](/documentation/manage-data/indexing/#idf-modifier)**<br>
Enable it on the sparse vector. Then rare terms contribute more than terms that appear in every document. Without it, the score contains term frequency and document length only.

**[BM25 avg_len](/documentation/search/text-search/full-text-search/#configuring-bm25-parameters)**<br>
Measure the indexed field's post-stemming average token count and supply that value to BM25. The default is 256; across the five datasets measured for this article, the correct values ranged from 35.3 to 151.4. Replace a copied default or a value measured on another field.

### Hybrid Search

Fusion placement matters on sharded collections. `score_threshold` is a risk at any scale when a request moves from single-vector retrieval to fusion.

**[Fusion placement](/documentation/search/hybrid-queries/)**<br>
It is healthy when fusion is the root query: it then runs once at collection level. Fusion nested inside a `prefetch` runs per shard and combines different candidate lists.

**[score_threshold](/documentation/search/search/#filtering-results-by-score)**<br>
Use `score_threshold` only when you have a measured minimum acceptance score for the stage that returns results. A threshold copied from dense-only search is unsafe in a root-level RRF or DBSF query: Qdrant compares it with the fused score, not the dense or sparse score. It can silently truncate the result list or return no results. Validate it on labeled queries, or leave it unset.

### Filtered Search

Index every field you filter on. The cost of skipping one grows with collection size and query concurrency.

**[Payload indexes](/documentation/manage-data/indexing/#payload-index)**<br>
It is healthy when every field in your filters has a payload index. Create it before ingestion: on an existing collection the filter-aware HNSW edges only appear once you [rebuild the HNSW index](/documentation/manage-data/indexing/#rebuild-the-hnsw-index), they do not appear on their own. Qdrant Cloud strict mode rejects an unindexed query outright.<br>
Strict filters cost recall even once the indexes are in place, and none of the measurements in this series were taken on a filtered collection. [What ACORN fixes, and what fixes ACORN](/articles/filtered-vector-search-acorn/) measures that on one million points.

## Change Things in Cost Order

Start with a change that does not rebuild the collection or add a retrieval stage. Move to a higher-cost tier only when the lower-cost options do not address the symptom.

| Tier | What | Applies To | Cost |
|---|---|---|---|
| No New Retrieval Work | Fusion method, RRF `k`, weights | Hybrid search | Reorders lists you already retrieved. No rebuild or extra retrieval stage |
| Expanded Retrieval | `hnsw_ef` | Dense search | Increases search breadth and query time |
| Expanded Retrieval | Prefetch `limit` | Any pipeline with a downstream stage | Retrieves more candidates, increasing query time |
| Expanded Retrieval | `full_scan_threshold` | Dense search, especially filtered search | Uses exact scans for larger candidate pools, which can increase query time |
| A New Stage | Sparse prefetch | Dense-only search | A second index and an extra retrieval stage |
| A New Stage | Reranker | Any pipeline | A model call per candidate |
| Rebuild | Embedding model, quantization, `m` | Every collection | Re-indexing the collection. Changing the embedding model also means generating a new vector for every point |

Use this table to understand the cost of the next change. Choose whether to make it only after you can measure the result.

## Choose a Metric Before You Tune

Three metrics cover most retrieval tuning, and each answers a different question.

**`nDCG@k`** rewards relevant results near the top, gives additional credit when labels are graded, and normalizes against a perfect ranking. Use it when rank order among several results matters.

**`MRR@k`** is the mean of one over the rank of the first relevant result. It asks only how fast you got to something good. Use it when a query has essentially one right answer.

**`Recall@k`** is the share of all relevant documents that made it into the top k. Use it when you are measuring a first stage that feeds something else.

Pick before you sweep, because the metric decides the winner. In our testing, `nDCG@10`, `MRR@10`, and `Recall@100` each name a different best setting, and `Recall@100` disagrees with `nDCG@10` on four of our five datasets.

`Recall@k` is capped per query by the number of relevant documents, unlike `nDCG@k`'s per-query normalization. A query with 359 relevant documents cannot exceed 0.28 at `Recall@100`, because only 100 can fit.

A macro average can exceed that bound because it averages per-query scores. In our testing, one dataset averages 358.9 relevant documents per query, and the best `Recall@100` we measured there was 0.3877.

If you use `Recall@k`, count relevant documents per query before choosing k.

## Make Sure Your Labels Can Detect a Gain

A labeled set is queries paired with the documents that should come back for them. [Retrieval relevance](/documentation/improve-search/retrieval-relevance/) covers building one. Its size decides whether any retrieval tuning is visible to you at all.

A labeled set is large enough when it can distinguish the improvement you care about from normal query-to-query variation. The table below shows how many queries it took in our tests. Size alone will not save an unrepresentative set: pull queries across the mix your product sees, including its important query types and filters, and spot-check a sample of the labels yourself.

Every check below takes one score per query for each setting you are comparing. Use the Qdrant request your service already sends. The `search` adapter below may run dense-only search, hybrid fusion, or a reranker, but it must return the final points for one query and one setting. `pytrec_eval` computes the scores from those point ids.

```python
import pytrec_eval

# Relevance keyed by the point ids the server returns, not by your own document ids.
qrels = {"q1": {"41": 1, "77": 2}}
# Your labeled queries, in the representation your Qdrant request expects.
queries = {"q1": [...]}


def score(queries, search, setting, metric="ndcg_cut_10"):
    """search(query_id, query, setting) returns the final points."""
    run = {
        query_id: {
            str(point.id): point.score
            for point in search(query_id, query, setting)
        }
        for query_id, query in queries.items()
    }
    scored = pytrec_eval.RelevanceEvaluator(qrels, {metric}).evaluate(run)
    return {query_id: scored[query_id][metric] for query_id in queries}


candidate = score(queries, search, candidate_setting)
current = score(queries, search, current_setting)
per_query_gain = [candidate[q] - current[q] for q in sorted(queries)]
```

Make `search` call your existing Qdrant request, and keep its filters, query shape, candidate limits, and every setting except the one under test fixed between the two calls.

Resample the per-query gains with replacement to estimate how much the average gain would move if you had drawn a different set of queries. The resulting 95% interval shows the range consistent with that sampling variation. If the interval includes zero, your labels cannot establish a quality gain.

```python
import numpy as np

def interval(per_query_gain, resamples=1000, seed=42):
    """95% interval for the mean per-query gain of one setting over another."""
    gains = np.asarray(per_query_gain, dtype=float)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(gains), size=(resamples, len(gains)))
    return np.percentile(gains[draws].mean(axis=1), [2.5, 97.5])
```

The number of labeled queries determines the width of that interval. Across our datasets, the median 95% interval half-width for paired `nDCG@10` gains was:

| Labeled queries | Interval, either side of the gain |
|---|---|
| 25 | 0.047 |
| 50 | 0.035 |
| 100 | 0.025 |
| 200 | 0.018 |
| 300 | 0.015 |

These intervals come from our public test datasets. Treat the table as a starting range: required label count depends primarily on effect size and query-to-query variation, not collection size alone.

In our measurements, [fusion settings](/articles/how-to-tune-hybrid-search/) moved `nDCG@10` by 0.012 to 0.038. These are gains from tuning an already-working collection, not from rebuilding the retrieval pipeline.<br>
With 50 labeled queries, only the 0.038 gain had a 95% interval that excluded zero in most draws: 93%, versus 7% to 38% for gains under 0.02. Detecting a 0.015 gain required 200 to 1,000 queries, depending on the dataset.

## Check the Winner on Fresh Queries

A setting selected and evaluated on the same queries will look better than it performs on fresh queries. Reserve a validation set before you sweep: select the winner on one half of the labeled queries, then measure its gain on the other. We repeated that split 200 times per dataset.

The selected setting usually transfers. Across those splits, its median rank was between first and fourth out of 30 settings on the held-out queries, and it was worse than the default in only 0% to 6% of splits.

The gain still shrinks. On held-out queries, the winner retained 67% to 95% of the gain reported during selection. Its held-out 95% interval excluded zero in 20% to 100% of splits, depending on the dataset.

Report the held-out result. A selected gain can shrink on fresh queries, and a small labeled set may not establish that the remaining gain is real.

If you compare separately rebuilt indexes, check top-10 agreement across two builds before you treat a small metric difference as a tuning gain. In our clean rebuild test, query sampling moved `nDCG@10` more than graph variation did. Upserts, optimizer merges that resegment the collection, replicas built separately, and quantization can change that result.

Record the current relevance metric and p95 latency for a representative query set. Then use the symptom table to choose one low-cost change, validate it on held-out queries, and keep it only if the gain survives.

Once you have a baseline, [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/) shows how to test whether retrieval depth is the constraint.
