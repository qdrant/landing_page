---
title: Retrieval Quality Fundamentals
weight: 4
aliases:
  - /documentation/tutorials/retrieval-quality-fundamentals/
---

# Retrieval Quality Fundamentals

| Time: 20 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Retrieval quality decides what shows up in a search result. When it drops, downstream systems suffer: RAG answers hallucinate, search users bounce, and agents pick the wrong tools. Measuring it systematically is how you catch regressions from embedding model swaps, index config changes, or dataset drift before they reach production.

Before measuring retrieval quality, it's worth understanding what you're measuring. Retrieval quality operates at four distinct layers, and it's easy to optimize for the wrong one.

The first layer is **approximate nearest-neighbor (ANN) precision**: does the approximate index return the same results as an exact nearest-neighbor search? This is a purely algorithmic question about how faithfully HNSW approximates exhaustive search. (Sparse vectors use exact matching, so this layer doesn't apply to them.) ANN precision has nothing to do with whether those results are useful to a human.

The second layer is **retrieval relevance**: of the results returned, how many are relevant to the query intent? This requires a labeled ground-truth dataset, human judgment, or LLM-as-judge scoring. A pipeline can achieve near-perfect ANN precision and still surface irrelevant documents if the embeddings are a poor fit for the task.

The third layer is **end-to-end answer quality**: does the full pipeline (retrieval plus whatever consumes it, such as an LLM, a ranker, or a recommendation surface) produce the right output? This is usually measured offline with LLM-as-judge or human rating on a labeled test set. It's downstream of retrieval but upstream of any business KPI.

The fourth layer is **business impact**: does better retrieval lead to better outcomes like lower hallucination rates in downstream LLMs, higher task-completion rates, or improved user satisfaction scores? This is what stakeholders care about, but it's the hardest to measure directly. The causal chain from a vector match to a user outcome is long and easily dominated by generator behavior, UI, and other confounders, so no single offline metric is a reliable proxy for a KPI. The next section describes how teams bridge this gap in practice.

## Connecting the Layers in Practice

The four layers aren't measured in isolation. Teams that successfully connect retrieval work to business outcomes tend to build an **evaluation ladder** that runs each layer at a different cadence and cost, and uses the result of each layer to decide whether to invest effort at the next:

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

**Tooling.** For layer 1, the Qdrant Web UI ships with a Search Quality tab that measures ANN vs exact kNN without code (see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/)). For layer 2, [ranx](https://amenra.github.io/ranx/) is the standard Python library for ranking metrics (recall@k, MRR, NDCG@k, and others). For layer 3, the ecosystem has mature tooling like [Ragas](https://docs.ragas.io/), [Arize Phoenix](https://phoenix.arize.com/), and [DeepEval](https://docs.confident-ai.com/) for LLM-as-judge scoring and offline answer-quality eval.

## Quality Metrics

Different layers call for different metrics. The right choice depends on what the pipeline does with its results and what ground truth is available.

**Layer 1 (ANN precision).** The question is simple: of the `k` true nearest neighbors an exact search would return, how many did the approximation find? That fraction is **`recall@k`**:

`recall@k = |ANN results ∩ exact results| / k`

When both searches return exactly `k` items, `recall@k` and `precision@k` are numerically identical. The ANN community uses "recall" by convention to make clear that exact kNN is the ground truth.

**Layer 2 (retrieval relevance).** Several metrics quantify relevance against a labeled ground truth. [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k) is based on the number of relevant documents in the top-k. [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank) takes into account the position of the first relevant document. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) are based on the relevance score of the documents.

### Choosing the Right Metric

The table below is a starting point, not a prescription: pick the metric that matches your ground truth and your user-visible behavior.

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
