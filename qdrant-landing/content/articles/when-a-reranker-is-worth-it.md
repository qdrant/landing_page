---
title: "When Is a Reranker Worth It?"
short_description: "A cross-encoder reranker beat a tuned fusion on one of five corpora and lost on four. What separated them, and how to test it cheaply."
description: "Measure whether a cross-encoder reranker pays in Qdrant: candidate counts, three models, and why the baseline you compare against decides the answer."
preview_dir: /articles_data/when-a-reranker-is-worth-it/preview
social_preview_image: /articles_data/when-a-reranker-is-worth-it/preview/social_preview.jpg
weight: -209
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-08-11T00:00:00+03:00
draft: false
keywords:
  - cross-encoder reranker
  - reranking
  - MMR
  - search relevance
  - FastEmbed
category: search-quality
---

Your candidate list can already contain documents your ranking is not showing. You can measure the opportunity by comparing the score of your current ranking with the best score a perfect ordering of the same candidates could achieve. At candidate depth 200, that difference ran from 0.247 to 0.487 nDCG@10 across the five corpora here; [candidate depth](/articles/candidate-depth/) shows the measurement.

A cross-encoder reranker is the standard answer. Query and candidate go through one transformer together as a single sequence, and a classification head on top reads out one relevance score for the pair. There is no per-document vector to index in advance. Every candidate costs a forward pass at query time.

That is why it cannot be your first stage. It is also why it can make distinctions a vector comparison cannot.

The question is whether it pays for your workload. On these corpora it paid on one of five.

The numbers come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25 on a single shard, then reranked over the top candidates of the fused list. We tested three cross-encoders at candidate counts from 10 through 200 on 200 queries per corpus. Each configuration was picked on half the queries and scored on the other half, so no setting is grading itself.

## Test a Reranker in Three Steps

1. Establish a fair first-stage baseline by [tuning fusion](/articles/how-to-tune-hybrid-search/) first.
2. Rerank 10 candidates with one inexpensive model, then compare it with that tuned baseline on fresh labeled queries. [Multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) explains the prefetch-and-rescore request.
3. Raise the candidate count only if the reranker wins. Measure throughput on your document lengths before making it part of the serving path.

This sequence limits cost and tells you whether the reranker improves your product, not only an untuned control.

## Compare With a Tuned First Stage

This is the part that decides the answer, so it comes first.

Compare a reranker against Qdrant's default fusion and it looks like it pays on three of five corpora. Compare the same runs against a fusion that has been tuned first, which costs nothing but an afternoon, and it pays on one.

| Corpus | Best reranked, over the RRF default | Over a tuned fusion | Holds on fresh queries |
|---|---|---|---|
| SciFact | +0.013 | -0.011 | no, 0% of splits |
| ArguAna | -0.020 | -0.034 | no, 0% |
| WANDS | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | +0.002 | -0.032 | no, 0% |
| DBPedia-entity | +0.112 | +0.090 | yes, 100% |

The gains in the first column on SciFact, WANDS, and CodeSearchNet are real, but they are not evidence that the reranker is the best next change.

Distribution-based score fusion had already collected them for free, without a model, without latency, and without a second stage to operate. A reranker measured against an untuned baseline bills you for work that [tuning fusion](/articles/how-to-tune-hybrid-search/) does for nothing.

On DBPedia-entity the reranker is worth +0.090 over the best fusion setting we could find, which is five times what the entire fusion grid produced on that corpus. When it pays, it pays like nothing else in retrieval.

## More Candidates Amplify What the Reranker Does

The usual advice is to feed a reranker as many candidates as your latency budget allows. That is right when the reranker orders better than your fusion, and actively harmful when it does not.

Best of the three models at each candidate count, against a tuned fusion:

| Corpus | 10 | 25 | 50 | 100 | 200 |
|---|---|---|---|---|---|
| SciFact | -0.011 | -0.015 | -0.019 | -0.029 | -0.032 |
| ArguAna | -0.034 | -0.065 | -0.100 | -0.115 | -0.122 |
| WANDS | -0.033 | -0.015 | -0.008 | -0.009 | -0.008 |
| CodeSearchNet | -0.032 | -0.046 | -0.059 | -0.072 | -0.086 |
| DBPedia-entity | +0.023 | +0.079 | +0.085 | +0.087 | +0.090 |

Every extra candidate is another chance for the model to promote something that does not belong. On three of the five corpora that compounds: ArguAna's deficit grows from 0.034 at ten candidates to 0.122 at two hundred, SciFact's triples, and CodeSearchNet's nearly triples.

Where the reranker is stronger, more candidates keep paying. DBPedia rises all the way to 200.

WANDS runs the other way without changing the conclusion. Its deficit shrinks from 0.033 to 0.008 as candidates rise, so more candidates helped, and it still never passes the tuned fusion.

So the cheap test is the small one. Rerank ten candidates and compare against your tuned fusion.

Raising the candidate count from there rescued a losing reranker on none of our four losing corpora. A loss at ten is the signal to look at the model rather than the candidate count, and you have spent an afternoon instead of a quarter.

## Plan for Throughput, Not Laptop Latency

A millisecond figure from a laptop tells you nothing if you serve a thousand queries a second. Throughput does, because reranking cost is linear in candidates: one forward pass each.

Three [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), measured on one CPU process, Apple M5 Pro, 15 threads:

| Model | Size | Documents per second | Queries per second at 100 candidates |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |

The ranges are document length, not noise. The fast end is DBPedia's short entity abstracts and the slow end is SciFact's full paper abstracts. Your own throughput depends on how long your documents are, so measure it on your documents.

Those are CPU numbers. sbert.net reports 1,800 documents per second for MiniLM-L6 on a GPU, which is 18 queries per second per worker at 100 candidates rather than 0.6. Their documents and their machine are not ours, so read the two figures as an order of magnitude that serving hardware moves rather than as a controlled comparison. Settle which hardware you are serving on before the relevance question, and benchmark it on your own documents.

Model size does not track quality. `bge-reranker-base` is eight times the size of MiniLM-L12 and roughly two and a half times slower, and a MiniLM beat it on three of the five corpora.

That matches sbert.net's own table, where MiniLM-L6 scores 39.0 MRR@10 on MS MARCO against electra-base's 36.4 at five times the speed. Choose the candidate count first and the model second.

## Many Plausible Answers Give a Reranker Work to Do

The tempting explanation is to rerank where the gap between the best-possible and current score is largest. That is wrong. ArguAna has the second-largest gap of the five at 0.476 and is where reranking failed worst.

What the two corpora it came closest on have in common is relevance structure. DBPedia-entity averages 38.2 relevant documents per query and WANDS 358.9, both with graded labels rather than yes-or-no. The three where it lost have essentially one right answer per query.

Where one document is correct and fusion has already put it near the top, a reranker has nothing left to distinguish and every reordering it makes is a risk. That reading fits the five outcomes; the relevance structure is what we measured, and the mechanism behind it is not.

Five corpora do not make a rule, so treat that as the first thing to check on your own labels. Count relevant documents per query in your own labels: many graded-relevant documents per query is the profile where a reranker has something to do.

One corpus deserves its own caveat. All three models truncate the query and the document together at 512 tokens, cutting whichever of the two is longer. ArguAna's queries average 168 words, long enough to take the budget the document needed, so its deficit may be a length mismatch rather than a statement about reranking. `BAAI/bge-reranker-base`, which is not an MS MARCO model, failed there too, which makes a simple domain-transfer explanation harder to sustain.

## Use Other Stages for Different Problems

Each stage after retrieval answers a different complaint. Route by the symptom before reaching for any of them.

| Symptom | Stage |
|---|---|
| Relevant candidates ranked below weaker ones | A cross-encoder, or ColBERT as a reranker |
| Results are repetitive or near-duplicates | [Maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) |
| One document's chunks fill the first page | [Grouping](/documentation/search/search/#grouping-api) |
| Recency, popularity, or other payload signals should shape the order | [Formula Query](/documentation/search/hybrid-queries/#custom-scoring-with-a-formula-query), which rescores the same candidates from payload fields |

**Only if repetitive results are the complaint** does [maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) belong in the pipeline. It spends relevance to buy separation between the results it selects, so on a corpus without near-duplicates it usually lowers nDCG, and that is the point: it is fixing a problem your metric cannot see. Where the duplicates are real, it can raise the metric too, so measure it rather than assuming the direction.

**Only if one document is many chunks** do you need grouping. `query_points_groups` with `group_by` collapses results so a single long document cannot occupy your whole first page. It needs a payload index on the grouped field, and the one people forget is `document_id`, which returns a 400 on Qdrant Cloud without it. [Grouping](/documentation/search/search/#grouping-api) shows the API and [payload indexes](/documentation/manage-data/indexing/#payload-index) shows how to create it.

**ColBERT is cheap in compute and expensive in storage.** It keeps a vector per token whether you retrieve with it or only rerank with it, which is 286 GiB for 9M MS MARCO passages at 128 dimensions. Reranking drops the HNSW graph over those vectors and not the vectors themselves: set `m=0` on the multivector and Qdrant stores it unindexed, since rescoring never traverses a graph.

The compute saving is the one that is real. Document vectors are computed once at ingest, so only the query goes through the model at query time, which is where the published numbers come from: over 170 times lower reranking latency than a BERT cross-encoder at comparable MRR@10, 34.9 against 34.7, measured with those document vectors already on disk. If a cross-encoder is too slow for your budget, this is the next thing to test rather than a smaller cross-encoder.

## Start Small and Stop on a Clear Loss

Tune your fusion first, because it is free and it is the baseline you have to beat. Then rerank ten candidates with `Xenova/ms-marco-MiniLM-L-6-v2`, the cheapest of the three tested here, and compare against that tuned baseline on queries you did not use to pick the setting.

If it wins at ten, raise the candidate count until the curve flattens and only then try a larger model.

If it loses at ten, diagnose the model before you conclude anything about the stage. All three models here truncate the pair at 512 tokens, so a long query eats the budget the document needed, and none of them was trained on your domain. Once the model fits your documents and your language and it still loses, stop buying candidates: on three of our four losing corpora the deficit grew as candidates rose, and on the fourth it shrank without ever passing the fusion.

Hold that conclusion to the same standard as any other. Every gain here was picked on half the queries and scored on the other half, 200 splits per corpus. DBPedia-entity cleared zero on 100% of those splits and the other four corpora on none of them, which is the difference between a reranker that pays and one that looks like it might. [The pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) have the method and the query counts each conclusion needs. On four of five corpora the outcome was that a well-tuned fusion over two prefetches was already the better ranking.

Related: [candidate depth](/articles/candidate-depth/) measures the opportunity a reranker can collect, and [the pre-tuning checks](/articles/before-tuning-a-qdrant-collection/) have the labeled-set method behind every number here.

## Adjacent Work

- [Nogueira and Cho (2019)](https://arxiv.org/abs/1901.04085) adapt BERT to passage re-ranking by feeding query and passage through the model as one sequence, which is the mechanism behind every cross-encoder here. They report 16.7 MRR@10 for BM25 on MS MARCO passage Dev against 36.5 for a BERT-Large cross-encoder.
- [The sentence-transformers cross-encoder table](https://www.sbert.net/docs/cross_encoder/pretrained_models.html) is the source for the GPU throughput and the MS MARCO scores quoted here: MiniLM-L6 at 39.01 MRR@10 and 1,800 documents per second, electra-base at 36.41 and 340.
- [Khattab and Zaharia (2020)](https://arxiv.org/abs/2004.12832) introduce ColBERT. Their re-ranking latency and MRR@10 figures come from a single Tesla V100 with the document embeddings already computed and stored, which is why the storage stays and the compute goes. [ColBERTv2](https://arxiv.org/abs/2112.01488) adds the residual compression that cuts that storage 6 to 10x.
- [Multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) covers the prefetch-then-rescore API, including the `m=0` setting that stores a multivector without building a graph over it.
