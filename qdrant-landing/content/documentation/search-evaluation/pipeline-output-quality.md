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

To measure it, you run a golden set, a fixed list of test questions with known good results, through the full pipeline. You record each question's retrieved passages and generated answer, and a second LLM, the judge, scores them.

Two related pages cover the other retrieval-evaluation concerns: [Measuring ANN Recall](/documentation/tutorials-search-engineering/ann-recall/) (does the approximate nearest neighbor index return the same results as exact search?) and [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/) (do the top-k results match query intent?).

Every code excerpt on this page comes from a [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) that you can follow along with or <a href="https://githubtocolab.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb" target="_blank">open in Colab</a>. It runs the whole evaluation on <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, a public subset of the BioASQ Task 11b biomedical question-answering data, repackaged for RAG with a passage corpus, relevance labels, and reference answers. It needs one <a href="https://openrouter.ai/" target="_blank">OpenRouter</a> API key.

The excerpts reuse names from earlier notebook cells: `client` (a `QdrantClient` with a `bioasq` collection), `models` (`qdrant_client.models`), `sample` (the evaluation entries), `K` (10), `MAX_CONCURRENCY`, and the model IDs. They use top-level `await`, which runs in Jupyter. In a script, run them inside one `asyncio.run(main())`.

## Choosing What to Score

What you can measure depends on what your golden set contains. Relevance labels are the IDs of the passages that answer each question, and they are the ground truth for retrieval. Reference answers are the correct answers written out as text, and they are the ground truth for the answer itself. Neither is perfect: labels miss passages, and a reference answer is only as good as whoever wrote it.

| Your golden set has | Retrieval scores | Answer scores | Can you tell which half failed? |
|---|---|---|---|
| Labels and reference answers | `recall@10`, `context_precision` | `faithfulness`, `answer_relevancy`, correctness such as `FactualCorrectness` | Yes |
| Labels only | `recall@10` | `faithfulness`, `answer_relevancy` | Yes |
| Reference answers only | `context_precision` | `faithfulness`, `answer_relevancy`, correctness | Yes, pair `context_precision` with `faithfulness` |
| Neither, for example sampled production traffic | `ContextPrecisionWithoutReference`, which depends on the answer | `faithfulness`, `answer_relevancy` | No |

<a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a> ships both, so the notebook uses the first row. If retrieval feeds something other than an LLM, such as a ranker, a search UI, or an agent, Ragas metrics do not fit. Score the end-to-end output with a task metric instead, such as normalized discounted cumulative gain (NDCG) for a ranker, click-through rate for a UI, or task-completion rate for an agent, and keep the same method: hold one component fixed and change the other.

## Wiring the RAG Pipeline

Several frameworks score RAG output with an LLM as the judge, including <a href="https://docs.ragas.io/" target="_blank">Ragas</a> and <a href="https://deepeval.com/" target="_blank">DeepEval</a>. This guide uses Ragas because it ships all three metrics the guide scores. If your team has standardized on a different framework or prefers to call the judge LLM directly, the same workflow applies.

A Ragas metric scores one question at a time. It takes the question, the retrieved passages, and the generated answer, and reference-based metrics also take a reference answer. Getting those inputs takes three steps: prepare the evaluation data, define a grounding prompt, and run retrieval and generation.

**1. Prepare the evaluation data.** Each entry needs a `question`, which is used both to retrieve and to prompt the generator, and `relevant`, the set of IDs of the passages that answer it, in the same type as your Qdrant point IDs. For `context_precision` only, also include a `reference` answer.

Synthetic questions come without reference answers. Skip references if you only score `faithfulness` and `answer_relevancy`, which are reference-free. For `context_precision`, generate them with an LLM that sees only each question's source document. Have it return `NO_ANSWER` when the document cannot answer and drop those rows, or `context_precision` scores retrieval against a reference the document does not support.

```python
# Example of an evaluation-ready entry, in the shape the notebook uses.
{
    "id": "q1",
    "question": "how does X work",
    "reference": "...",  # reference answer; needed for context_precision only
    "relevant": {42, 57},  # a set of point IDs for the passages that answer the question
}
```

Different golden-set sources (human annotation, log sampling, or LLM synthesis) produce different raw shapes. Normalize to this structure before step 3. Check the source data as you normalize it: in <a href="https://huggingface.co/datasets/rag-datasets/rag-mini-bioasq" target="_blank">rag-mini-bioasq</a>, 12,220 of the 40,221 corpus rows hold the string `nan` instead of text, and 12,925 relevance labels point at them. The notebook drops those rows, those labels, and the 332 questions left with no label.

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

**3. Run retrieval and generation.** For each question, retrieve the top 10 passages from Qdrant, pass them through the generator, and keep the question, passages, answer, and reference together. The notebook uses Qdrant's built-in FastEmbed integration, which embeds each `models.Document` locally at upload and again at query time, so pass the same model name in both places. Record `recall@10` in the same loop, because it is the retrieval score you pair with the answer scores later:

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
import os

from openai import AsyncOpenAI

openrouter = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
    max_retries=5,
    timeout=60,
)
limit = asyncio.Semaphore(MAX_CONCURRENCY)


async def generate(prompt_template, q):
    prompt = prompt_template.format(
        retrieved_context="\n\n".join(q["retrieved_contexts"]), query_text=q["question"]
    )
    async with limit:
        try:
            response = await openrouter.chat.completions.create(
                model=GENERATOR_MODEL,
                max_tokens=1024,
                extra_body={"reasoning": {"enabled": False}},
                messages=[{"role": "user", "content": prompt}],
            )
        except Exception as error:
            print(f"generation failed: {type(error).__name__}: {error}")
            return ""  # an empty answer is scored as a pipeline failure
    return response.choices[0].message.content or ""


baseline_answers = await asyncio.gather(*(generate(GROUNDED_PROMPT, q) for q in sample))
```

A failed generation returns an empty answer instead of stopping the batch. The generator is capped at 1,024 tokens per answer, and the judge scores the text as written, so raise the cap if your answers run longer. `extra_body` turns off reasoning on OpenRouter; drop it for other providers.

## Scoring with Ragas

Two Ragas metrics score the answer, and one scores retrieval:

- `faithfulness` measures how close the answer is to what the retriever returned: the share of its claims those passages support. It drops when the generator hallucinates or answers from training knowledge, even when that knowledge is correct.
- `answer_relevancy` checks whether the answer addresses the question: the judge writes questions from the answer and compares their embeddings with the original question. It drops when the generator pads, dodges, or drifts off-topic, and scores 0 for a noncommittal answer such as "the context does not contain the answer".
- `context_precision` scores retrieval with an LLM judge: it checks whether the passages that support the reference answer rank first. It drops when irrelevant passages outrank them, and it only scores questions with a reference answer.

Create the judge and the metrics, then score each question. The judge comes from a different model family than the generator. Each metric receives only the fields its `ascore()` method accepts, and any scoring error, including an empty generator answer, becomes a printed NaN instead of stopping the run. Count those NaNs: an empty answer is a pipeline failure, not a missing score.

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
    if not (q.get("reference") or "").strip():
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

Reference-based metrics such as `context_precision` raise an error on an empty reference, so `score_context_precision` skips questions without one.

With the grounded prompt, the notebook's run scored these means. Higher is better on all four:

| Metric | Grounded prompt |
|---|---|
| `recall@10` | 0.668 |
| `context_precision` | 0.626 |
| `faithfulness` | 0.940 |
| `answer_relevancy` | 0.698 |

The run was recorded on October 8, 2026, with 100 questions. It used `BAAI/bge-small-en-v1.5` for retrieval, `anthropic/claude-haiku-5.5` as the generator, and `openai/gpt-5.4-nano` with `openai/text-embedding-3-small` embeddings as the judge, on Ragas 0.4.3. Pin `langchain-community==0.4.1` alongside Ragas: version 0.4.2 breaks `import ragas`. A rerun moves these numbers slightly. One empty generator answer and one judge timeout leave the three judged metrics with 99 scored questions each.

Means hide which questions fail. Sort by the lowest scores, then read each answer next to its passages: row `i` matches `baseline_answers[i]` and `sample[i]["retrieved_contexts"]`.

```python
baseline.nsmallest(10, "faithfulness")
```

## Isolating Retrieval vs Generation

Step 3 already recorded `recall@10`, the retrieval score from [Measuring Retrieval Relevance](/documentation/search-evaluation/retrieval-relevance/), so every question has a retrieval score next to its answer scores. Pairing the two gives a diagnostic 2x2 for attributing score changes. When a metric drops after a change (new embedding model, new prompt, or new chunking strategy), the pair tells you which half of the pipeline to investigate.

Pair `recall@10` with `faithfulness`. In the table, High and Low are relative to the target you set for each metric.

| `recall@10` | `faithfulness` | Diagnosis |
|---|---|---|
| High | High | Retrieval met its target and the answer stays within the passages. `faithfulness` does not check correctness, so score against the reference answers with `FactualCorrectness` and read a sample before you ship. |
| High | Low | Generator, prompt, or judge problem. Retrieval surfaced the right passages, so read the `faithfulness` verdicts: either the answer adds unsupported claims, or the judge rejected a valid answer that combines several passages. |
| Low | Low | Fix retrieval first. The passages may lack the answer, and a generator allowed to use its own knowledge fills the gap. In the notebook, this row grew from 5 to 16 questions under the open-book prompt. |
| Low | High | Check the labels first. Retrieval may have found passages the labels miss, or the question has too many labeled passages to reach the target in 10 results. |

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
| `recall@10` | 0.668 | 0.668 (same passages) |
| `context_precision` | 0.626 | 0.626 (same passages) |
| `faithfulness` | 0.940 | 0.830 |
| `answer_relevancy` | 0.698 | 0.759 (98 questions) |

Both runs reuse the same passages, so `recall@10` and `context_precision` carry over unchanged, and any movement in the answer metrics comes from generation. With targets of 0.5 for `recall@10` and 0.8 for `faithfulness`, High recall, Low faithfulness answers grew from 6 to 18 of 99. `answer_relevancy` rose too, but partly because the grounded prompt's declines score 0 on it. This is a single run, so trust the large `faithfulness` shift over the small `answer_relevancy` gain.

This split is the reason to keep retrieval and pipeline-output evaluation separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

## Running in CI

If you ship pipeline changes regularly, run this evaluation in CI against a fixed golden set. It catches regressions from prompt edits, model swaps, or chunking changes before they reach production. Set a target per metric and fail the job when a mean falls under it, with a margin under your current baseline, because judge scores move between runs. Score a sample on every change and the full golden set on release candidates, as Cost Scaling explains.

## Pitfalls to Watch For

**Judge bias.** LLM judges show verbosity bias, favoring longer answers even when the content is no better (<a href="https://arxiv.org/abs/2306.05685" target="_blank">Zheng et al., 2023</a>). Calibrate by running a sample of outputs through human raters and comparing. If judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** LLM judges score their own outputs higher than other outputs of equal quality, and that preference grows with how well the model recognizes its own text (<a href="https://arxiv.org/abs/2404.13076" target="_blank">Panickssery et al., 2024</a>). Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts cannot be blamed on a silent upgrade.

**Cost scaling.** With 10 retrieved passages, Ragas makes about 15 judge calls per question: two for `faithfulness`, three for `answer_relevancy`, and one per passage for `context_precision`. A 500-question golden set is about 7,500 judge calls per run, and the number of retrieved passages is the biggest lever. Iterate on a sample of 50 to 100 questions with a cheap judge, and reserve the full sweep for release candidates. The companion notebook's run (100 questions, two prompts) cost about $1.23 in OpenRouter credits for all generator, judge, and embedding calls on October 8, 2026. When you cannot afford a judge call for every question, cheap signals from the retrieval result can flag likely failures first. See [Predicting Weak Retrieval Without an LLM](/articles/predicting-weak-retrieval/).

## Wrapping Up

Score retrieval and generation separately, pair the scores per question, and you can tell which half of the pipeline a regression came from. To try it on your own data, start from the [companion notebook](https://github.com/qdrant/examples/blob/andrei/rag-pipeline-evaluation/rag-pipeline-evaluation/rag_pipeline_evaluation.ipynb) and replace the corpus, the golden set, and the model IDs in its configuration cell.
