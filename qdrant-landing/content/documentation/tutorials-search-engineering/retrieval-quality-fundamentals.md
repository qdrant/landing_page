---
title: Retrieval Quality Fundamentals
weight: 4
aliases:
  - /documentation/tutorials/retrieval-quality-fundamentals/
---

# Retrieval Quality Fundamentals

| Time: 20 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Before measuring retrieval quality, it's worth understanding what you're measuring. Retrieval quality operates at three distinct levels, and it's easy to optimize for the wrong one.

The first level is **ANN precision**: does the approximate search return the same results as an exact nearest-neighbor search? This is a purely algorithmic question about how faithfully HNSW approximates exhaustive search. It has nothing to do with whether those results are useful to a human.

The second level is **retrieval relevance**: of the results returned, how many are relevant to the query intent? This requires a labeled ground-truth dataset or human judgment. A pipeline can achieve near-perfect ANN precision and still surface irrelevant documents if the embeddings are a poor fit for the task.

The third level is **business impact**: does better retrieval lead to better outcomes like lower hallucination rates in downstream LLMs, higher task-completion rates, or improved user satisfaction scores? This is what stakeholders care about, but it's the hardest to measure directly. The causal chain from a vector match to a user outcome is long and easily dominated by generator behavior, UI, and other confounders, so no single offline metric is a reliable proxy for a KPI. The next section describes how teams bridge this gap in practice.

## Connecting the Levels in Practice

The three levels aren't measured in isolation. Teams that successfully connect retrieval work to business outcomes tend to build an **evaluation ladder** that runs each layer at a different cadence and cost, and uses the result of each layer to decide whether to invest effort at the next:

| # | Layer | What it measures | Cadence | Cost |
|---|---|---|---|---|
| 1 | ANN precision | `Recall@k` vs exact kNN on a sampled query set | On index or embedding changes | Low |
| 2 | Retrieval relevance | `Recall@k` / `NDCG@k` vs a labeled golden set | Weekly, or on retrieval-stack changes | Low per run; **golden set is the real cost** (see next tutorial) |
| 3 | End-to-end answer quality | LLM-as-judge or human rating on the golden set | Weekly, or on retrieval or generator changes | Moderate (LLM-judge cost × eval size) |
| 4 | Business impact | Online A/B behind a flag | Per release, once offline layers pass | High (traffic, experimentation infra) |

Each layer is necessary but not sufficient. A win at layer 2 that doesn't carry through to layer 3 usually means the generator or the prompt is the bottleneck, not retrieval. This is the most useful diagnostic the ladder provides, and the reason teams shouldn't collapse layers 2 and 3 into a single score.

**Isolate the component under test.** When end-to-end quality moves, hold one side fixed: evaluate retrieval with the generator frozen, and evaluate the generator with retrieval frozen. Without this, attribution collapses into guesswork and the ladder stops being diagnostic.

**Proxy KPIs for teams without A/B infrastructure.** Most teams don't have the traffic or tooling to run a proper A/B. Cheap production signals that correlate with business value (click position on surfaced results, answer copy or share rate, session-level task completion, thumbs-up/down) can be instrumented long before a formal experimentation platform exists, and sit usefully between the golden-set layer and the full A/B.

**Pre-register the decision rule.** Before running the A/B, write down what constitutes a win and what constitutes a no-ship, in terms of both the retrieval metric and the KPI. This is the highest-leverage discipline for avoiding "recall improved but the KPI didn't, the KPI is noisy, let's ship anyway" rationalization.

**Tooling.** Qdrant owns layers 1 and 2 directly. For layer 3, the ecosystem has mature tooling like [Ragas](https://docs.ragas.io/), [Arize Phoenix](https://phoenix.arize.com/), and [DeepEval](https://docs.confident-ai.com/) that handles LLM-as-judge scoring and offline answer-quality eval.

## Quality Metrics

There are various ways to quantify the quality of semantic search. Some of them, such as [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k),
are based on the number of relevant documents in the top-k search results. Others, such as [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank),
take into account the position of the first relevant document in the search results. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain)
metrics are, in turn, based on the relevance score of the documents.

To evaluate the ANN algorithm itself, the question is simple: of the `k` true nearest neighbors an exact search would return, how many did the approximation find? That fraction is **`recall@k`**:

`recall@k = |ANN results ∩ exact results| / k`

When both searches return exactly `k` items, `recall@k` and `precision@k` are numerically identical. The ANN community uses "recall" by convention to make clear that exact kNN is the ground truth.

### Choosing the Right Metric

The right choice of metric depends on what the search pipeline does with its results, and on what ground truth is available. The table below is a starting point, not a prescription: pick the metric that matches your ground truth and your user-visible behavior.

| Scenario | Recommended metric | Ground truth | Why |
|---|---|---|---|
| Tuning HNSW parameters | `Recall@k` | Exact kNN search | Approximation manifests as missed items from the true top-k set, so set-overlap against exact search is the quantity that changes with index parameters |
| RAG pipeline (LLM reads top-k chunks) | `Recall@k` | Labeled relevant chunks | The LLM can recover if a relevant doc is at position 3 vs 1; missing it entirely hurts more |
| Single-answer retrieval (FAQ, Q&A) | `MRR` or `Hits@1` | Labeled correct answer | The first result is what the user acts on; lower ranks matter little |
| Re-ranking or recommendation feeds | `NDCG@k` | Graded relevance labels (e.g. 0/1/2) | Order within the result list matters; a highly relevant doc at rank 5 is worse than at rank 1 |

Note that `Recall@k` appears twice with different ground truths: against exact kNN when tuning the index, against labeled data when evaluating the pipeline end-to-end. They share a formula but answer different questions.

On choosing `k`: set it to match actual usage. If the application shows 5 results to the user, measure `@5`. If a RAG pipeline passes 10 chunks to the LLM, measure `@10`. Reporting `@100` for a UI that surfaces 5 results makes the metric look artificially good.

`NDCG` is worth the added complexity only when you have **graded relevance labels** (for example 0/1/2 scores per query-document pair rather than binary relevant/not-relevant) and when the downstream system benefits from fine-grained ranking. Without multi-grade annotations, the simpler metrics give a cleaner signal with less labeling overhead.

## Next Steps

To build a labeled dataset for relevance evaluation, see [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/). To measure and tune the ANN precision of a Qdrant collection in practice, see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/).
