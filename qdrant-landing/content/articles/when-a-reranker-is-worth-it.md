---
title: "When Is a Reranker Worth It?"
short_description: "A cross-encoder reranker beat a tuned fusion on one of five datasets and lost on four. Learn how to test one without scoring more candidates than you need."
description: "Test whether a cross-encoder reranker improves relevance enough to justify its cost, then set candidate count and model size from measured results."
preview_dir: /articles_data/when-a-reranker-is-worth-it/preview
social_preview_image: /articles_data/when-a-reranker-is-worth-it/preview/social_preview.jpg
weight: -210
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-12T00:00:00+03:00
draft: false
keywords:
  - cross-encoder reranker
  - reranking
  - MMR
  - search relevance
  - FastEmbed
category: search-quality
---

Before you tune a reranker, use the [pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) to verify index state and set a labeled baseline.

Your candidate list can already contain documents your ranking never shows. Compare the current score with the best score a perfect ordering of those candidates could reach, and you can measure that opportunity. At candidate depth 200, the gap ran from 0.247 to 0.487 `nDCG@10` across the five datasets here. This metric measures relevance in the first 10 results, weighting higher ranks more; [candidate depth](/articles/candidate-depth/) explains how to measure it on your own collection.

A cross-encoder reranker reads the query and candidate together as a single sequence, with a classification head that returns one relevance score for the pair. There is no per-document vector to index in advance, so every candidate costs a forward pass at query time. That cost rules it out as a first stage. Jointly reading the query and document lets it model token interactions that separately encoded query and document vectors cannot.

These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with `all-MiniLM-L6-v2` for dense retrieval and Qdrant's core BM25 for sparse retrieval. We reranked the fused candidate list with three cross-encoders at candidate counts from 10 through 200. The table deltas use all 200 queries per dataset. The final column repeats a split-half check 200 times: select the reranker configuration and fusion setting on one half, then compare them on the other. [Held-out validation](/articles/before-tuning-a-qdrant-collection/#check-the-winner-on-fresh-queries) explains this split. [Building a labeled set](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) explains the method.

## Test a Reranker in Three Steps

1. Establish a fair first-stage baseline. If you use hybrid search, [tune fusion](/articles/how-to-tune-hybrid-search/) first. For dense-only or sparse-only search, use the current first-stage ranking.
2. Rerank 10 candidates with your existing reranker, or `Xenova/ms-marco-MiniLM-L-6-v2` as a FastEmbed starting model. Compare the result with the first-stage baseline on held-out labeled queries. [Reranking with FastEmbed](/documentation/fastembed/fastembed-rerankers/) shows the cross-encoder workflow.
3. Raise the candidate count only if the reranker wins. Measure throughput on your document lengths before making it part of the serving path.

## Compare with the Best First Stage

These measurements use hybrid retrieval. The table keeps Qdrant's default reciprocal rank fusion (RRF) as a reference. Each row reports the `nDCG@10` change for the model and candidate count selected on that dataset, against default RRF and fusion tuned on the same candidate set.

<aside role="status">
These one-shard, unquantized collections were built in one batch, and the reranker is measured against a tuned hybrid baseline. A weak first stage can inflate reranker gains. Compare against a tuned first stage before deciding whether a reranker justifies its model call.
</aside>

| Dataset | Over Default RRF | Over Tuned Fusion | Holds on Held-Out Queries |
|---|---|---|---|
| SciFact | +0.013 | -0.011 | no, 0% of splits |
| ArguAna | -0.020 | -0.034 | no, 0% |
| WANDS | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | +0.002 | -0.032 | no, 0% |
| DBPedia-entity | +0.112 | +0.090 | yes, 100% |

Only DBPedia-entity beats tuned fusion on held-out queries. On the other four datasets, tuning the first-stage fusion produced better final ranks without another model call.

If reranking beats default RRF, [tune fusion](/articles/how-to-tune-hybrid-search/) next. Add reranking only when it improves the strongest first-stage ranking on held-out labeled queries.

## Many Plausible Answers Give a Reranker Work to Do

Count the judged-relevant documents per query in your labels, and check that they reach the candidate list. A reranker may have more work when several documents are relevant at different grades. This is a profile to test, not a rule.

Treat label density as a screen, not a prediction. DBPedia-entity, with 38.2 judged-relevant documents per query, is the only winner. WANDS, a product-search dataset with 358.9, still lost. The three datasets with about one judged-relevant document per query also lost. ArguAna's gap between its current and perfect ordering was 0.476, and reranking lost there too. These outcomes do not establish a mechanism.

ArguAna is an exception: its 168-word queries may leave too little context for the document after pair truncation. `BAAI/bge-reranker-base` also failed there, making a simple domain-transfer explanation less likely.

## Diagnose a Loss Before You Stop

Treat a loss at 10 candidates as a model-fit check before you increase candidate depth. Check the context window, query and document lengths, language, and training domain. All three models tested here truncate the query and document together at 512 tokens, and none was trained on these domains.

Once the model fits your documents and language, these measurements give a stop rule: no losing reranker became a winner at a higher candidate count.

Confirm any win on queries that did not select it. Each selected reranker configuration, a model and candidate count, was picked on one half of the queries and scored on the other half across 200 random splits per dataset. DBPedia-entity's held-out gain was above zero on 100% of those splits; the other four were above zero on none. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) have the method and the query counts each conclusion needs.

## Set Candidate Count After a Win

Candidate count is a second decision. Start with 10 candidates. Raise it only after the reranker beats the tuned first stage, then stop when the gain flattens or extra candidates exceed your latency budget.

The table shows the best `nDCG@10` change among the three models at each candidate count, measured against a tuned fusion.

| Dataset | 10 | 25 | 50 | 100 | 200 |
|---|---|---|---|---|---|
| SciFact | -0.011 | -0.015 | -0.019 | -0.029 | -0.032 |
| ArguAna | -0.034 | -0.065 | -0.100 | -0.115 | -0.122 |
| WANDS | -0.033 | -0.015 | -0.008 | -0.009 | -0.008 |
| CodeSearchNet | -0.032 | -0.046 | -0.059 | -0.072 | -0.086 |
| DBPedia-entity | +0.023 | +0.079 | +0.085 | +0.087 | +0.090 |

Candidate depth is an optimization after a reranker wins, not a way to rescue one that loses. DBPedia-entity gained through 200 candidates. None of the rerankers that lost at 10 became better than tuned fusion at a higher depth, even where the deficit narrowed.

## Size Reranking for Production

Choose the candidate count and reranker on held-out relevance. Then measure query-candidate pairs per second and tail latency on the hardware you plan to deploy, using representative document lengths and concurrency.

The table shows throughput for three [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), measured in one CPU process on an Apple M5 Pro with 15 threads.

| Model | Size | Documents per Second | Queries per Second at 100 Candidates |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |

Document length explains the range: DBPedia-entity has short entity abstracts, while SciFact has full paper abstracts. Benchmark your own documents and expected concurrency. Model size does not predict quality: `bge-reranker-base` is eight times the size of MiniLM-L12 and roughly two and a half times slower, while a MiniLM won on three of five datasets. Choose candidate count and model together on held-out relevance; that pair sets the reranking work and the capacity you must serve.

## Use Other Stages for Different Problems

Choose a downstream stage by the symptom it addresses. A reranker only helps when relevant candidates need a better order.

| Symptom | Stage |
|---|---|
| Relevant candidates ranked below weaker ones | A cross-encoder or ColBERT as a reranker |
| Results are repetitive or near-duplicates | [Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) |
| One document's chunks fill the first page | [Grouping](/documentation/search/search/#grouping-api) |
| Recency, popularity, or other payload signals should shape the order | [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query), which rescores the same candidates from payload fields and needs indexes on those fields |

[Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) trades relevance for diversity. Use it when repetitive or near-duplicate results are the problem. On a dataset without near-duplicates, it usually lowers `nDCG` because the metric does not reward the diversity it adds. Real duplicates can reverse the effect, so measure the direction on your data.

Use grouping when one document has many chunks. `query_points_groups` with `group_by` collapses results so a single long document cannot occupy the first page. It needs a payload index on the grouped field; without one on `document_id`, Qdrant Cloud returns a 400. [Grouping](/documentation/search/search/#grouping-api) shows the API, and [payload indexes](/documentation/manage-data/indexing/#payload-index) shows how to create the index.

[ColBERT](https://arxiv.org/abs/2004.12832) shifts work from query-time encoding to ingest and storage. It keeps a vector per token whether you retrieve with it or only rerank with it. At 128 dimensions, that is 286 GiB for nine million MS MARCO passages. Reranking drops the HNSW graph over those vectors, not the vectors themselves: set [`m=0`](/documentation/search/hybrid-queries/#multi-stage-queries) on the multivector and Qdrant stores it unindexed, since rescoring never traverses a graph.

The compute saving comes from building document vectors once at ingest. At query time, only the query goes through the model. The published result reports over 170 times lower reranking latency than a BERT cross-encoder at comparable `MRR@10`, which measures how early the first relevant result appears: 34.9 against 34.7, with the document vectors already on disk. If a cross-encoder is too slow for your budget, test this next.

In these hybrid experiments, a well-tuned fusion over two prefetches was the better ranking on four of five datasets.

Next, if memory is the constraint, [measure the latency cost of memory placement and rescoring](/articles/when-your-collection-outgrows-ram/).
