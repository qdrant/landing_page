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

You are building an assistant for a historical archive. You ask who was the first president of the United States. It correctly answers "George Washington," but when you inspect the retrieved passages, none contains that information.

A correct answer can hide a broken pipeline. Did retrieval miss the relevant evidence? Did the assistant fill the gap from its own knowledge? Both can happen, and checking the final answer alone will not reveal either problem.

In retrieval-augmented generation (RAG), retrieval finds passages for a question, and generation uses those passages to write an answer.

This guide shows how to evaluate retrieval and generation separately, identify which component needs attention, and test whether a proposed fix improves the results.

The guide focuses on interpreting results. The [companion notebook](https://github.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) contains the runnable retrieval, generation, and scoring workflow.

To follow the evaluation, you need three things:

1. Golden set: Test questions with labeled relevant passages and, where needed, reference answers. This is our reference for healthy behavior.
2. Pipeline results: What our RAG system actually retrieved and answered for those questions.
3. LLM-as-a-Judge: An evaluator that scores the results and helps identify where things went wrong.

For the full diagnosis, record the IDs of relevant passages for each question and add reference answers for the metrics that need them. Validate both: labels can miss relevant passages, and reference answers can contain errors. See [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for how to construct and validate the labels. The metric choices also cover what you can measure without either kind of reference data.

## Choosing Which Metrics Are Useful

Several frameworks score RAG output with an LLM as the judge, including <a href="https://docs.ragas.io/" target="_blank">Ragas</a> and <a href="https://deepeval.com/" target="_blank">DeepEval</a>. This guide uses Ragas metric names because Ragas ships every judged metric the guide scores. The workflow is the same in another framework or when you call the judge LLM directly.

Four scores cover the two halves of the pipeline. `recall@10` and `context_precision` score retrieval, and `faithfulness` and `answer_relevancy` score the answer:

{{< island
    path="content/documentation/headless/pipeline-output-quality/score-map"
    ratio="712 / 580"
    title="Each line shows a score's main comparison. The judges also use the question."
>}}
![The RAG pipeline runs from the question through Qdrant retrieval to the top 10 passages, then through the generator to the answer. recall@10 compares the passages with the relevance labels, context_precision compares them with the reference answer, faithfulness compares the answer with the passages, and answer_relevancy compares the answer with the question.](/docs/pipeline-output-quality-score-map.png)
{{< /island >}}

- `recall@10`: The share of labeled passages found in the top 10 results. No LLM judge needed. See [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) for the calculation. [ANN recall](/documentation/tutorials-search-engineering/ann-recall/) is a separate check of whether the approximate index matches exact search.
- `context_precision`: An LLM checks which passages support the reference answer and rewards ranking them first. Needs reference answers, but no passage labels.
- `faithfulness`: The share of the answer's claims supported by the retrieved passages. Even correct claims lower the score if the passages do not support them.
- `answer_relevancy`: Does the answer address the question? Off-topic content, evasions, and refusals lower the score.

Supported and relevant does not necessarily mean correct. An answer can faithfully repeat an error in the passages. To evaluate correctness against a reference answer, use a metric such as `FactualCorrectness`.

What you can measure depends on the reference data you have. Given the question, retrieved passages, and generated answer, `faithfulness` and `answer_relevancy` need neither labels nor reference answers. The available reference data determines which other scores you can add:

- **Labels and reference answers:** Adds `recall@10`, `context_precision`, and correctness such as `FactualCorrectness`.
- **Labels only:** Adds `recall@10`.
- **Reference answers only:** Adds `context_precision` and correctness. You can only partly tell which half failed, since the judge cannot check whether retrieval found all the evidence.
- **Neither, for example sampled production traffic:** Adds `ContextPrecisionWithoutReference`, which checks support for the generated answer instead of a reference. Telling which half failed is limited, since this retrieval score depends on the answer.

## Reading the Scores

Reading the scores is as important as choosing the right ones. Collapsing multiple metrics into one end-to-end score might tell you that the pipeline got worse, but not which component caused it. Without separate signals, the next iteration becomes guesswork.

With passage labels, we start with `recall@10` and `faithfulness`: did the evidence arrive, and did the answer stick to it? Without labels, you can inspect answer scores, but you need to label the relevant passages before using this diagnostic map. Select a symptom to see where to inspect. Here, high and low are relative to the target you set for each metric.

Set initial targets from your application's requirements and a sample of answers reviewed by people familiar with the domain. Decide which failures are acceptable, then check whether the targets flag the unacceptable ones. Check that recall targets are reachable: a question with more than 10 labeled passages cannot reach perfect `recall@10`. Repeated baseline runs then establish how much variation to allow when comparing changes; they do not determine what quality is acceptable.

{{< island
    path="content/documentation/headless/pipeline-output-quality/diagnosis"
    ratio="712 / 680"
    title="Trace a symptom through the RAG system"
>}}
![Start with recall@10 and faithfulness. High recall and low faithfulness: compare the unsupported claims with the passages and the prompt, then read the judge verdicts. Low recall and low faithfulness: inspect retrieval for the missing evidence and the setting that lost it, then the answer for unsupported claims. Low recall and high faithfulness: check label coverage and whether the number of labels makes the recall target reachable in 10 results, then retrieval. High recall and high faithfulness: check whether low context_precision means supporting passages rank below irrelevant ones, whether low answer_relevancy means evasive, off-topic, or padded answers, and then correctness against reference answers.](/docs/pipeline-output-quality-diagnosis.svg)
{{< /island >}}

The map suggests an inspection order, rather than a rule for which scores to collect. Measure and report all metrics relevant to your requirements together, even when recall or faithfulness falls short. Scores are clues: inspect individual answers, passages, and judge verdicts before attributing a failure to a component.

## Worked Example: Relaxing the Grounding Prompt

One practical decision is whether to let the generator use outside knowledge to answer more questions. If your application requires every claim to be supported by retrieved passages, keep that grounding requirement. If outside knowledge is acceptable, evaluate correctness and usefulness alongside grounding before choosing a prompt.

To test this choice, hold retrieval fixed and change only the generator prompt. The example uses 100 questions from `rag-mini-bioasq`, a public biomedical dataset with passages, passage relevance labels, and reference answers. We removed passages with missing text and the labels pointing to them before retrieval and scoring. The labels support `recall@10`, and the reference answers support `context_precision`. See [How We Measured](#how-we-measured) for the full setup and scoring coverage.

Run the comparison in the companion notebook, or [open it in Colab](https://githubtocolab.com/qdrant/examples/blob/master/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb).

The grounded prompt requires answers to be supported by the retrieved passages and to say when they are not. The open-book prompt lets the LLM use its own knowledge as well.

This comparison measures grounding and answer relevancy; it does not score correctness against reference answers or measure usefulness directly.

| Metric | Grounded prompt | Open-book prompt |
| --- | --- | --- |
| `recall@10` | 0.668 | 0.668 |
| `context_precision` | 0.626 | 0.626 |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 |

*These are mean scores. Higher means more of the property being measured.*

For the per-question comparison, this worked example calls `recall@10` high at 0.5 or greater and `faithfulness` high at 0.8 or greater. These are illustrative targets; set your own based on your own data.

The retrieval scores are identical because the passages are identical; `context_precision` was not rescored, only carried over, since nothing about retrieval changed. Whatever changed happened after retrieval. `faithfulness` dropped, while `answer_relevancy` rose. This shows reduced grounding and greater responsiveness in this run, but does not establish a change in factual correctness or usefulness. Use the repeat-run checks in [Test the Fix](#test-the-fix) before treating the differences as reliable.

The mean recall and faithfulness scores still clear their illustrative targets in both runs. Yet low-faithfulness answers increased from 11 to 34 of the 99 scored answers per prompt. Averages can hide failures on individual questions. To understand what went wrong, read those answers alongside their retrieved passages and the judge verdicts.

These two illustrative patterns show what to look for when relaxing the prompt. They are possible changes in individual answers, not measured transitions from this run:

| Case | What changes after relaxing the prompt | What it teaches |
| --- | --- | --- |
| High recall, high faithfulness → high recall, low faithfulness | The retrieved evidence stays the same, but the answer introduces unsupported claims. | Finding relevant evidence does not guarantee the generator will use it faithfully. |
| Low recall, high faithfulness → low recall, low faithfulness | A limited, supported answer becomes more expansive, filling gaps with unsupported information. | Generation can make an existing retrieval weakness harder to notice. Retrieval itself did not change. |

Either pattern can produce an answer that addresses the question more directly and scores higher on `answer_relevancy`. For an application that requires passage support, that improvement does not compensate for unsupported claims.

## What to Check Next

In your pipeline, start from the symptom, form a hypothesis, and test it. Inspect individual answers alongside their passages and judge verdicts, using the scores to choose where to look:

| Observation | What to inspect next |
| --- | --- |
| Missing relevant evidence (low `recall@10`) | Retrieved passages, relevance labels, filters, retrieval configuration |
| Supporting passages are absent or rank too low (low `context_precision`) | Passage relevance, ranking, hybrid search fusion, reranking |
| Unsupported claims (low `faithfulness`) | Generator prompt, retrieved passages, individual claims, judge verdicts |
| Answer does not address the question (low `answer_relevancy`) | Prompt instructions, evasions, irrelevant content, appropriate refusals |
| Suspicious or unstable scores | Judge behavior, reference-data quality, failed calls, run-to-run variability |

Before acting, check that the failure is real. An appropriate refusal can score low on `answer_relevancy`. Judges can favor longer answers, certain positions, or their own outputs (see [References](#references)). Use a judge from a different model family than the generator, compare a sample of verdicts with human judgments, and recalibrate the rubric if they disagree.

### Test the Fix

Change one component at a time and rerun the same questions. Check whether the individual failures improve as well as the averages. Keep judge settings fixed during the comparison, and rerun an unchanged configuration to estimate normal variation before treating a small score difference as an improvement. Count failed generator and judge calls separately instead of silently excluding them from the averages.

Start with 50–100 questions and a cheaper judge during iteration, then run the full golden set before release. With three judged metrics and 10 retrieved passages, this Ragas setup makes around 15 judge calls per question before retries. For an initial pass without an LLM judge, see [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).

### Keep Improvements in CI

Once the baseline meets your requirements, run the evaluation in CI against a fixed golden set. Fail the build when a metric's mean drops or its count of below-target questions rises beyond an allowed margin. Set those margins from repeated baseline runs and report failed calls separately. Keep retrieval and generation checks separate.

Version the pipeline configuration, generator prompt, generator and judge models, and judge settings alongside the scores. Update thresholds when requirements change, not because a merge you need fails.

## How We Measured

The run was recorded on October 8, 2026, with 100 questions from <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public subset of the BioASQ Task 11b biomedical question-answering data, repackaged for RAG with a passage corpus, relevance labels, and reference answers. About 30% of its passages contain missing text but are still labeled relevant; we dropped those passages and the labels pointing at them before retrieval and scoring, since an uncleaned corpus mixes data errors with retrieval quality (<a href="https://huggingface.co/datasets/enelpol/rag-mini-bioasq" target="_blank">enelpol/rag-mini-bioasq</a> fills the gaps instead, if you would rather keep every passage). Thirteen of the 100 questions have more than 10 labeled passages and are subject to the recall ceiling described in [Reading the Scores](#reading-the-scores).

Retrieval used `BAAI/bge-small-en-v1.5` locally through Qdrant's FastEmbed integration. The generator was `anthropic/claude-haiku-5.5`, and the judge was `openai/gpt-5.4-nano` with `openai/text-embedding-3-small` embeddings. The generator and judge models were reached through <a href="https://openrouter.ai/" target="_blank">OpenRouter</a>, using Ragas 0.4.3 for scoring.

Each prompt run returned one empty answer, leaving 99 `faithfulness` scores. The grounded run also had one `context_precision` timeout; its 99 scores were carried over to the open-book comparison. `answer_relevancy` covered 99 grounded answers and 98 open-book answers after an additional timeout. The reported means exclude those unscored results; `recall@10` covers all 100 questions.

## References

- [Verbosity and other judge biases](https://arxiv.org/abs/2306.05685).
- [Position bias in pairwise judging](https://aclanthology.org/2025.ijcnlp-long.18/).
- [Effects of judge prompts, rating scales, and models](https://arxiv.org/abs/2610.05094).
- [Central-tendency bias in clinical ordinal scoring](https://arxiv.org/abs/2605.16386).
- [Judge reliability and calibration: a survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC13237853/).
- [Self-recognition and self-preference](https://arxiv.org/abs/2404.13076).
