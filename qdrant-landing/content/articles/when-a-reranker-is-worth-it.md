---
title: "When Is a Reranker Worth It?"
short_description: "Whether a reranker beat tuned fusion depended on the model: two confirmed wins and one loss on five datasets once the model fit the data."
description: "Test whether a cross-encoder reranker beats your tuned first stage, then choose the model and candidate count from measured results."
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

Your candidate list can already contain documents your ranking never shows. Score those candidates as if they were perfectly ordered. The gap to your current score is what a better ranking stage could recover. Measure both with `nDCG@10`, which grades the top 10 results and gives more credit to relevant documents near the top. At 200 candidates, the gap ran from 0.247 to 0.487 across the five datasets here; [candidate depth](/articles/candidate-depth/) shows how to measure it on your own collection.

A cross-encoder reranker reads the query and candidate together as a single sequence, with a classification head that returns one relevance score for the pair. Joint reading lets it model token interactions that separately encoded query and document vectors cannot. There is no per-document vector to index in advance. Every candidate takes a forward pass at query time, which rules it out as a first stage.

<aside role="status">
<strong>Note:</strong> These results come from five public datasets with 5,183 to 100,000 documents. Each collection ran unquantized on one shard, with <code>all-MiniLM-L6-v2</code> for dense retrieval and Qdrant's core BM25 for sparse retrieval. Four cross-encoders reranked the fused candidates at counts from 10 through 200, scored on 200 queries per dataset. The held-out column repeats a split-half check 200 times: pick the reranker and fusion setting on one half, compare them on the other. <a href="/articles/before-tuning-a-qdrant-collection/#check-the-winner-on-fresh-queries">Held-out validation</a> explains the split, and <a href="/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain">building a labeled set</a> explains the labels.
</aside>

## Test a Reranker in Three Steps

1. Establish the baseline the reranker has to beat: [tuned fusion](/articles/how-to-tune-hybrid-search/) if you run hybrid search, your current ranking if you run dense-only or sparse-only. Confirm the documents your labels mark relevant reach the candidate list. A reranker only reorders what it receives; missing documents are a [candidate depth](/articles/candidate-depth/) or retrieval problem.
2. Rerank 10 candidates with the model you would actually serve, since model choice moved our results more than any other setting. [Reranking with FastEmbed](/documentation/fastembed/fastembed-rerankers/) shows the cross-encoder workflow and the available models. Compare the result with the first-stage baseline on held-out labeled queries.
3. Raise the candidate count only if the reranker wins. Measure throughput on your document lengths before making it part of the serving path.

## Compare with the Best First Stage

These measurements use hybrid retrieval. Each row reports the best of the four cross-encoders on that dataset, as the `nDCG@10` change over default reciprocal rank fusion (RRF) and over fusion tuned on the same candidates. The four models differ in what they can read and what they saw in training: `MiniLM-L-6`, `MiniLM-L-12`, and `BAAI/bge-reranker-base` truncate each pair at 512 tokens, while `jinaai/jina-reranker-v2-base-multilingual` reads up to 1024 and was trained on a broader mix, including code.

<aside role="status">
Every collection was built in one batch on one shard, unquantized, and queried unfiltered, so a graph shaped by continuous upserts and optimizer merges can return different candidates, and these deltas will not transfer to your collection. The reranker is also measured against a tuned hybrid baseline: a weak first stage can inflate reranker gains, which is why the tuned column is the one that decides.
</aside>

| Dataset | Selected Model | Over Default RRF | Over Tuned Fusion | Holds on Held-Out Queries |
|---|---|---|---|---|
| SciFact | `jina-reranker-v2` @ 200 | +0.057 | +0.033 | no, 37% of splits |
| ArguAna | `jina-reranker-v2` @ 25 | +0.031 | +0.017 | no, 2.5% |
| WANDS | `MiniLM-L-6` @ 200 | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | `jina-reranker-v2` @ 200 | +0.169 | +0.135 | yes, 100% |
| DBPedia-entity | `jina-reranker-v2` @ 200 | +0.137 | +0.115 | yes, 100% |

The table shows all three ways the test can end. A gain that holds on held-out queries is a win to ship: CodeSearchNet and DBPedia-entity. A positive result that fails held-out validation is a labeling decision: add queries or keep fusion, and [the label-count table in the pre-tuning article](/articles/before-tuning-a-qdrant-collection/#make-sure-your-labels-can-detect-a-gain) says how many queries that confirmation takes. A loss means fusion stays: WANDS.

The `Over Default RRF` column shows the trap of a weak baseline: WANDS gains +0.039 over default RRF yet loses to tuned fusion. A reranker can look like a win when fusion was left untuned.

Here, the model decided the outcome: on the same candidates, the three 512-token models lost to tuned fusion on four of five datasets, while the model whose window and training fit the data produced both confirmed wins.

Even the wins recover only part of the room. The perfect-ordering gap on CodeSearchNet was 0.293, and the reranker closed 0.135 of it; on DBPedia-entity, it closed 0.115 of 0.487. The gap is an upper bound; the test says how much a given model recovers.

This is the result a reranker exists to recover. On DBPedia-entity, the query "John Lennon Yoko Ono album Starting Over" is answered by the page for "(Just Like) Starting Over", and every query term sits in that page's first two sentences. Fusion still left it at rank 49 of 200, because the prefetches scored the query and page separately and fusion sees only their ranks. The cross-encoder read the pair as one sequence and put it first.

## Diagnose a Loss Before You Stop

If the reranker loses at 10 candidates, check model fit before you change anything else. Two checks cover most misfits. Tokenize a sample of your query-document pairs with the model's tokenizer, and compare the 95th percentile length against the model's window: a longer pair gets truncated, and the model scores a document it only partly read. Then read the model card for the training languages and domains.

Both checks called our results. None of the three older models was trained on code, and `jina-reranker-v2` turned CodeSearchNet from a 0.032 loss into a 0.135 held-out win over the same candidates. On ArguAna, the window was the misfit: 168-word queries leave little space for the document inside a 512-token truncation, and the 1024-token model moved it from a loss to +0.017, though at 2.5% of held-out splits the label set cannot confirm the gain.

If you find a mismatch, swap in a model whose window and training data fit your documents and rerun the 10-candidate test. If the model fits and still loses, keep the tuned first stage: on WANDS, tuned fusion beat all four models at every candidate count.

## Set Candidate Count After a Win

Start with 10 candidates. Raise the count only after the reranker beats the tuned first stage at 10, then stop when the gain on your labels flattens or queries get slower than you can serve.

{{< figure src="/articles_data/when-a-reranker-is-worth-it/reranker-gain-by-candidate-count.png" alt="Five small line charts, one per dataset, showing the best nDCG@10 change over tuned fusion at candidate counts 10, 25, 50, 100, and 200. SciFact, CodeSearchNet, and DBPedia-entity stay above the zero line, WANDS stays below it at every count, and ArguAna peaks at 25 then falls to zero by 200." caption="The best nDCG@10 change over tuned fusion among the four models, by candidate count. A line above zero is a reranker win; WANDS never crosses it." width="100%" >}}

DBPedia-entity is the stop rule in action: 0.111 of its eventual 0.115 arrived by 50 candidates, and going to 200 quadrupled the reranking work for 0.003 more. CodeSearchNet is the case for measuring instead of assuming, since it kept climbing through 200. ArguAna's gain peaked at 25 and became a loss by 200, so more candidates can also hurt. Every configuration that lost at 10 was still behind tuned fusion at 200. A higher candidate count refines a win, and it rescued no loss here.

## Size Reranking for Production

Choose the candidate count and reranker on held-out relevance. Then measure query-candidate pairs per second and tail latency on the hardware you plan to deploy, using representative document lengths and concurrency.

The table shows CPU throughput for the four [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), measured in one process on an Apple M5 Pro with 15 threads. The last row is why `jina-reranker-v2` gets served on a GPU; its GPU rates follow the table.

| Model | Size | Documents per Second | Queries per Second at 100 Candidates |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |
| `jinaai/jina-reranker-v2-base-multilingual` | 1.11 GB | under 2 | under 0.02 |

Document length explains the range: DBPedia-entity has short entity abstracts, while SciFact has full paper abstracts.

At 100 candidates, one CPU process spends between half a second and five seconds per query, where the second prefetch behind [tuned fusion](/articles/how-to-tune-hybrid-search/) added 0.6 to 1.5 ms in the same setup. The held-out gain has to be worth that difference. The 10-candidate test itself stays fast even on CPU: 47 to 156 ms per query with the smallest model.

Model size alone does not predict quality. `bge-reranker-base` and `jina-reranker-v2` are nearly the same size, and only the second ever beat tuned fusion. Training data and context window separated them, so weigh those over parameter count.

`jina-reranker-v2` needs a GPU to serve. Its ONNX export runs one CPU thread at a time through an attention kernel, which is where the under-2 figure comes from. On the same machine's GPU through PyTorch, it scored 32 to 310 documents per second depending on document length, and its quality numbers in this article come from that run. It also ships under a CC-BY-NC-4.0 license, so check the terms before production use.

## Use Other Stages for Different Problems

Choose a downstream stage by the symptom it addresses. A reranker only helps when relevant candidates need a better order.

| Symptom | Stage |
|---|---|
| Relevant candidates ranked below weaker ones | A cross-encoder or ColBERT as a reranker |
| Results are repetitive or near-duplicates | [Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) |
| One document's chunks fill the first page | [Grouping](/documentation/search/search/#grouping-api) |
| Recency, popularity, or other payload signals should shape the order | [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) |

[Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) trades relevance for diversity, and `nDCG` does not reward the diversity it adds. Measure the direction on your own labels before shipping it.

Grouping fits collections that store each chunk of a document as its own point. `query_points_groups` with `group_by` on the document ID field returns the best chunk per document, so one long document cannot fill the first page. The grouped field needs a [payload index](/documentation/manage-data/indexing/#payload-index); without one on `document_id`, Qdrant Cloud returns a 400. [Grouping](/documentation/search/search/#grouping-api) shows the API.

[Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query) rescores the same candidates with an expression over payload fields, such as recency or popularity, and needs a payload index on each field the formula references.

[ColBERT](https://arxiv.org/abs/2004.12832) shifts the reranking work from query time to ingest: document vectors are built once, so only the query goes through the model per request, at the price of a vector per token in storage. Reranking needs those vectors but never traverses a graph over them, so set [`m=0`](/documentation/search/hybrid-queries/#multi-stage-queries) on the multivector and Qdrant stores it unindexed. A cross-encoder runs as its own service after Qdrant returns candidates; ColBERT rescoring runs inside Qdrant, in the same multi-stage query. If a cross-encoder is too slow for your queries, test this next.

## What to Tune Next

The test is quick enough to run instead of guessing: rerank 10 candidates with the model you would actually serve, and compare against your tuned first stage on held-out queries. After a win, raise the candidate count until the gain flattens, and measure throughput on your own documents before the reranker enters the serving path.

Next, if memory is the constraint, [measure what memory placement and rescoring add to query latency](/articles/when-your-collection-outgrows-ram/).
