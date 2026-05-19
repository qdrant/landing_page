---
title: Evaluating Pipeline Output Quality
weight: 7
aliases:
  - /documentation/tutorials/retrieval-quality-pipeline-output/
partition: ecosystem
---

# Evaluating Pipeline Output Quality

| Time: 45 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial focuses on **pipeline output quality**: whether the full retrieval pipeline produces the right output once retrieved results reach a consumer, most often an LLM generator in a RAG system.
To measure pipeline output quality, you run your golden set through the full pipeline, capture each `(question, retrieved_context, answer)` triple, and score the triples against judgment metrics like faithfulness, answer relevancy, and context precision.

Two related tutorials cover the other retrieval-evaluation concerns: [Measuring ANN Recall](/documentation/tutorials-search-engineering/ann-recall/) (does the approximate index match exact kNN?) and [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/) (do the top-k results match query intent?).

**Prerequisites.** A Qdrant collection populated with your documents as points (vectors + a `text` payload field for the chunk content), a labeled golden set (see [Measuring Retrieval Relevance](/documentation/improve-search/retrieval-relevance/)), LLM access for generation and judging, and Python with `ragas` installed.

## Wiring the RAG Pipeline

Several frameworks score RAG outputs with an LLM judge, including Ragas, <a href="https://docs.confident-ai.com/" target="_blank">DeepEval</a>, and others. We use Ragas here because it's the lightest setup for the three metrics this tutorial covers. If your team has standardized on a different framework or prefers to call the judge LLM directly, the same workflow applies.

<a href="https://docs.ragas.io/" target="_blank">Ragas</a> is a Python library that uses an LLM as a judge to score RAG outputs (rating each answer against criteria like faithfulness and relevancy). It expects samples shaped as `(question, retrieved_context, answer)` triples, so you build a fresh evaluation set from your labeled data. Three steps: prepare the evaluation data, define a grounding prompt, and run the retrieve-generate-record loop.

**1. Prepare the evaluation data.** Each entry needs a `query_id`, a `query_text` (used for both prompting the generator and embedding for retrieval), and `labels`. For `context_precision` only, also include a `ground_truth` reference answer.

Synthetic queries don't ship with ground-truth answers. If you're only scoring `faithfulness` and `answer_relevancy`, skip this step since both are reference-free. Otherwise, generate references by running each query through an LLM scoped to its source document. Have the model return `NO_ANSWER` when the source can't answer, and drop those rows before scoring, or `context_precision` ends up judging retrieval against a reference the source doc doesn't support.

```python
# Example of an evaluation-ready entry.
{
    "query_id": "q1",
    "query_text": "how does X work",
    "labels": {"doc_42": 1},
    "ground_truth": "...",  # optional; required for context_precision only
}
```

Different golden-set sources (human annotation, log sampling, or LLM synthesis) produce different raw shapes. Normalize to this structure before running the loop.

**2. Define the grounding prompt.** The prompt is the seam between retrieval and generation. Keep it in a versioned string so you can swap models without touching the evaluation code:

```python
PROMPT_TEMPLATE = """You are answering questions using retrieved source material.

Answer the question below using only the provided context.
If the context does not contain the answer, say so explicitly.
Do not rely on outside knowledge.

Context:
{retrieved_context}

Question:
{query_text}
"""
```

The prompt above is a starting point; tune it for your domain: answer style, refusal behavior, whether outside knowledge is allowed, and output format.

**3. Run retrieval and generation.** For each entry, retrieve the top-k chunks, pass them through the generator, and record a `SingleTurnSample` (Ragas's data class for one evaluation record: question, retrieved context, generated answer, and optional reference).


```python
import os

import anthropic
from qdrant_client import QdrantClient
from ragas import SingleTurnSample

from your_embedding_model import embed  # must match the model your Qdrant collection uses

client = QdrantClient("http://localhost:6333")  # or QdrantClient(url="https://<id>.cloud.qdrant.io", api_key="...") for Qdrant Cloud

# The example uses Anthropic, but any LLM provider works.
anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def generate_answer(query_text: str, contexts: list) -> str:
    """Fill the prompt template with context + question, then call the LLM."""
    prompt = PROMPT_TEMPLATE.format(
        retrieved_context="\n\n".join(contexts),
        query_text=query_text,
    )
    response = anthropic_client.messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def build_eval_set(golden_set: list, collection: str, k: int = 10) -> list:
    """For each labeled query: retrieve from Qdrant, generate an answer, package as a Ragas sample."""
    samples = []
    for entry in golden_set:
        # Retrieve top-k chunks from Qdrant.
        results = client.query_points(
            collection_name=collection,
            query=embed(entry["query_text"]),
            limit=k,
        ).points
        contexts = [p.payload["text"] for p in results]  # adjust the payload key to match your schema

        # Generate an answer grounded in those chunks.
        answer = generate_answer(entry["query_text"], contexts)

        # Package into a Ragas sample: question, context, answer, optional reference.
        samples.append(SingleTurnSample(
            user_input=entry["query_text"],
            retrieved_contexts=contexts,
            response=answer,
            reference=entry.get("ground_truth", ""),
        ))
    return samples
```

If an entry's `ground_truth` is empty, Ragas silently skips that sample for metrics that need a reference (like `context_precision`). Populate it only when you'll actually score those metrics.

## Scoring with Ragas

Three Ragas metrics cover the common failure modes for pipeline output quality:

- **`faithfulness`** checks whether the answer only makes claims supported by the retrieved context. It drops when the generator hallucinates or uses its training knowledge instead of the retrieved context.
- **`answer_relevancy`** checks whether the answer addresses the question. It drops when the generator pads, dodges, or drifts off-topic.
- **`context_precision`** checks whether the retrieved chunks are relevant to the ground-truth answer and ranked highly. It drops when retrieval surfaces noise that crowds out the useful chunks. `context_precision` compares against the `reference` field, so it only scores queries that carry a ground-truth answer.

Pass the eval samples into `evaluate()` with those three metrics:

```python
from anthropic import Anthropic
from openai import OpenAI
from ragas import EvaluationDataset, evaluate
from ragas.embeddings.base import embedding_factory
from ragas.llms import llm_factory
from ragas.metrics.collections import AnswerRelevancy, ContextPrecision, Faithfulness

# Judge LLM, Use a different LLM family as the generator to avoid self-evaluation bias
judge_client = OpenAI()  # reads OPENAI_API_KEY from the environment
judge_llm = llm_factory("gpt-5.4", client=judge_client)

# This is the judge's question-similarity check; it does not need to match the retrieval embedder.
judge_embeddings = embedding_factory("openai", model="text-embedding-3-large", client=judge_client)

metrics = [
    Faithfulness(llm=judge_llm),
    AnswerRelevancy(llm=judge_llm, embeddings=judge_embeddings),
    ContextPrecision(llm=judge_llm),
]

dataset = EvaluationDataset(samples=samples)
scores = evaluate(dataset, metrics=metrics)
```

`evaluate()` returns an `EvaluationResult` object. Its aggregate scores print like this:

```python
{"faithfulness": 0.88, "answer_relevancy": 0.81, "context_precision": 0.74}
```

Higher is better on all three. Aggregates hide the distribution that tells you what's breaking, so drop into the per-query view to find the worst-scoring samples:

```python
per_query = scores.to_pandas()  # row-per-query scores
worst = per_query.nsmallest(10, "faithfulness")
```

### Running in CI

If you ship retrieval changes regularly, this evaluation earns its place in CI. Running it on every change against a fixed golden set catches generator regressions from prompt edits, model swaps, or chunking changes before they reach production. The usual pattern: set a target threshold per metric and fail the job when any score drops below.

### Alternatives

**Without a golden set.** `faithfulness` and `answer_relevancy` are reference-free; swap `context_precision` for `LLMContextPrecisionWithoutReference`. You can then score synthetic queries offline or sampled production traffic live, at the cost of no fixed baseline for regression gating.

## Isolating Retrieval vs Generation

If you're also running [retrieval evaluation](/documentation/improve-search/retrieval-relevance/) against the same golden set, pairing the two scores on every run gives a diagnostic 2x2 for attributing score changes. When a metric drops after a change (new embedding model, new prompt, or new chunking strategy), the pair tells you which half of the pipeline to investigate.

Pair `recall@10` from the retrieval evaluation with `faithfulness` from the pipeline-output evaluation. In the table, High and Low are relative to the target thresholds you set per metric.

| Recall@10 | Faithfulness | Diagnosis |
|---|---|---|
| High | High | Ready to ship. |
| High | Low | Generator or prompt problem. Retrieval is surfacing the right context; something downstream (prompt, model, or temperature) is misusing it. |
| Low | Low | Fix retrieval first. The generator can't be faithful to context it never saw. |
| Low | High | Rare. Usually means either the golden-set labels are incomplete (retrieval found useful docs the label set doesn't cover) or the generator punted with a non-committal answer that has no claims to fail on. Read a sample of per-query outputs before acting. |

This split is the reason to keep retrieval and pipeline-output evaluation separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

## Non-RAG Use Cases

Ragas's metrics assume the consumer is an LLM generator. If retrieval feeds something else (a ranker, a recommendation surface, an agent, a search UI), swap the metrics to match: CTR or dwell time for a UI, graded rubrics for a ranker, task-completion rate for an agent. The method stays the same: freeze the consumer, run the golden set through the full pipeline, score the end-to-end output. Only the metric changes.

## Pitfalls to Watch For

**Judge bias.** LLM judges reward verbose, confident, or well-formatted answers even when the underlying claim is weaker. Calibrate by running a sample of outputs through human raters and comparing; if judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** Using the same model to generate and to judge inflates scores because the judge recognizes and rewards its own output style. Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts can't be blamed on a silent upgrade.

**Cost scaling.** LLM-as-judge cost grows with queries times metrics times judge calls per metric, and Ragas makes multiple judge calls per sample. A 500-query golden set with three metrics runs into the thousands of judge-model calls per run. Sample 50 to 100 queries with a cheap judge (`claude-haiku-4-5` or `gpt-4o-mini`) during iteration; reserve the full sweep with the strong judge for release candidates.

## Wrapping Up

You now have a Ragas-based scoring loop for the full RAG pipeline, a 2x2 to attribute regressions to retrieval or generation, and a CI pattern to gate releases on `faithfulness`, `answer_relevancy`, and `context_precision`.
