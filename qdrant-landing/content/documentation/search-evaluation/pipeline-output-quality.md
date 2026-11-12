---
title: Evaluating Pipeline Output Quality
short_description: "Separate retrieval failures from generation failures and evaluate whether your full pipeline produces supported, useful answers."
description: "Evaluate retrieval and generation separately to identify why a Qdrant search pipeline returns an unsupported answer or misses the information users need."
weight: 7
aliases:
  - /documentation/improve-search/pipeline-output-quality/
  - /documentation/tutorials/retrieval-quality-pipeline-output/
---

# Evaluating Pipeline Output Quality

A correct answer can hide a retrieval failure. An LLM may answer from its own knowledge even when the retrieved passages contain no supporting evidence. Evaluate retrieval and generation separately to decide which part of the pipeline needs attention.

This guide explains how to choose and interpret evaluation metrics. The [companion notebook](https://github.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) contains the retrieval, generation, and scoring workflow, its dependencies, and its recorded results. You can also [open the notebook in Colab](https://githubtocolab.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb).

## Prepare Evaluation Data

Run a fixed set of test questions through your pipeline. Record each question, its retrieved passages, and its generated answer. Keep the relevance labels and reference answers separately: different metrics need different reference data.

[Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) explains how to create and validate relevance labels. Review reference answers for errors before using them to judge generated answers.

## Choose Metrics for Your Question

Use `recall@10` to measure retrieval coverage and [Ragas](https://docs.ragas.io/) metrics to assess the answer and retrieved context. Follow the companion notebook's pinned dependencies and scoring calls to reproduce its results.

| Metric | What it measures | Reference data |
| --- | --- | --- |
| `recall@10` | The share of labeled relevant passages retrieved in the first 10 results. | Passage relevance labels. |
| `context_precision` | Whether passages support the reference answer and appear before irrelevant passages. | Reference answers. |
| `faithfulness` | The share of answer claims supported by the retrieved passages. | No reference answer or relevance labels. |
| `answer_relevancy` | Whether the answer addresses the question. | No reference answer or relevance labels. |
| `FactualCorrectness` | Whether the answer agrees with the reference answer. | Reference answers. |

Faithfulness measures support, rather than factual correctness or completeness. An answer can repeat an error in a source faithfully, or omit important information. Use correctness checks and human review for the failures your application must catch.

Score reference-based metrics only on records with the required reference data. Report their coverage alongside scores. If you have neither reference answers nor passage labels, you can still score faithfulness and answer relevancy, but cannot use recall to diagnose missing evidence.

[ANN recall](/documentation/tutorials-search-engineering/ann-recall/) answers a different question: whether approximate search matches exact search. Retrieval relevance checks whether the results serve the user's question.

## Use Scores to Choose an Investigation

Set targets from your application's requirements and a sample reviewed by people familiar with the domain. Check individual failures, rather than relying only on averages. A question with more than 10 relevant passages cannot achieve perfect `recall@10`.

| Retrieval recall | Faithfulness | What to inspect |
| --- | --- | --- |
| High | High | Check answer relevancy, correctness, and completeness before accepting the result. |
| High | Low | Compare unsupported claims with the passages, generation prompt, and judge explanations. |
| Low | High | Check label coverage, missing evidence, and whether the answer omits information. |
| Low | Low | Inspect where retrieval lost evidence, then inspect unsupported answer claims. |

These scores suggest where to investigate. They do not establish which component caused a failure. Inspect the question, retrieved passages, answer, and judge explanations together. Faithfulness can be low even when the retrieved passages contain the needed evidence.

## Test a Proposed Fix

Change one part of the pipeline at a time. For example, hold retrieval fixed when comparing generation prompts. Report all metrics relevant to the application, including regressions. Greater answer relevancy can come with weaker grounding.

Repeat the evaluation to estimate judge variation. Compare results per question and across important query groups. Keep the test questions, labels, references, model versions, prompts, and retrieval settings fixed when measuring a change.

The companion notebook compares grounded and open-book generation prompts on a fixed retrieval result. It shows how a higher average score can hide failures on individual questions. Its results describe that dataset and configuration.

## Apply the Results

Use offline checks to catch known failures before release. Sample production questions to find new failure modes, and add reviewed examples to the evaluation set. Faithfulness alone cannot establish release readiness.

For the relation between retrieval quality and generation, see [Relevance, Not Recall](/articles/predicting-weak-retrieval/). Use the notebook for implementation details and [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for retrieval metrics.
