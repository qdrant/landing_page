---
title: "What to Check Before Tuning a Qdrant Collection"
short_description: "Seven collection settings that degrade retrieval without an error, the order to try changes in, and how many labeled queries a gain needs."
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

Before you change a setting, decide what better retrieval means for this workload. The right document at rank one, more candidates for a reranker, lower latency, and a smaller memory footprint each favor different settings, so pick your goal first. If your labeled queries can't detect the improvement you're chasing, none of this will tell you anything.

Some settings are there to verify correctness, not to tune performance. If a vector is unindexed, a sparse vector is missing the IDF modifier, or a BM25 average length was copied from another field, the results are invalid. Any benchmarks or parameter sweeps you run after that will reflect a broken setup. This article shows you how to check each setting and what the correct state looks like.

## The Retrieval Pipeline You Are Tuning

Every query first retrieves candidates, then ranks them. In dense-only search, one vector search does both. Hybrid search adds a sparse prefetch for exact terms, then fusion combines the dense and sparse candidate lists. A reranker, if present, scores the top candidates again.

{{< figure src="/articles_data/before-tuning-a-qdrant-collection/retrieval-pipeline.svg" alt="Pipeline diagram: a dense prefetch with limit and hnsw_ef settings and a sparse prefetch with limit and Modifier.IDF settings both feed a fusion stage with RRF k, weights, and DBSF settings, followed by an optional reranker with candidate count and model settings." caption="The hybrid pipeline and the settings each stage owns. Dense-only search uses the dense prefetch path on its own, so `limit` and `hnsw_ef` are its only settings here." width="100%" >}}

If you run dense-only search and exact keywords are missing from results, hybrid search is the first change to test. [Tuning hybrid search](/articles/how-to-tune-hybrid-search/) covers the request shape, what the second prefetch costs, and how to check that fusion beats either prefetch on your labels.

Before you tune:

1. Check that vectors are indexed and that every field used in a filter has a payload index. [Collection details](/documentation/manage-data/collections/#collection-info) and [payload indexing](/documentation/manage-data/indexing/#payload-index) show what to inspect.
2. Build a labeled query set and choose a metric that matches the product experience. A labeled query pairs a real user query with the documents that should be returned. [Measuring retrieval relevance](/documentation/improve-search/retrieval-relevance/) walks through the setup.

## The Symptom Tells You Where to Start

Start with the failure mode, not the config reference. The table maps each symptom to the first useful check and the article that covers it.

| What You See | First Check | Read Next |
|---|---|---|
| You cannot separate a gain from noise | Build labeled queries, choose a metric, and calculate an interval | This article |
| Relevant documents do not appear | Measure whether candidate depth is limiting recall | [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/) |
| Keywords, identifiers, SKUs, or error codes do not match | Add a sparse prefetch and measure fusion against each prefetch alone | [How to Tune Hybrid Search in Qdrant](/articles/how-to-tune-hybrid-search/) |
| Relevant documents are present but misordered | For hybrid search, tune fusion. If the candidate list needs another ranking stage, test a reranker | [How to Tune Hybrid Search in Qdrant](/articles/how-to-tune-hybrid-search/)<br>[When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/) |
| Results repeat near-duplicates | Test maximal marginal relevance. If chunks from one document fill the page, use grouping | [When Is a Reranker Worth It?](/articles/when-a-reranker-is-worth-it/) |
| Search misses its p95 target | Measure the cost of candidate depth before adding another retrieval stage | [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/) |
| The collection no longer fits in RAM | Test memory placement and rescoring | [When Your Collection Outgrows RAM](/articles/when-your-collection-outgrows-ram/) |

## How to Read These Measurements

The procedure transfers: choose a metric that matches the product experience, compare settings on labeled queries, and validate the winner on fresh queries. Your workload decides which setting to keep.

The relevance measurements in this article come from five public datasets between 5,183 and 100,000 documents. Each ran unquantized on one shard in a laptop Docker container, using `all-MiniLM-L6-v2` and Qdrant's core BM25.

Qdrant's API and algorithm mechanics carry across collections. The result of a parameter sweep depends on the embedding model, dataset, query mix, filters, index state, shard layout, and deployment.<br>
Use each result to choose a test on your own collection, then keep only the settings your labels support.

## Silent Settings Can Break Quality

Check the stages you run before tuning anything else. These prerequisites each have a correct state for a given collection, and each can fail without an error. Fix them before a benchmark or sweep, otherwise you are measuring a configuration error, not a trade-off.

### Dense Search and Indexing

**[Vectors are indexed](/documentation/manage-data/collections/#collection-info)**<br>
Call `GET /collections/{collection_name}` and compare `indexed_vectors_count` with `points_count`.  
For a dense-only collection, the counts should match once indexing is complete. In a hybrid collection where every point has one dense vector and one sparse vector, `indexed_vectors_count` should reach twice `points_count`. Qdrant counts each vector separately.  
If the indexed count is lower, indexing may still be running, may have stopped early, or the segments may be smaller than the default `indexing_threshold` of 10,000 KB. See the [indexing optimizer documentation](/documentation/ops-optimization/optimizer/#indexing-optimizer).  
Until Qdrant builds an HNSW graph for a segment, searches there are exact. That means changing `hnsw_ef` or enabling quantization will not change the results for those segments.

**[full_scan_threshold](/documentation/manage-data/indexing/#vector-index)**<br>
Dense and sparse vectors have separate thresholds in different units, so a value copied between them lands nowhere near the intended size. The dense one counts kilobytes of vectors in a segment, 10,000 by default, and sends both unfiltered searches on small segments and searches whose filter matches few points to an exact scan instead of the graph. The sparse one counts vectors, 5,000 by default, and applies only when a filter is present.

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
Use `score_threshold` only when you have a measured minimum acceptance score for the stage that returns results. A threshold copied from dense-only search is unsafe in a root-level RRF or DBSF query: Qdrant compares it with the fused score, not the dense or sparse score.<br>
It can silently truncate the result list or return no results. Validate it on labeled queries, or leave it unset.

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
| A New Stage | Sparse prefetch | Dense-only search | A second index, a second vector per point, and 0.6 to 1.5 ms of query time on one shard |
| A New Stage | Reranker | Any pipeline | A model call per candidate |
| Rebuild | [Embedding model](/articles/how-to-choose-an-embedding-model/), quantization, `m` | Every collection | Re-indexing the collection. Changing the embedding model also means generating a new vector for every point |

Consider model-level rebuilds only when they address a measured constraint. A Matryoshka model's [`mrl` parameter](/documentation/inference/matryoshka-models/) trades retrieval quality for smaller vectors when memory is the limit. [SPLADE](/documentation/fastembed/fastembed-splade/) and [miniCOIL](/articles/minicoil/) are alternatives when core BM25 misses vocabulary your users rely on, but they add model inference during indexing and querying. ColBERT can act as the retriever instead of only [reranking](/articles/when-a-reranker-is-worth-it/), at the cost of storing a vector for every token.

Use this table to understand the cost of the next change. Choose whether to make it only after you can measure the result.

## Choose a Metric Before You Tune

Three metrics cover most retrieval tuning, and each answers a different question.

**`nDCG@k`** rewards relevant results near the top, gives additional credit when labels are graded, and normalizes against a perfect ranking. Use it when rank order among several results matters.

**`MRR@k`** is the mean of one over the rank of the first relevant result. It asks only how fast you got to something good. Use it when a query has essentially one right answer.

**`Recall@k`** is the share of all relevant documents that made it into the top k. Use it when you are measuring a first stage that feeds something else.

Pick before you sweep, because the metric decides the winner. In our testing, `nDCG@10`, `MRR@10`, and `Recall@100` each name a different best setting, and Recall@100 disagrees with nDCG@10 on four of our five datasets.

`Recall@k` is capped per query by the number of relevant documents, unlike `nDCG@k`'s per-query normalization. A query with 359 relevant documents cannot exceed 0.28 at Recall@100, because only 100 can fit.

A macro average can exceed that bound because it averages per-query scores. In our testing, one dataset averages 358.9 relevant documents per query, and the best `Recall@100` we measured there was 0.3877.

If you use `Recall@k`, count relevant documents per query before choosing k.

## Make Sure Your Labels Can Detect a Gain

A labeled set is queries paired with the documents that should come back for them. [Retrieval relevance](/documentation/improve-search/retrieval-relevance/) covers building one. Its size decides whether any retrieval tuning is visible to you at all.

A labeled set is large enough when it can distinguish the improvement you care about from normal query-to-query variation. The table below shows how many queries it took in our tests.<br>
Size alone will not save an unrepresentative set: pull queries across the mix your product sees, including its important query types and filters, and spot-check a sample of the labels yourself.

Every check below takes one score per query for each setting you are comparing. Use the Qdrant request your service already sends.<br>
The `search` adapter below may run dense-only search, hybrid fusion, or a reranker, but it must return the final points for one query and one setting. `pytrec_eval` computes the scores from those point IDs.

```python
import pytrec_eval

# Relevance keyed by the point IDs the server returns, not by your own document IDs.
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

| Labeled Queries | Interval, Either Side of the Gain |
|---|---|
| 25 | 0.047 |
| 50 | 0.035 |
| 100 | 0.025 |
| 200 | 0.018 |
| 300 | 0.015 |

These intervals come from our public test datasets. Treat the table as a starting range: required label count depends primarily on effect size and query-to-query variation, not collection size alone.

In our measurements, [fusion settings](/articles/how-to-tune-hybrid-search/) moved `nDCG@10` by 0.012 to 0.038. These are gains from tuning an already-working collection, not from rebuilding the retrieval pipeline.

Fifty labeled queries were enough to detect the larger gains, not the smaller ones. For the 0.038 gain, the 95% interval excluded zero in 93% of draws. For gains under 0.02, it excluded zero in only 7% to 38% of draws. Detecting a 0.015 gain took 200 to 1,000 queries, depending on the dataset.

## Check the Winner on Fresh Queries

A setting selected and evaluated on the same queries will look better than it performs on fresh queries. Reserve a validation set before you sweep: select the winner on one half of the labeled queries, then measure its gain on the other. We repeated that split 200 times per dataset.

The selected setting usually transfers. Across those splits, its median rank was between first and fourth out of 30 settings on the held-out queries, and it was worse than the default in only 0% to 6% of splits.

The gain still shrinks. On held-out queries, the winner retained 67% to 95% of the gain reported during selection. Its held-out 95% interval excluded zero in 20% to 100% of splits, depending on the dataset.

Report the held-out result. A selected gain can shrink on fresh queries, and a small labeled set may not establish that the remaining gain is real.

If you compare separately rebuilt indexes, check top-10 agreement across two builds before you treat a small metric difference as a tuning gain. In our clean rebuild test, query sampling moved `nDCG@10` more than graph variation did.<br>
Upserts, optimizer merges that resegment the collection, replicas built separately, and quantization can change that result.

Record the current relevance metric and p95 latency for a representative query set. Then use the symptom table to choose one low-cost change, validate it on held-out queries, and keep it only if the gain survives.

Once you have a baseline, [Candidate Depth: How Much Retrieval Is Enough?](/articles/candidate-depth/) shows how to test whether retrieval depth is the constraint.
