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

Your candidate list can already contain documents your ranking never shows. Score those candidates as if they were perfectly ordered, and the gap to your current score is what a better ranking stage could recover. Both scores use `nDCG@10`, which grades the top 10 results and gives more credit to relevant documents near the top. At 200 candidates, the gap ran from 0.247 to 0.487 across the five datasets here; [candidate depth](/articles/candidate-depth/) shows how to measure it on your own collection.

A cross-encoder reranker reads the query and candidate together as a single sequence, with a classification head that returns one relevance score for the pair. Reading the pair jointly lets it model token interactions that separately encoded query and document vectors cannot. There is no per-document vector to index in advance. Every candidate costs a forward pass at query time, so this cost rules it out as a first stage.

<aside role="status">
<strong>Note:</strong> These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with <code>all-MiniLM-L6-v2</code> for dense retrieval and Qdrant's core BM25 for sparse retrieval. Three cross-encoders reranked the fused candidates at counts from 10 through 200, scored on 200 queries per dataset. The held-out column repeats a split-half check 200 times: pick the reranker and fusion setting on one half, compare them on the other. <a href="/articles/before-tuning-a-qdrant-collection/#check-the-winner-on-fresh-queries">Held-out validation</a> explains the split, and <a href="/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain">building a labeled set</a> explains the labels.
</aside>

## Test a Reranker in Three Steps

1. Establish a fair first-stage baseline. If you use hybrid search, [tune fusion](/articles/how-to-tune-hybrid-search/) first. For dense-only or sparse-only search, use the current first-stage ranking. Check that the documents your labels mark relevant reach the candidate list: a reranker can only reorder what it receives, so if they are missing, fix [candidate depth](/articles/candidate-depth/) or retrieval first.
2. Rerank 10 candidates with your existing reranker, or `Xenova/ms-marco-MiniLM-L-6-v2` as a FastEmbed starting model. Compare the result with the first-stage baseline on held-out labeled queries. [Reranking with FastEmbed](/documentation/fastembed/fastembed-rerankers/) shows the cross-encoder workflow.
3. Raise the candidate count only if the reranker wins. Measure throughput on your document lengths before making it part of the serving path.

This is step 2 on a hybrid collection: fetch the 10 fused candidates you serve today, then rerank the same list with a FastEmbed cross-encoder.

```python
from fastembed.rerank.cross_encoder import TextCrossEncoder
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://YOUR-CLUSTER.cloud.qdrant.io",
    api_key="<your-api-key>",
)

# Both prefetches must use the models the collection was indexed with,
# and they embed the same query text the reranker reads.
from your_embedding_setup import dense_query, sparse_query

query_text = "the query text"

response = client.query_points(
    collection_name="products",
    prefetch=[
        models.Prefetch(query=dense_query, using="dense", limit=200),
        models.Prefetch(query=sparse_query, using="bm25", limit=200),
    ],
    # Your tuned fusion settings; k=2 with equal weights is the default.
    query=models.RrfQuery(rrf=models.Rrf(k=2, weights=[1.0, 1.0])),
    limit=10,
    with_payload=["text"],
)

candidates = [point.payload["text"] for point in response.points]

# Any FastEmbed cross-encoder works; this is the smallest.
encoder = TextCrossEncoder(model_name="Xenova/ms-marco-MiniLM-L-6-v2")
scores = list(encoder.rerank(query_text, candidates))

# The same 10 candidates, reordered by cross-encoder score.
reranked = [
    point
    for _, point in sorted(zip(scores, response.points), key=lambda pair: pair[0], reverse=True)
]
```

This code requires Qdrant v1.17 or later for `models.RrfQuery`. Score both lists, `response.points` and `reranked`, against your labels with `nDCG@10`.

## Compare with the Best First Stage

These measurements use hybrid retrieval, with Qdrant's default reciprocal rank fusion (RRF) kept as a reference. Each row reports the `nDCG@10` change for the model and candidate count selected on that dataset, against both default RRF and fusion tuned on the same candidate set.

<aside role="status">
Every collection was built in one batch on one shard, unquantized, and queried unfiltered, so a graph shaped by continuous upserts and optimizer merges can return different candidates, and these deltas will not transfer to your collection. The reranker is also measured against a tuned hybrid baseline: a weak first stage can inflate reranker gains, which is why the tuned column is the one that decides.
</aside>

| Dataset | Over Default RRF | Over Tuned Fusion | Holds on Held-Out Queries |
|---|---|---|---|
| SciFact | +0.013 | -0.011 | no, 0% of splits |
| ArguAna | -0.020 | -0.034 | no, 0% |
| WANDS | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | +0.002 | -0.032 | no, 0% |
| DBPedia-entity | +0.112 | +0.090 | yes, 100% |

Only DBPedia-entity beats tuned fusion on held-out queries. On the other four datasets, tuning the first-stage fusion produced better final ranks without another model call.

Even the win recovered a fraction of the available room. DBPedia-entity's gap to a perfect ordering of the same 200 candidates was 0.487, and the reranker closed 0.090 of it. The gap says a better ordering exists; the test says how much of it a given model captures.

If reranking beats default RRF, [tune fusion](/articles/how-to-tune-hybrid-search/) next. Add reranking only when it improves the strongest first-stage ranking on held-out labeled queries.

## Diagnose a Loss Before You Stop

If the reranker loses at 10 candidates, check model fit before you change anything else: context window, query and document lengths, language, and training domain. All three models tested here truncate the query and document together at 512 tokens, and none was trained on these domains. ArguAna is the clearest example: its 168-word queries may leave too little space for the document after pair truncation, and all three models lost there despite 0.476 of room between the current and perfect ordering.

If you find a mismatch, swap in a model whose window and training data fit your documents and rerun the 10-candidate test. If the model fits and still loses, keep the tuned first stage and spend the tuning budget elsewhere.

## Set Candidate Count After a Win

Start with 10 candidates. Raise the count only after the reranker beats the tuned first stage at 10, then stop when the gain on your labels flattens or extra candidates exceed your latency budget.

The table shows the best `nDCG@10` change among the three models at each candidate count, measured against a tuned fusion.

| Dataset | 10 | 25 | 50 | 100 | 200 |
|---|---|---|---|---|---|
| SciFact | -0.011 | -0.015 | -0.019 | -0.029 | -0.032 |
| ArguAna | -0.034 | -0.065 | -0.100 | -0.115 | -0.122 |
| WANDS | -0.033 | -0.015 | -0.008 | -0.009 | -0.008 |
| CodeSearchNet | -0.032 | -0.046 | -0.059 | -0.072 | -0.086 |
| DBPedia-entity | +0.023 | +0.079 | +0.085 | +0.087 | +0.090 |

DBPedia-entity is the stop rule in action: most of its gain arrived by 50 candidates, and going to 200 quadrupled the reranking work for 0.005 more. Every reranker that lost at 10 was still behind tuned fusion at 200, even where the deficit narrowed. A higher candidate count refines a win; it rescued no loss here.

## Size Reranking for Production

Choose the candidate count and reranker on held-out relevance. Then measure query-candidate pairs per second and tail latency on the hardware you plan to deploy, using representative document lengths and concurrency.

The table shows throughput for three [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), measured in one CPU process on an Apple M5 Pro with 15 threads.

| Model | Size | Documents per Second | Queries per Second at 100 Candidates |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |

Document length explains the range: DBPedia-entity has short entity abstracts, while SciFact has full paper abstracts. Benchmark your own documents at the concurrency you expect.

These rates put the model call in scale. At 100 candidates, one CPU process spends between half a second and five seconds per query, where the second prefetch behind [tuned fusion](/articles/how-to-tune-hybrid-search/) added 0.6 to 1.5 ms in the same setup. That is the cost the reranker's held-out gain has to justify.

Model size does not predict quality. `bge-reranker-base` is eight times the size of MiniLM-L12 and roughly two and a half times slower, yet a MiniLM won on three of five datasets.

## Use Other Stages for Different Problems

Choose a downstream stage by the symptom it addresses. A reranker only helps when relevant candidates need a better order.

| Symptom | Stage |
|---|---|
| Relevant candidates ranked below weaker ones | A cross-encoder or ColBERT as a reranker |
| Results are repetitive or near-duplicates | [Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) |
| One document's chunks fill the first page | [Grouping](/documentation/search/search/#grouping-api) |
| Recency, popularity, or other payload signals should shape the order | [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) |

[Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) trades relevance for diversity. On a dataset without near-duplicates, it usually lowers `nDCG` because the metric does not reward the diversity it adds. Real duplicates can reverse the effect, so measure the direction on your data.

`query_points_groups` with `group_by` collapses results so a single long document cannot occupy the first page. It needs a payload index on the grouped field; without one on `document_id`, Qdrant Cloud returns a 400. [Grouping](/documentation/search/search/#grouping-api) shows the API, and [payload indexes](/documentation/manage-data/indexing/#payload-index) shows how to create the index.

[Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) rescores the same candidates with an expression over payload fields, such as recency or popularity, and needs a payload index on each field the formula references.

[ColBERT](https://arxiv.org/abs/2004.12832) shifts the reranking work from query time to ingest. It keeps a vector per token whether you retrieve with it or only rerank with it, and at 128 dimensions that is 286 GiB for nine million MS MARCO passages. Reranking needs the vectors but never traverses a graph over them: set [`m=0`](/documentation/search/hybrid-queries/#multi-stage-queries) on the multivector and Qdrant stores it unindexed.

Because the document vectors are built once at ingest, only the query goes through the model at query time. The ColBERT paper reports over 170 times lower reranking latency than a BERT cross-encoder at comparable `MRR@10`, the metric for how early the first relevant result appears: 34.9 against 34.7. If a cross-encoder is too slow for your budget, test this next.

## What to Tune Next

The test is cheap, so run it instead of guessing: rerank 10 candidates with a small cross-encoder and compare it with your tuned first stage on held-out queries. On four of these five datasets the answer was no, and tuned fusion kept the final ranking. After a win, raise the candidate count until the gain flattens, and measure throughput on your own documents before the reranker enters the serving path.

Next, if memory is the constraint, [measure the latency cost of memory placement and rescoring](/articles/when-your-collection-outgrows-ram/).
