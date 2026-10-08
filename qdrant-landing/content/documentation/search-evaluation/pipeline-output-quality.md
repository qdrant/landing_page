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

This guide focuses on **pipeline output quality**: whether the full retrieval pipeline produces the right output once retrieved results reach a consumer, most often an LLM generator in a RAG system.

To measure pipeline output quality, you run your golden set through the full pipeline, capture each question with its retrieved context and generated answer, and score them with judgment metrics like faithfulness, answer relevancy, and context precision.

Two related pages cover the other retrieval-evaluation concerns: [Measuring ANN Recall](/documentation/tutorials-search-engineering/ann-recall/) (does the approximate index match exact kNN?) and [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) (do the top-k results match query intent?).

Every code excerpt on this page comes from a [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) that you can follow along with or <a href="https://githubtocolab.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb" target="_blank">open in Colab</a>. It runs the whole evaluation on <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public biomedical question-answering benchmark that ships a passage corpus, relevance labels, and reference answers. It needs one <a href="https://openrouter.ai/" target="_blank">OpenRouter</a> API key.

## Wiring the RAG Pipeline

Several frameworks score RAG output with an LLM as the judge, including <a href="https://docs.ragas.io/" target="_blank">Ragas</a> and <a href="https://docs.confident-ai.com/" target="_blank">DeepEval</a>. This guide uses Ragas because it is the lightest setup for the three metrics it covers. If your team has standardized on a different framework or prefers to call the judge LLM directly, the same workflow applies.

A Ragas metric scores one query at a time. It takes the question, the retrieved passages, and the generated answer, and reference-based metrics also take a reference answer. Getting those inputs takes three steps: prepare the evaluation data, define a grounding prompt, and run retrieval and generation.

**1. Prepare the evaluation data.** Each entry needs a `question`, which is used both to retrieve and to prompt the generator, and `relevant`, the IDs of the passages that answer it. For `context_precision` only, also include a `reference` answer.

Synthetic queries come without reference answers. Skip references if you only score `faithfulness` and `answer_relevancy`, which are reference-free. For `context_precision`, generate them with an LLM that sees only each query's source document. Have it return `NO_ANSWER` when the document cannot answer and drop those rows, or `context_precision` scores retrieval against a reference the document does not support.

```python
# Example of an evaluation-ready entry, in the shape the notebook uses.
{
    "id": "q1",
    "question": "how does X work",
    "reference": "...",  # reference answer; needed for context_precision only
    "relevant": {42, 57},  # IDs of the passages that answer the question
}
```

Different golden-set sources (human annotation, log sampling, or LLM synthesis) produce different raw shapes. Normalize to this structure before running the loop. Check the source data as you normalize it: in rag-mini-bioasq, 12,220 of the 40,221 corpus rows hold the string `nan` instead of text, and 12,925 relevance labels point at them. The notebook drops those rows, those labels, and the 332 questions left with no label.

**2. Define the grounding prompt.** The prompt is the seam between retrieval and generation. Keep it in a versioned string so a prompt change shows up as a reviewable diff:

```python
GROUNDED_PROMPT = """You are answering questions using retrieved source material.

Answer the question below using only the provided context.
If the context does not contain the answer, say so explicitly.
Do not rely on outside knowledge.

Context:
{retrieved_context}

Question:
{query_text}
"""
```

This prompt is a starting point. Tune it for your domain, including answer style, refusal behavior, whether outside knowledge is allowed, and output format.

**3. Run retrieval and generation.** For each question, retrieve the top-k passages from Qdrant, pass them through the generator, and keep the question, passages, answer, and reference together. The notebook indexes the corpus with Qdrant's built-in FastEmbed inference, so `models.Document` embeds the question at query time with the same model used at upload. Record `recall@10` in the same loop, because it is the retrieval score you pair with the answer scores later:

```python
def recall_at_k(retrieved_ids, relevant_ids):
    return len(set(retrieved_ids) & relevant_ids) / len(relevant_ids)


for q in sample:
    points = client.query_points(
        "bioasq",
        query=models.Document(text=q["question"], model=RETRIEVAL_MODEL),
        limit=K,
        with_payload=True,
    ).points
    q["retrieved_contexts"] = [p.payload["text"] for p in points]
    q["recall"] = recall_at_k([p.id for p in points], q["relevant"])
```

Then generate an answer for every question. The notebook reaches the generator through the OpenAI-compatible OpenRouter API and caps concurrency with a semaphore:

```python
import asyncio

from openai import AsyncOpenAI

openrouter = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1", api_key=os.environ["OPENROUTER_API_KEY"], max_retries=5
)
limit = asyncio.Semaphore(MAX_CONCURRENCY)


async def generate(prompt_template, q):
    prompt = prompt_template.format(
        retrieved_context="\n\n".join(q["retrieved_contexts"]), query_text=q["question"]
    )
    async with limit:
        response = await openrouter.chat.completions.create(
            model=GENERATOR_MODEL,
            max_tokens=1024,
            extra_body={"reasoning": {"enabled": False}},
            messages=[{"role": "user", "content": prompt}],
        )
    return response.choices[0].message.content


baseline_answers = await asyncio.gather(*(generate(GROUNDED_PROMPT, q) for q in sample))
```

The generator is capped at 1,024 tokens per answer. If your answers run longer, raise the cap: the judge scores the text as written, truncation included.

## Scoring with Ragas

Three Ragas metrics cover the common failure modes for pipeline output quality:

- `faithfulness` measures how close the answer is to what the retriever returned: the share of its claims those passages support. It drops when the generator hallucinates or answers from training knowledge, right or wrong.
- `answer_relevancy` checks whether the answer addresses the question. It drops when the generator pads, dodges, or drifts off-topic.
- `context_precision` checks whether the passages that support the reference answer rank first. It drops when irrelevant passages outrank them, and it only scores queries with a reference answer.

Create the judge and the metrics, then score each query. The judge comes from a different model family than the generator, because a model judging its own output tends to score it higher. Each metric receives only the fields its `ascore()` method accepts, and a failed judge call becomes a missing value (NaN) that is reported instead of stopping the run:

```python
import pandas as pd
from ragas.embeddings.base import embedding_factory
from ragas.llms import llm_factory
from ragas.metrics.collections import AnswerRelevancy, ContextPrecision, Faithfulness

judge = llm_factory(
    JUDGE_MODEL,
    client=openrouter,
    max_tokens=4096,
    extra_body={"reasoning": {"enabled": False}},  # no thinking mode
)
judge_embeddings = embedding_factory("openai", model=JUDGE_EMBEDDING_MODEL, client=openrouter)

faithfulness = Faithfulness(llm=judge)
answer_relevancy = AnswerRelevancy(llm=judge, embeddings=judge_embeddings)
context_precision = ContextPrecision(llm=judge)


async def score(metric, **fields):
    async with limit:
        try:
            return (await metric.ascore(**fields)).value
        except Exception as error:
            print(f"{metric.name} failed: {type(error).__name__}: {error}")
            return float("nan")


async def score_answers(answers):
    faithfulness_scores = asyncio.gather(*(
        score(faithfulness, user_input=q["question"], response=a, retrieved_contexts=q["retrieved_contexts"])
        for q, a in zip(sample, answers)
    ))
    relevancy_scores = asyncio.gather(*(
        score(answer_relevancy, user_input=q["question"], response=a)
        for q, a in zip(sample, answers)
    ))
    return await faithfulness_scores, await relevancy_scores


async def score_context_precision(q):
    if not q["reference"].strip():
        return float("nan")  # reference-based metric: nothing to score against
    return await score(
        context_precision, user_input=q["question"], reference=q["reference"], retrieved_contexts=q["retrieved_contexts"]
    )


baseline_faithfulness, baseline_relevancy = await score_answers(baseline_answers)
baseline = pd.DataFrame({
    "question": [q["question"] for q in sample],
    "recall@10": [q["recall"] for q in sample],
    "context_precision": await asyncio.gather(*(score_context_precision(q) for q in sample)),
    "faithfulness": baseline_faithfulness,
    "answer_relevancy": baseline_relevancy,
})
baseline.mean(numeric_only=True).round(3)
```

Reference-based metrics such as `context_precision` raise an error on an empty reference, which is why `score_context_precision` skips questions without one.

With the grounded prompt, the notebook's run scored these means. Higher is better on all four:

| Metric              | Grounded prompt |
| ---------------------| -----------------|
| `recall@10`         | 0.668           |
| `context_precision` | 0.626           |
| `faithfulness`      | 0.940           |
| `answer_relevancy`  | 0.698           |

The run was recorded on October 8, 2026, with 100 questions, Ragas 0.4.3, `anthropic/claude-haiku-5.5` as the generator, and `openai/gpt-5.4-nano` as the judge. Both models sample their output. Expect a rerun to move these numbers slightly. One question per metric failed to score and is left out of its mean: the generator returned an empty answer for one question, and one judge call timed out.

Means hide which queries fail. Sort by the lowest scores and read those answers next to their passages:

```python
baseline.nsmallest(10, "faithfulness")
```

### Running in CI

If you ship retrieval changes regularly, this evaluation earns its place in CI. Running it on every change against a fixed golden set catches generator regressions from prompt edits, model swaps, or chunking changes before they reach production. The usual pattern is to set a target threshold per metric and fail the job when any score falls under its threshold.

### Alternatives

**Without a golden set.** `faithfulness` and `answer_relevancy` are reference-free. Swap `context_precision` for `ContextPrecisionWithoutReference`, which judges the retrieved passages against the generated answer instead of a reference. You can then score synthetic queries offline or sampled production traffic live, at the cost of no fixed baseline for regression gating.

## Isolating Retrieval vs Generation

If you also run [retrieval evaluation](/documentation/search-evaluation/retrieval-relevance/) against the same golden set, pairing the two scores on every run gives a diagnostic 2x2 for attributing score changes. When a metric drops after a change (new embedding model, new prompt, or new chunking strategy), the pair tells you which half of the pipeline to investigate.

Pair `recall@10` from the retrieval evaluation with `faithfulness` from the pipeline-output evaluation. In the table, High and Low are relative to the target thresholds you set per metric.

| Recall@10 | Faithfulness | Diagnosis |
|---|---|---|
| High | High | Retrieval found the labeled passages and the answer stays within them. Faithfulness does not measure completeness or correctness, so check answer relevancy and read a sample of answers before you call the change done. |
| High | Low | Generator or prompt problem. Retrieval is surfacing the right context, and something downstream (prompt, model, or temperature) is misusing it. |
| Low | Low | Fix retrieval first. When the retrieved passages lack the answer, the generator tends to fill the gap from its own knowledge, which lowers faithfulness. |
| Low | High | Check the labels and the answers before you blame retrieval. Retrieval may have found useful passages the labels do not cover. A question with more relevant passages than k cannot reach a `recall@10` of 1.0. A generator that declined to answer makes no claims, so it has nothing to fail on. |

### Worked Example: Changing Only the Prompt

To find which component failed, hold one fixed and change the other. The companion notebook keeps retrieval fixed and reruns generation with a prompt that allows outside knowledge:

```python
OPEN_BOOK_PROMPT = """Answer the question below. The context may help, and you may also use your own knowledge.

Context:
{retrieved_context}

Question:
{query_text}
"""
```

| Metric | Grounded prompt | Open-book prompt |
|---|---|---|
| `recall@10` | 0.668 | 0.668 |
| `context_precision` | 0.626 | 0.626 |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 |

The retrieval scores, `recall@10` and `context_precision`, did not move, so the faithfulness drop comes from generation. Per query, the High recall, Low faithfulness quadrant grew from 6 to 18 of the 99 scored questions, with targets of 0.5 for `recall@10` and 0.8 for `faithfulness`. Answer relevancy rose at the same time, so a team tracking only answer relevancy would have shipped this prompt as an improvement.

This split is the reason to keep retrieval and pipeline-output evaluation separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

## Non-RAG Use Cases

Ragas metrics assume the consumer is an LLM generator. If retrieval feeds something else (a ranker, a recommendation surface, an agent, a search UI), swap the metrics to match: click-through rate or dwell time for a UI, graded rubrics for a ranker, task-completion rate for an agent. The method stays the same: freeze the consumer, run the golden set through the full pipeline, score the end-to-end output. Only the metric changes.

## Pitfalls to Watch For

**Judge bias.** LLM judges reward verbose, confident, or well-formatted answers even when the underlying claim is weaker. Calibrate by running a sample of outputs through human raters and comparing. If judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** Using the same model to generate and to judge inflates scores because the judge recognizes and rewards its own output style. Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts cannot be blamed on a silent upgrade.

**Cost scaling.** LLM-as-judge cost grows with queries times metrics times judge calls per metric, and Ragas makes multiple judge calls per sample. A 500-query golden set with three metrics runs into the thousands of judge-model calls per run. Sample 50 to 100 queries with a cheap judge during iteration, and reserve the full sweep for release candidates. The companion notebook's full run (100 questions, two prompts, `openai/gpt-5.4-nano` as the judge) cost about $1.23 in OpenRouter credits on October 8, 2026. When you cannot afford a judge call for every query, cheap signals from the retrieval result can flag likely failures first. See [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).

## Wrapping Up

Score retrieval and generation separately, pair the scores per query, and you can tell which half of the pipeline a regression came from. To try it on your own data, start from the [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) and replace the corpus, the golden set, and the model IDs in its configuration cell.
