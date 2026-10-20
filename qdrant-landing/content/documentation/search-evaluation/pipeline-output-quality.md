---
title: Evaluating Pipeline Output Quality
short_description: "Separate retrieval failures from generation failures and evaluate whether your full pipeline produces supported, useful answers."
description: "Evaluate retrieval and generation separately to identify why a Qdrant RAG pipeline returns an unsupported or off-topic answer."
weight: 7
author: Dylan Couzon
author_link: https://www.linkedin.com/in/dcouzon/
date: 2026-05-11T00:00:00+03:00
aliases:
  - /documentation/improve-search/pipeline-output-quality/
  - /documentation/tutorials/retrieval-quality-pipeline-output/
---

# Evaluating Pipeline Output Quality

This guide focuses on **pipeline output quality**: whether the answer your RAG pipeline generates is supported by the passages Qdrant retrieved and addresses the question.

To measure it, you run a golden set, a fixed list of test questions with known good results, through the full pipeline. You record each question's retrieved passages and generated answer, and a second LLM, the judge, scores them. The numbers on this page come from one recorded run on a public biomedical dataset, described in How We Measured.

Two related pages cover the other retrieval-evaluation concerns: [Measuring ANN Recall](/documentation/tutorials-search-engineering/ann-recall/) (does the approximate nearest neighbor index return the same results as exact search?) and [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) (do the top-k results match query intent?).

## Choosing What to Score

Several frameworks score RAG output with an LLM as the judge, including <a href="https://docs.ragas.io/" target="_blank">Ragas</a> and <a href="https://deepeval.com/" target="_blank">DeepEval</a>. This guide uses Ragas metric names because Ragas ships every judged metric the guide scores. The workflow is the same in another framework or when you call the judge LLM directly.

Four scores cover the two halves of the pipeline. `recall@10` and `context_precision` score retrieval, and `faithfulness` and `answer_relevancy` score the answer:

- `recall@10` is the share of a question's labeled passages that appear in the top 10 results. It needs no judge, and [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) shows how to compute it.
- `context_precision` scores retrieval with an LLM judge. Unlike precision@10, it does not need relevance labels: the judge decides which retrieved passages support the reference answer. It is also rank-aware, so it drops when irrelevant passages outrank the useful ones. Use it when you have reference answers but no labels, or when you suspect the labels miss passages. It only scores questions with a reference answer.
- `faithfulness` measures how close the answer is to what the retriever returned: the share of its claims those passages support. It drops when the generator hallucinates or answers from training knowledge, even when that knowledge is correct.
- `answer_relevancy` checks whether the answer addresses the question: the judge writes questions from the answer and compares their embeddings with the original question. It drops when the generator pads, dodges, or drifts off-topic, and scores 0 for a noncommittal answer such as "the context does not contain the answer".

Supported, relevant, and correct are three separate properties, and neither answer score checks the third. If the question is "What caused the outage?" and the passage names a database connection failure, the answer "The service had an outage" is fully faithful and still useless. A faithful, relevant answer can also be wrong when the passages are wrong. Only a reference-based metric such as `FactualCorrectness` scores correctness.

{{< island
    path="content/documentation/headless/pipeline-output-quality/score-map"
    ratio="712 / 440"
    title="Retrieval scores compare the retrieved passages with the golden set. Answer scores compare the answer with the passages and the question."
>}}
![The RAG pipeline runs from the question through Qdrant retrieval to the top 10 passages, then through the generator to the answer. recall@10 compares the passages with the relevance labels, context_precision compares them with the reference answer, faithfulness compares the answer with the passages, and answer_relevancy compares the answer with the question.](/docs/pipeline-output-quality-score-map.png)
{{< /island >}}

What you can measure depends on what your golden set contains. Relevance labels are the IDs of the passages that answer each question, and they are the ground truth for retrieval. Reference answers are the correct answers written out as text, and they are the ground truth for the answer itself. Neither is perfect: labels miss passages, and a reference answer is only as good as whoever wrote it.

| Your golden set has | Retrieval scores | Answer scores | How well you can tell which half failed |
|---|---|---|---|
| Labels and reference answers | `recall@10`, `context_precision` | `faithfulness`, `answer_relevancy`, correctness such as `FactualCorrectness` | Strong |
| Labels only | `recall@10` | `faithfulness`, `answer_relevancy` | Strong |
| Reference answers only | `context_precision` | `faithfulness`, `answer_relevancy`, correctness | Partial: the judge checks whether some passages support the reference, not whether retrieval found all the evidence |
| Neither, for example sampled production traffic | `ContextPrecisionWithoutReference`, which depends on the answer | `faithfulness`, `answer_relevancy` | Limited: the retrieval score depends on the answer |

If retrieval feeds something other than an LLM, such as a ranker, a search UI, or an agent, Ragas metrics do not fit. Score the end-to-end output with a task metric instead, such as normalized discounted cumulative gain (NDCG) for a ranker, click-through rate for a UI, or task-completion rate for an agent, and keep the same method: hold one component fixed and change the other.

## Reading the Scores

Score retrieval and the answer on the same questions, and every question has a retrieval score next to its answer scores. Pairing `recall@10` with `faithfulness` gives a diagnostic 2x2 for attributing score changes. When a metric drops after a change, such as a new embedding model, prompt, or chunking strategy, the pair tells you which half of the pipeline to investigate. In the table, High and Low are relative to the target you set for each metric.

| `recall@10` | `faithfulness` | Diagnosis |
|---|---|---|
| High | High | Retrieval met its target and the answer stays within the passages. `faithfulness` does not check correctness, so score against the reference answers with `FactualCorrectness` and read a sample before you ship. |
| High | Low | Generator, prompt, or judge problem. Retrieval surfaced the right passages, so read the `faithfulness` verdicts: either the answer adds unsupported claims, or the judge rejected a valid answer that combines several passages. |
| Low | Low | Inspect retrieval first for missing evidence, then check the answer for unsupported claims. The passages may lack the answer and the generator fills the gap, or retrieval found evidence the labels miss while the generator hallucinates on its own. In the worked example, this row grew from 5 to 16 questions under the open-book prompt. |
| Low | High | Check the labels first. Retrieval may have found passages the labels miss, or the question has too many labeled passages to reach the target in 10 results. |

This split is the reason to keep retrieval and pipeline-output evaluation separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

Place each question in the table, and do not stop at the means, because means hide which questions fail. Sort the questions by their lowest scores and read each answer next to its passages. Two low scores are not verdicts on answer quality. An empty answer from a failed generation call is a pipeline failure, so count it instead of dropping it as a missing score. A decline scores 0 on `answer_relevancy` by definition, so a grounded prompt that often declines scores lower there even when each decline is correct.

## Worked Example: Changing Only the Prompt

To find which component failed, hold one fixed and change the other. This run keeps retrieval fixed on 100 questions and changes only the generator prompt. The grounded prompt tells the generator to answer only from the retrieved passages and to say so when they do not contain the answer. The open-book prompt lets it use its own knowledge as well.

| Metric | Grounded prompt | Open-book prompt |
|---|---|---|
| `recall@10` | 0.668 | 0.668 (same passages) |
| `context_precision` | 0.626 | 0.626 (same passages) |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 (98 questions) |

Higher is better on all four. Both runs reuse the same passages, so `recall@10` and `context_precision` carry over unchanged, and any movement in the answer metrics comes from generation. With targets of 0.5 for `recall@10` and 0.8 for `faithfulness`, High recall, Low faithfulness answers grew from 6 to 18 of 99. These targets are illustrative, so set yours against your own golden set and what your application needs. `answer_relevancy` rose too, but partly because the grounded prompt's declines score 0 on it. This is a single run, so trust the large `faithfulness` shift over the small `answer_relevancy` gain.

{{< island
    path="content/documentation/headless/pipeline-output-quality/prompt-quadrants"
    ratio="712 / 543"
    title="With retrieval fixed, switching to the open-book prompt moves questions into the low-faithfulness row. Each dot is one question."
>}}
![A 2x2 grid of recall@10 against faithfulness, counting 99 questions per prompt. Grounded prompt: 67 High recall and High faithfulness, 6 High recall and Low faithfulness, 21 Low recall and High faithfulness, and 5 Low recall and Low faithfulness. Open-book prompt: 55, 18, 10, and 16.](/docs/pipeline-output-quality-prompt-quadrants.png)
{{< /island >}}

The 2x2 points at generation: the open-book prompt let the generator add claims the passages do not support, so the change to revert is the prompt. Retrieval work would not fix those 12 extra questions, because their passages already met the recall target.

## Building the Golden Set

[Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) covers building a golden set from human annotation, production logs, or LLM synthesis. Each entry needs the question and the IDs of the passages that answer it, stored in the same type as your Qdrant point IDs, because a string label never matches an integer ID and `recall@10` silently scores 0. Reference-based metrics also need a reference answer.

Synthetic questions come without reference answers. You do not need them for `faithfulness` and `answer_relevancy`, which are reference-free. For `context_precision` and correctness metrics, generate them with an LLM that sees only each question's source document. Have it return `NO_ANSWER` when the document cannot answer and drop those rows, or the metric scores retrieval against a reference the document does not support.

Check the source data before you score anything. In <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, 12,220 of the 40,221 corpus rows hold the string `nan` instead of text, and 12,925 relevance labels point at them. Left in, those labels score retrieval against passages with no content. The run on this page drops those rows, those labels, and the 332 questions left with no label.

## Running in CI

If you ship pipeline changes regularly, run this evaluation in CI against a fixed golden set. It catches regressions from prompt edits, model swaps, or chunking changes before they reach production. Set a target per metric and fail the job when a mean falls under it, with a margin under your current baseline, because judge scores move between runs. Before a borderline drop blocks a release, rerun it or compare the two runs question by question on the same golden set, which separates a real regression from judge noise. Score a sample on every change and the full golden set on release candidates, as Cost Scaling explains. Keep the generator prompt in version control, so a prompt change shows up as a reviewable diff next to the score change it caused.

## Pitfalls to Watch For

**Judge bias.** LLM judges show verbosity bias, favoring longer answers even when the content is no better (<a href="https://arxiv.org/abs/2306.05685" target="_blank">Zheng et al., 2023</a>). Calibrate by running a sample of outputs through human raters and comparing. If judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** LLM judges score their own outputs higher than other outputs of equal quality, and that preference grows with how well the model recognizes its own text (<a href="https://arxiv.org/abs/2404.13076" target="_blank">Panickssery et al., 2024</a>). Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts cannot be blamed on a silent upgrade.

**Cost scaling.** With 10 retrieved passages, Ragas makes about 15 judge calls per question: two for `faithfulness`, three for `answer_relevancy`, and one per passage for `context_precision`. A 500-question golden set is about 7,500 judge calls per run, and the number of retrieved passages is the biggest lever. Iterate on a sample of 50 to 100 questions with a cheap judge, and reserve the full sweep for release candidates. The run on this page (100 questions, two prompts) cost about $1.23 in OpenRouter credits for all generator, judge, and embedding calls on October 8, 2026. When you cannot afford a judge call for every question, cheap signals from the retrieval result can flag likely failures first. See [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).

## How We Measured

The run was recorded on October 8, 2026, with 100 questions from <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public subset of the BioASQ Task 11b biomedical question-answering data, repackaged for RAG with a passage corpus, relevance labels, and reference answers. Retrieval used `BAAI/bge-small-en-v1.5` through Qdrant's FastEmbed integration. The generator was `anthropic/claude-haiku-5.5`, and the judge was `openai/gpt-5.4-nano` with `openai/text-embedding-3-small` embeddings, all reached through <a href="https://openrouter.ai/" target="_blank">OpenRouter</a>, on Ragas 0.4.3. One empty generator answer and one judge timeout leave the three judged metrics with 99 scored questions each. A rerun moves these numbers slightly.

## Wrapping Up

Score retrieval and generation separately, pair the scores per question, and you can tell which half of the pipeline a regression came from. To try it on your own data, start from the [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) or <a href="https://githubtocolab.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb" target="_blank">open it in Colab</a>, and replace the corpus, the golden set, and the model IDs in its configuration cell.
