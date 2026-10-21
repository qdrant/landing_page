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

Imagine you are the doctor of a well-known patient: a RAG pipeline. The worst thing you can do is start the treatment right away. A treatment (for software, a solution) cannot be created without a diagnosis, and RAG systems have been around long enough that standardized approaches exist for it.

To find which component of the system is not working as intended (maybe every component), we need:

1. Golden set: A collection of test questions with known correct answers, which is our reference for healthy behavior.
2. Pipeline results: What our RAG system actually retrieved and answered for those questions.
3. LLM-as-a-Judge: An evaluator that scores the results and helps identify where things went wrong.

Keeping with the medical analogy, the numbers come from a public biomedical dataset, described in [How We Measured](#how-we-measured).

Two related pages cover the other retrieval-evaluation concerns:

- [Measuring ANN Recall](/documentation/tutorials-search-engineering/ann-recall/): does the approximate nearest neighbor index return the same results as exact search?
- [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/): do the top-k results match query intent?

## Choosing Which Metrics Are Useful

Several frameworks score RAG output with an LLM as the judge, including <a href="https://docs.ragas.io/" target="_blank">Ragas</a> and <a href="https://deepeval.com/" target="_blank">DeepEval</a>. This guide uses Ragas metric names because Ragas ships every judged metric the guide scores. The workflow is the same in another framework or when you call the judge LLM directly.

Four scores cover the two halves of the pipeline. `recall@10` and `context_precision` score retrieval, and `faithfulness` and `answer_relevancy` score the answer:

{{< island
    path="content/documentation/headless/pipeline-output-quality/score-map"
    ratio="712 / 580"
    title="Retrieval scores compare the retrieved passages with the golden set. Answer scores compare the answer with the passages and the question."
>}}
![The RAG pipeline runs from the question through Qdrant retrieval to the top 10 passages, then through the generator to the answer. recall@10 compares the passages with the relevance labels, context_precision compares them with the reference answer, faithfulness compares the answer with the passages, and answer_relevancy compares the answer with the question.](/docs/pipeline-output-quality-score-map.png)
{{< /island >}}

<details>
<summary>Metric definitions</summary>

- `recall@10`: The share of labeled passages found in the top 10 results. No LLM judge needed. See [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for the calculation.
- `context_precision`: An LLM checks which passages support the reference answer and rewards ranking them first. Needs reference answers, but no passage labels.
- `faithfulness`: The share of the answer's claims supported by the retrieved passages. Even correct claims lower the score if the passages do not support them.
- `answer_relevancy`: Does the answer address the question? Off-topic content, evasions, and refusals lower the score.

</details>

Supported and relevant does not necessarily mean correct. An answer can faithfully repeat an error in the passages. To evaluate correctness against a reference answer, use a metric such as `FactualCorrectness`.

What you can measure depends on what your golden set contains.

- Relevance labels are the IDs of the passages that answer each question, and they are the ground truth for retrieval.
- Reference answers are the correct answers written out as text, and they are the ground truth for the answer itself.

Neither is perfect: labels miss passages, and a reference answer is only as good as whoever wrote it.

| Your golden set has | Retrieval scores | Answer scores | How well you can tell which half failed |
| --- | --- | --- | --- |
| Labels and reference answers | `recall@10`, `context_precision` | `faithfulness`, `answer_relevancy`, correctness such as `FactualCorrectness` | Strong |
| Labels only | `recall@10` | `faithfulness`, `answer_relevancy` | Strong |
| Reference answers only | `context_precision` | `faithfulness`, `answer_relevancy`, correctness | Partial: the judge cannot check whether the retrieval found all the evidence |
| Neither, for example sampled production traffic | `ContextPrecisionWithoutReference`, which depends on the answer | `faithfulness`, `answer_relevancy` | Limited: the retrieval score depends on the answer |

Ragas evaluation is meant for RAG systems. For other systems, score the end-to-end output with a task metric instead, such as normalized discounted cumulative gain (NDCG) for a ranker, click-through rate for a UI, or task-completion rate for an agent, and keep the same method: hold one component fixed and change the other.

## Reading the Scores

Reading the scores is as important as choosing the right ones. A diagnosis map connects symptoms to the components worth inspecting.

Select a symptom to trace where to inspect, from retrieval and generation to the labels and judge. High and Low are relative to the target you set for each metric.

{{< island
    path="content/documentation/headless/pipeline-output-quality/diagnosis"
    ratio="712 / 680"
    title="Trace a symptom through the RAG system. Numbered checkpoints suggest where to inspect; they do not prove which component failed."
>}}
![Low recall and high faithfulness: check label coverage and whether the number of labels makes the recall target reachable in 10 results. High recall and high faithfulness: check correctness against reference answers. Low recall and low faithfulness: inspect retrieval for missing evidence, then the answer for unsupported claims. High recall and low faithfulness: inspect the answer, prompt, and judge verdicts.](/docs/pipeline-output-quality-diagnosis.svg)
{{< /island >}}

Collapsing the four scores into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

This analysis can fail when your RAG system is more complicated than a two-component architecture. Some tips:

1. Do not trust averages alone. They hide individual failures.
2. Do not treat metrics as definitive diagnoses. Two low scores do not necessarily mean the answer is bad.
3. Do not ignore failed calls. They are failures of the pipeline, not missing data.
4. Do not misinterpret refusals. A correct refusal can receive a low answer-relevancy score.

## Worked Example: Diagnostics in Reverse

To find which component failed, hold one fixed and change the other. Here we keep retrieval fixed on 100 questions and change the generator prompt.

The grounded prompt requires answers to be supported by the retrieved passages and to say when they are not. The open-book prompt lets the LLM use its own knowledge as well.

| Metric | Grounded prompt | Open-book prompt |
| --- | --- | --- |
| `recall@10` | 0.668 | 0.668 (same passages) |
| `context_precision` | 0.626 | 0.626 (same passages) |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 (98 questions) |

*Higher is better on all four.*

Both runs end up with similar results, but `faithfulness` declined on average. Following our own advice, we look at the 2x2 matrix, which shows more answers with high recall and low faithfulness. This is a single run, so trust the large `faithfulness` shift over the small `answer_relevancy` gain. For better results, use several runs and confidence intervals to see what is statistically significant.

{{< island
    path="content/documentation/headless/pipeline-output-quality/prompt-quadrants"
    ratio="712 / 480"
    title="With retrieval fixed, low-faithfulness answers rise from 11 to 34 of 99 (+23). Counts compare Grounded → Open-book; dots show the selected prompt."
>}}
![A 2x2 grid of recall@10 against faithfulness, counting 99 questions per prompt. Grounded prompt: 67 High recall and High faithfulness, 6 High recall and Low faithfulness, 21 Low recall and High faithfulness, and 5 Low recall and Low faithfulness. Open-book prompt: 55, 18, 10, and 16. Low faithfulness grows from 11 to 34 of 99 (+23), including High recall and Low faithfulness from 6 to 18 (+12).](/docs/pipeline-output-quality-prompt-quadrants.png)
{{< /island >}}

The 2x2 points at generation, which of course it would: the open-book prompt let the generator add claims the passages do not support. Retrieval work would not fix unanswered questions, because their passages already met the recall target.

In your setup, the process runs in reverse: you get results, try a new hypothesis, look at the answers, and try again.

## Running in CI

Once the baseline works as intended, lock in that progress so new features do not quietly add new issues.

Treat evaluation as an input for continuous integration (CI) against a fixed golden set (see [Building the Golden Set](#building-the-golden-set)). It catches regressions from prompt edits, model swaps, or chunking changes before they reach production.

Set a target per metric and fail the job when a mean falls under it, with a margin under your current baseline. Choose the margin from how much each metric drifts between identical runs. Keep the generator prompt in version control, so a prompt change shows up as a reviewable diff next to the score change it caused.

Treat retrieval and generation independently. Update the evaluation when the technical requirements change, not when the latest merge fails on a particularly important feature.

## Building the Golden Set

Your golden set should contain questions, relevant passage IDs, and reference answers when required. See [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for how to build one.

Not every metric needs reference answers, but those that do require answers supported by the source documents.

Check your data before trusting the scores. In <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, thousands of passages contain missing text but are still labeled relevant. Without cleaning them, your evaluation measures data errors instead of retrieval quality.

## Pitfalls to Watch For

**Judge bias.** LLM judges can favor [longer answers](https://arxiv.org/abs/2306.05685), prefer [certain answer positions](https://aclanthology.org/2025.ijcnlp-long.18/), or show [scoring bias](https://arxiv.org/abs/2610.05094), systematically scoring too high, too low, or [toward the middle](https://arxiv.org/abs/2605.16386). A good solution is to compare their scores against human evaluations, then refine the rubric or calibrate the judge using human feedback. This can be an [iterative process](https://pmc.ncbi.nlm.nih.gov/articles/PMC13237853/) as new disagreements emerge.

**Self-judging contamination.** You do not want to trust yourself to judge your own work. LLM judges have the same problem: they score their own outputs higher than other outputs of equal quality, and that preference grows with how well the model recognizes its own text (<a href="https://arxiv.org/abs/2404.13076" target="_blank">Panickssery et al., 2024</a>). Pick a different model family for the judge than for the generator (preferably even a different vendor), and record both versions in every run so score shifts cannot be blamed on a silent upgrade.

**Cost scaling.** LLM-based evaluation can be expensive: with 10 retrieved passages, Ragas makes around 15 judge calls per question. Start with 50–100 questions and a cheaper judge, then run the full golden set before releases. You can also use simpler retrieval signals to identify likely failures without an LLM. See [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).

## How We Measured

The run was recorded on October 8, 2026, with 100 questions from <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public subset of the BioASQ Task 11b biomedical question-answering data, repackaged for RAG with a passage corpus, relevance labels, and reference answers. Retrieval used `BAAI/bge-small-en-v1.5` through Qdrant's FastEmbed integration. The generator was `anthropic/claude-haiku-5.5`, and the judge was `openai/gpt-5.4-nano` with `openai/text-embedding-3-small` embeddings, all reached through <a href="https://openrouter.ai/" target="_blank">OpenRouter</a>, on Ragas 0.4.3. One empty generator answer and one judge timeout leave the three judged metrics with 99 scored questions each. A rerun moves these numbers slightly.

## Wrapping Up

Evaluation helps identify failing components, but a diagnosis is only a hypothesis until you have tested the fix.

Try it with your own data using the [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) or [open it in Colab](https://githubtocolab.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb).
