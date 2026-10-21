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

> **Note:** Build your golden set first: questions, the IDs of the passages that answer each one, and, for the metrics that need them, reference answers. Quality matters as much as coverage: relevance labels miss passages, and a reference answer is only as good as whoever wrote it. See [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for how to construct and validate one.

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
    title="Each score compares only the two artifacts it reads."
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

What you can measure depends on what your golden set contains. `faithfulness` and `answer_relevancy` need neither labels nor reference answers, so you can always score the answer. The rest decides which other scores you get:

- **Labels and reference answers:** Supports `recall@10`, `context_precision`, and correctness such as `FactualCorrectness`.
- **Labels only:** Supports `recall@10`.
- **Reference answers only:** Supports `context_precision` and correctness. You can only partly tell which half failed, since the judge cannot check whether retrieval found all the evidence.
- **Neither, for example sampled production traffic:** Supports only `ContextPrecisionWithoutReference`. Telling which half failed is limited, since this retrieval score depends on the answer.

## Reading the Scores

Reading the scores is as important as choosing the right ones. Collapsing multiple metrics into one end-to-end score might tell you that the pipeline got worse, but not which component caused it. Without separate signals, the next iteration becomes guesswork.

This is why we start with recall@10 and faithfulness: did the evidence arrive, and did the answer stick to it? Select a symptom to see where to inspect. Here, high and low are relative to the target you set for each metric.

{{< island
    path="content/documentation/headless/pipeline-output-quality/diagnosis"
    ratio="712 / 680"
    title="Trace a symptom through the RAG system"
>}}
![Start with recall@10 and faithfulness. High recall and low faithfulness: compare the unsupported claims with the passages and the prompt, then read the judge verdicts. Low recall and low faithfulness: inspect retrieval for the missing evidence and the setting that lost it, then the answer for unsupported claims. Low recall and high faithfulness: check label coverage and whether the number of labels makes the recall target reachable in 10 results, then retrieval. High recall and high faithfulness: check whether low context_precision means supporting passages rank below irrelevant ones, whether low answer_relevancy means evasive, off-topic, or padded answers, and then correctness against reference answers.](/docs/pipeline-output-quality-diagnosis.svg)
{{< /island >}}

Once both scores meet their targets (both are high), the map moves on to `context_precision`, `answer_relevancy`, and correctness. Context precision refines the retrieval check by asking whether supporting passages rank first, while answer relevancy and correctness check whether the final answer addresses the question and is factually correct. Treat them as a final quality check, and go back if the results are not good enough.

This analysis can fail when your RAG system is more complicated than a two-component architecture. Some tips:

1. Do not trust averages alone. They hide individual failures.
2. Do not treat metrics as definitive diagnoses. Two low scores do not necessarily mean the answer is bad.

## Worked Example: Diagnostics in Reverse

To find which component failed, hold one fixed and change the other. Here we run the diagnosis in reverse: we plant a cause, then check whether the scores lead back to it. Retrieval stays fixed on 100 questions, and only the generator prompt changes.

The grounded prompt requires answers to be supported by the retrieved passages and to say when they are not. The open-book prompt lets the LLM use its own knowledge as well. Read the results as if you did not know which one changed.

| Metric | Grounded prompt | Open-book prompt |
| --- | --- | --- |
| `recall@10` | 0.668 | 0.668 |
| `context_precision` | 0.626 | 0.626 |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 |

*Higher is better on all four. The open-book `answer_relevancy` covers 98 questions after one more judge timeout.*

The retrieval scores are identical because the passages are identical, so whatever changed happened after retrieval. `faithfulness` dropped from 0.940 to 0.830, while `answer_relevancy` rose slightly. This is a single run, so trust the large `faithfulness` shift over the small `answer_relevancy` gain. For better results, use several runs and confidence intervals to see what is statistically significant.

The average tells us `faithfulness` declined, but not how many questions were affected or where the failures landed. Following our own advice, we group the same 99 questions by recall and faithfulness to find where the new problems appeared:

{{< island
    path="content/documentation/headless/pipeline-output-quality/prompt-quadrants"
    ratio="712 / 480"
    title="With retrieval fixed, low-faithfulness answers rise from 11 to 34 of 99 (+23). Counts compare Grounded → Open-book; dots show the selected prompt."
>}}
![A 2x2 grid of recall@10 against faithfulness, counting 99 questions per prompt. Grounded prompt: 67 High recall and High faithfulness, 6 High recall and Low faithfulness, 21 Low recall and High faithfulness, and 5 Low recall and Low faithfulness. Open-book prompt: 55, 18, 10, and 16. Low faithfulness grows from 11 to 34 of 99 (+23), including High recall and Low faithfulness from 6 to 18 (+12).](/docs/pipeline-output-quality-prompt-quadrants.png)
{{< /island >}}

Among high-recall questions, where retrieval found the right passages, low-faithfulness answers tripled from 6 to 18: these are the questions worth inspecting first, comparing their generated claims against the retrieved passages and the generator prompt. **The problem traces to generation, not retrieval:** the open-book prompt, as expected, let the LLM draw on its own knowledge instead of the provided evidence.

Since retrieval was identical in both runs, it cannot explain the difference. But it can still improve: `recall@10` of 0.668 means some relevant evidence remains missing.

In your setup, nobody plants the cause: you start from the symptom, form a hypothesis, test the fix, and measure again.

## Running in CI

Once the baseline works as intended, lock it in: run the evaluation in CI against a fixed golden set, and fail the build when a metric's mean drops below your baseline by more than its run-to-run drift. Keep the generator prompt and model versions in version control, so a change shows up as a diff next to the score it caused. Treat retrieval and generation independently, and update the thresholds when requirements change, not because a merge you need fails.

## Before You Trust the Scores

- **Judge bias.** Judges can skew toward longer answers, certain positions, or systematic scoring bias (see [References](#references)). Compare a sample against human judgments, and recalibrate the rubric if they disagree.
- **Self-judging contamination.** A judge tends to score its own model family's outputs higher. Use a judge from a different model family than the generator, ideally a different vendor, and record both versions in every run.
- **Failed calls.** A dropped judge or generator call is a pipeline failure, not missing data. Count and report failures instead of silently excluding them from the average.
- **Refusals.** A correct refusal can still score low on `answer_relevancy`. Check whether a low score is an evasion or an appropriate refusal before treating it as a failure.
- **Evaluation cost.** With 10 retrieved passages, Ragas makes around 15 judge calls per question. Start with 50–100 questions and a cheaper judge, then run the full golden set before release. For an initial pass without an LLM judge, see [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).
- **Score stability.** Both the generator and the judge sample their output, so a rerun shifts the numbers. Rerun identical configurations to see how much a score moves before treating a small difference as real.

## How We Measured

The run was recorded on October 8, 2026, with 100 questions from <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public subset of the BioASQ Task 11b biomedical question-answering data, repackaged for RAG with a passage corpus, relevance labels, and reference answers. Thousands of its passages contain missing text but are still labeled relevant; we dropped those passages and the labels pointing at them before scoring, since an uncleaned corpus measures data errors instead of retrieval quality. Retrieval used `BAAI/bge-small-en-v1.5` through Qdrant's FastEmbed integration. The generator was `anthropic/claude-haiku-5.5`, and the judge was `openai/gpt-5.4-nano` with `openai/text-embedding-3-small` embeddings, all reached through <a href="https://openrouter.ai/" target="_blank">OpenRouter</a>, on Ragas 0.4.3. One empty generator answer and one judge timeout leave the three judged metrics with 99 scored questions each. A rerun moves these numbers slightly.

## What to Check Next

However you got there, each symptom points to a specific place to inspect:

| Observation | What to inspect next |
| --- | --- |
| Missing relevant evidence (low `recall@10`) | Retrieved passages, relevance labels, filters, retrieval configuration |
| Supporting passages rank too low (low `context_precision`) | Ranking, hybrid search fusion, reranking |
| Unsupported claims (low `faithfulness`) | Generator prompt, retrieved passages, individual claims, judge verdicts |
| Answer does not address the question (low `answer_relevancy`) | Prompt instructions, evasions, irrelevant content, appropriate refusals |
| Suspicious or unstable scores | Judge behavior, reference-data quality, failed calls, run-to-run variability |

## Wrapping Up

Evaluation helps identify failing components, but a diagnosis is only a hypothesis until you have tested the fix.

Try it with your own data using the [companion notebook](https://github.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) or [open it in Colab](https://githubtocolab.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb).

## References

- LLM judges can favor [longer answers](https://arxiv.org/abs/2306.05685), prefer [certain answer positions](https://aclanthology.org/2025.ijcnlp-long.18/), or show [scoring bias](https://arxiv.org/abs/2610.05094), systematically scoring too high, too low, or [toward the middle](https://arxiv.org/abs/2605.16386). Calibrating the rubric against human feedback can be an [iterative process](https://pmc.ncbi.nlm.nih.gov/articles/PMC13237853/) as new disagreements emerge.
- Judges score their own outputs higher than other outputs of equal quality, and that preference grows with how well the model recognizes its own text (<a href="https://arxiv.org/abs/2404.13076" target="_blank">Panickssery et al., 2024</a>).
