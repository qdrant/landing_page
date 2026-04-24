---
title: Evaluating Pipeline Output Quality
weight: 7
aliases:
  - /documentation/tutorials/retrieval-quality-pipeline-output/
---

# Evaluating Pipeline Output Quality

| Time: 45 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial focuses on **pipeline output quality**: whether the full retrieval pipeline produces the right output once retrieved results reach a consumer, most often an LLM generator in a RAG system.
To measure pipeline output quality, you run your golden query set through the full pipeline, capture each `(question, retrieved_context, answer)` triple, and score the triples against judgment metrics like faithfulness, answer relevancy, and context precision.

For orientation on the four layers of retrieval evaluation and where this tutorial fits, see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/#the-four-layers-of-retrieval-evaluation).

**Prerequisites.** A Qdrant collection with your corpus indexed (chunk text in a `text` payload field), a labeled golden set (see [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/)), LLM access for generation and judging, and Python with `ragas` installed. The Wiring section shows the exact entry shape this tutorial expects.

## Wiring the RAG Pipeline

<a href="https://docs.ragas.io/" target="_blank">Ragas</a> is a Python library that uses an LLM as a judge to score RAG outputs (rating each answer against criteria like faithfulness and relevancy instead of comparing to a labeled ground truth). It expects samples shaped as `(question, retrieved_context, answer)` triples, so you build a fresh evaluation set from your labeled data. Three steps: prepare the evaluation data, define a grounding prompt, and run the retrieve-generate-record loop.

**1. Prepare the evaluation data.** Each entry needs a `query_id`, a `query_text` (for prompting the generator), a `query_vector` (for retrieval), and `labels`. For `context_precision` only, also include a `ground_truth` reference answer.

```python
# Example of an evaluation-ready entry.
{
    "query_id": "q1",
    "query_text": "how does X work",
    "query_vector": [0.12, -0.48, 0.33, ...],
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

**3. Run retrieval and generation.** For each entry, retrieve the top-k chunks, pass them through the generator, and record a `SingleTurnSample`. The example uses Anthropic, but any LLM provider works (OpenAI, Cohere, a local model). Only the `generate_answer` body changes:

```python
import os

import anthropic
from qdrant_client import QdrantClient
from ragas import SingleTurnSample

client = QdrantClient("http://localhost:6333")  # or QdrantClient(url="https://<id>.cloud.qdrant.io", api_key="...") for Qdrant Cloud
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
            query=entry["query_vector"],
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

The result is a list of `SingleTurnSample` objects, one per query. Each sample carries the question, retrieved contexts, generated answer, and optional reference. The list feeds directly into Ragas's `evaluate()` in the next section.

## Scoring with Ragas

Three Ragas metrics cover the common failure modes for pipeline output quality:

- **`faithfulness`** checks whether the answer only makes claims supported by the retrieved context. It drops when the generator hallucinates or uses its training knowledge instead of the retrieved context.
- **`answer_relevancy`** checks whether the answer addresses the question. It drops when the generator pads, dodges, or drifts off-topic.
- **`context_precision`** checks whether the retrieved chunks are relevant to the ground-truth answer and ranked highly. It drops when retrieval surfaces noise that crowds out the useful chunks. `context_precision` compares against the `reference` field, so it only scores queries that carry a ground-truth answer.

Pass the eval samples into `evaluate()` with those three metrics:

```python
from ragas import EvaluationDataset, evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

dataset = EvaluationDataset(samples=samples)
scores = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision],
)
```

`evaluate()` returns a result object whose aggregate scores look like this:

```python
{"faithfulness": 0.88, "answer_relevancy": 0.81, "context_precision": 0.74}
```

Higher is better on all three. Aggregates hide the distribution that tells you what's breaking, so drop into the per-query view to find the worst-scoring samples:

```python
per_query = scores.to_pandas()  # row-per-query scores
worst = per_query.nsmallest(10, "faithfulness")
```

If you ship retrieval changes regularly, this evaluation earns its place in CI. Running it on every change against a fixed golden set catches generator regressions from prompt edits, model swaps, or chunking changes before they reach production. The usual pattern: set a target threshold per metric and fail the job when any score drops below.

**Without a golden set.** `faithfulness` and `answer_relevancy` are reference-free; swap `context_precision` for `LLMContextPrecisionWithoutReference`. You can then score synthetic queries offline or sampled production traffic live, at the cost of no fixed baseline for regression gating.

Ragas isn't the only tool in this space: <a href="https://docs.confident-ai.com/" target="_blank">DeepEval</a> has a pytest-native API that fits the CI story more directly, and teams that want full rubric control often build a small set of custom LLM-as-judge prompts instead.

## Isolating Retrieval vs Generation

If you're also running [retrieval evaluation](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/) against the same golden set, pairing the two scores on every run gives a diagnostic 2x2 for attributing score changes. When a metric drops after a change (new embedding model, new prompt, or new chunking strategy), the pair tells you which half of the pipeline to investigate.

Pair `recall@10` from the retrieval evaluation with `faithfulness` from the pipeline-output evaluation. In the table, High and Low are relative to the target thresholds you set per metric.

| Recall@10 | Faithfulness | Diagnosis |
|---|---|---|
| High | High | Ready to ship. |
| High | Low | Generator or prompt problem. Retrieval is surfacing the right context; something downstream (prompt, model, or temperature) is misusing it. |
| Low | Low | Fix retrieval first. The generator can't be faithful to context it never saw. |
| Low | High | Rare. Usually means either the golden-set labels are incomplete (retrieval found useful docs the label set doesn't cover) or the generator punted with a non-committal answer that has no claims to fail on. Read a sample of per-query outputs before acting. |

This split is the reason to keep retrieval and pipeline-output evaluation separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

## Pitfalls to Watch For

**Judge bias.** LLM judges reward verbose, confident, or well-formatted answers even when the underlying claim is weaker. Calibrate by running a sample of outputs through human raters and comparing; if judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** Using the same model to generate and to judge inflates scores because the judge recognizes and rewards its own output style. Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts can't be blamed on a silent upgrade.

**Cost scaling.** LLM-as-judge cost grows with queries times metrics times judge calls per metric, and Ragas makes multiple judge calls per sample. A 500-query golden set with three metrics runs into the thousands of judge-model calls per run. Sample aggressively during iteration and reserve the full sweep for release candidates.

**Non-RAG consumers.** Ragas metrics assume a generator output. If retrieval feeds a ranker, a recommendation surface, or a UI, swap Ragas for metrics that match the consumer: CTR and dwell time for a UI, graded rubrics for a ranker, and task-completion scores for an agent. The method (freeze the consumer, score the end-to-end output against the golden set) stays the same; only the metric changes.

## Connecting to Business Impact

Once pipeline output quality is on target, the remaining question is whether those offline wins move the KPIs the business responds to. It's the hardest measurement to get right, but a few disciplines make it manageable without a full experimentation platform.

### Pick KPIs That Match the Product Shape

No single KPI captures "retrieval is working." The right one depends on what retrieval is for. Pair one or two leading KPIs (which respond quickly) with a lagging KPI (which takes weeks or months to move).

| Application | Leading KPIs | Lagging KPIs |
|---|---|---|
| RAG or Q&A | Regeneration rate, follow-up rate, source-click rate | Retention, NPS |
| Search UI | CTR@1, abandonment rate, reformulation rate | Retention, repeat usage |
| Agentic | Step count to completion, tool-selection accuracy | Cost per completed task |
| Recommendations | Engagement rate, diversity-adjusted engagement | Retention, long-term value |

### Pre-Register the Decision Rule

Before running an A/B, write down what counts as a win, what counts as a no-ship, and which guardrails (latency, cost, slice performance, safety) can't regress. This is the highest-leverage habit for avoiding "the KPI is noisy, let's ship anyway" rationalization after results land.

### Calibrate the Offline-Online Transfer Function

Pair offline metric changes with online KPI changes over a few launches. After three or four paired measurements, patterns emerge: the slope (how much offline translates to online), the threshold (below what offline delta online noise dominates), and the lag (how long after launch the KPI moves). Until calibrated, offline wins are unfalsifiable claims.

### Proxy Signals When You Can't A/B

Most teams don't have a proper experimentation platform, or don't have the traffic to power a test quickly. Cheap-to-instrument signals correlate enough with value to catch big regressions and big wins: thumbs up or down on answers, regeneration rate, source-click rate, copy or share actions, and session abandonment. Build these into production telemetry before you need them.
