---
title: "When a Reranker Pays"
short_description: "A cross-encoder reranker beat a tuned fusion on one of five corpora and lost on four. What separated them, and how to test it cheaply."
description: "Measure whether a cross-encoder reranker pays in Qdrant: candidate counts, three models, and why the baseline you compare against decides the answer."
preview_dir: /articles_data/when-a-reranker-pays/preview
social_preview_image: /articles_data/when-a-reranker-pays/preview/social_preview.jpg
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

Your candidate list already contains documents your ranking is not showing. The gap is measurable: at candidate depth 200, it ran from 0.247 to 0.487 of nDCG@10 across the five corpora here. That is the distance between what a perfect ordering of your candidates would score and what you actually ship.

A cross-encoder reranker is the standard answer. Query and candidate go through one transformer together as a single sequence, and a classification head on top reads out one relevance score for the pair. There is no per-document vector to index in advance. Every candidate costs a forward pass at query time.

That is why it cannot be your first stage. It is also why it can make distinctions a vector comparison cannot.

The question is whether it pays. On these corpora it paid on one of five.

The numbers come from five public corpora of 5,183 to 100,000 documents, retrieved with `all-MiniLM-L6-v2` and Qdrant's core BM25 on a single shard, then reranked over the top candidates of the fused list. Three cross-encoders, candidate counts 10 through 200, 200 queries per corpus. Each configuration was picked on half the queries and scored on the other half, so nothing below is a setting grading its own homework.

## The Baseline Decides Whether It Pays

This is the part that decides the answer, so it comes first.

Compare a reranker against Qdrant's default fusion and it looks like it pays on three of five corpora. Compare the same runs against a fusion that has been tuned first, which costs nothing but an afternoon, and it pays on one.

| Corpus | Best reranked, over the RRF default | Over a tuned fusion | Holds on held-out queries |
|---|---|---|---|
| SciFact | +0.013 | -0.011 | no, 0% of splits |
| ArguAna | -0.020 | -0.034 | no, 0% |
| WANDS | +0.039 | -0.008 | no, 0% |
| CodeSearchNet | +0.002 | -0.032 | no, 0% |
| DBPedia-entity | +0.112 | +0.090 | yes, 100% |

The gains in the first column on SciFact, WANDS, and CodeSearchNet are real. They are not the reranker's.

Distribution-based score fusion had already collected them for free, without a model, without latency, and without a second stage to operate. A reranker measured against an untuned baseline bills you for work that [tuning fusion](/articles/how-to-tune-hybrid-search/) does for nothing.

On DBPedia-entity the reranker is worth +0.090 over the best fusion setting we could find, which is five times what the entire fusion grid produced on that corpus. When it pays, it pays like nothing else in retrieval.

## More Candidates Amplify the Reranker You Have

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

Raising the candidate count from there rescued a losing reranker on none of our four losing corpora. A loss at ten is the signal to stop, and you have spent an afternoon instead of a quarter.

## Capacity Is the Real Cost

A millisecond figure from a laptop tells you nothing if you serve a thousand queries a second. Throughput does, because reranking cost is linear in candidates: one forward pass each.

Three [FastEmbed cross-encoders](/documentation/fastembed/fastembed-rerankers/), measured on one CPU process, Apple M5 Pro, 15 threads:

| Model | Size | Documents per second | Queries per second at 100 candidates |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` | 0.08 GB | 64 to 212 | 0.6 to 2.1 |
| `Xenova/ms-marco-MiniLM-L-12-v2` | 0.12 GB | 34 to 117 | 0.3 to 1.2 |
| `BAAI/bge-reranker-base` | 1.04 GB | 16 to 45 | 0.2 to 0.5 |

The ranges are document length, not noise. The fast end is DBPedia's short entity abstracts and the slow end is SciFact's full paper abstracts. Your own throughput depends on how long your documents are, so measure it on your documents.

Those are CPU numbers. sbert.net reports 1,800 documents per second for MiniLM-L6 on a GPU, which is 18 queries per second per worker at 100 candidates rather than 0.6. That difference, roughly thirty-fold, is the actual deployment decision behind adding a reranker, and it is worth settling before the relevance question.

Model size does not track quality. `bge-reranker-base` is eight times the size of MiniLM-L12 and roughly two and a half times slower, and a MiniLM beat it on three of the five corpora.

That matches sbert.net's own table, where MiniLM-L6 scores 39.0 MRR@10 on MS MARCO against electra-base's 36.4 at five times the speed. Choose the candidate count first and the model second.

## Many Plausible Answers Give It Work to Do

The tempting explanation is headroom: rerank where the gap between ceiling and shipped score is largest. That is wrong. ArguAna has the second-largest gap of the five at 0.476 and is where reranking failed worst.

What the two corpora it came closest on have in common is relevance structure. DBPedia-entity averages 38.2 relevant documents per query and WANDS 358.9, both with graded labels rather than yes-or-no. The three where it lost have essentially one right answer per query.

A cross-encoder earns its cost by making fine distinctions among many plausible documents. Where one document is correct and fusion has already put it near the top, there is nothing left to distinguish and every reordering is a risk.

Five corpora do not make a rule, so treat that as the first thing to check on your own labels. Count relevant documents per query in your own labels: many graded-relevant documents per query is the profile where a reranker has something to do.

One corpus deserves its own caveat. All three models truncate the query and the document together at 512 tokens, cutting whichever of the two is longer. ArguAna's queries average 168 words, long enough to take the budget the document needed, so its deficit may be a length mismatch rather than a statement about reranking. `BAAI/bge-reranker-base`, which is not an MS MARCO model, failed there too, which makes a simple domain-transfer explanation harder to sustain.

## Cheaper Stages Fix Different Problems

**Only if repetitive results are the complaint** does [maximal marginal relevance](/documentation/search/search-relevance/#maximal-marginal-relevance-mmr) belong in the pipeline. It spends relevance to buy separation between the results it selects, so on a corpus without near-duplicates it usually lowers nDCG, and that is the point: it is fixing a problem your metric cannot see. Where the duplicates are real, it can raise the metric too, so measure it rather than assuming the direction.

**Only if one document is many chunks** do you need grouping. `query_points_groups` with `group_by` collapses results so a single long document cannot occupy your whole first page. It needs a payload index on the grouped field, and the one people forget is `document_id`, which returns a 400 on Qdrant Cloud without it.

**ColBERT is cheap in compute and expensive in storage.** It keeps a vector per token whether you retrieve with it or only rerank with it, which is 286 GiB for 9M MS MARCO passages at 128 dimensions. Reranking drops the HNSW graph over those vectors and not the vectors themselves: set `m=0` on the multivector and Qdrant stores it unindexed, since rescoring never traverses a graph.

The compute saving is the one that is real. Document vectors are computed once at ingest, so only the query goes through the model at query time, which is where the published numbers come from: over 170 times lower reranking latency than a BERT cross-encoder at comparable MRR@10, 34.9 against 34.7, measured with those document vectors already on disk. If a cross-encoder is too slow for your budget, this is the next thing to test rather than a smaller cross-encoder.

## Start Small and Stop on a Clean Loss

Tune your fusion first, because it is free and it is the baseline you have to beat. Then rerank ten candidates with `Xenova/ms-marco-MiniLM-L-6-v2`, the cheapest model, and compare against that tuned baseline on queries you did not use to pick the setting.

If it wins at ten, raise the candidate count until the curve flattens and only then try a larger model.

If it loses at ten, stop. On three of our four losing corpora the deficit grew as candidates rose, and on the fourth it shrank without ever passing the fusion. The honest outcome on four of five was that a well-tuned fusion over two prefetches was already the better ranking.

Related: [candidate depth and the memory budget](/articles/retrieval-candidate-depth-and-memory/) measures the headroom a reranker is meant to collect, and [what to check before you tune a Qdrant collection](/articles/tuning-retrieval-what-to-check-first/) has the labeled-set method behind every number here.

## Adjacent Work

- [Nogueira and Cho (2019)](https://arxiv.org/abs/1901.04085) adapt BERT to passage re-ranking by feeding query and passage through the model as one sequence, which is the mechanism behind every cross-encoder here. They report 16.7 MRR@10 for BM25 on MS MARCO passage Dev against 36.5 for a BERT-Large cross-encoder.
- [The sentence-transformers cross-encoder table](https://www.sbert.net/docs/cross_encoder/pretrained_models.html) is the source for the GPU throughput and the MS MARCO scores quoted here: MiniLM-L6 at 39.01 MRR@10 and 1,800 documents per second, electra-base at 36.41 and 340.
- [Khattab and Zaharia (2020)](https://arxiv.org/abs/2004.12832) introduce ColBERT. Their re-ranking latency and MRR@10 figures come from a single Tesla V100 with the document embeddings already computed and stored, which is why the storage stays and the compute goes. [ColBERTv2](https://arxiv.org/abs/2112.01488) adds the residual compression that cuts that storage 6 to 10x.
- [Multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) covers the prefetch-then-rescore API, including the `m=0` setting that stores a multivector without building a graph over it.
