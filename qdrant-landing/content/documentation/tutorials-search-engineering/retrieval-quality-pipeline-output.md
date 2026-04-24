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
To measure pipeline output quality, you run your golden set through the full pipeline, capture each `(question, retrieved_context, answer)` triple, and score the triples against judgment metrics like faithfulness, answer relevancy, and context precision.

This tutorial is part of a four-layer retrieval evaluation framework; see [Measuring ANN Precision](/documentation/tutorials-search-engineering/retrieval-quality/#the-four-layers-of-retrieval-evaluation) for the full overview.

**Prerequisites.** A Qdrant collection populated with your documents as points (vectors + a `text` payload field for the chunk content), a labeled golden set (see [Measuring Retrieval Relevance](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/)), LLM access for generation and judging, and Python with `ragas` installed.

## Wiring the RAG Pipeline

<a href="https://docs.ragas.io/" target="_blank">Ragas</a> is a Python library that uses an LLM as a judge to score RAG outputs (rating each answer against criteria like faithfulness and relevancy). It expects samples shaped as `(question, retrieved_context, answer)` triples, so you build a fresh evaluation set from your labeled data. Three steps: prepare the evaluation data, define a grounding prompt, and run the retrieve-generate-record loop.

**1. Prepare the evaluation data.** Each entry needs a `query_id`, a `query_text` (for prompting the generator), a `query_vector` (for retrieval), and `labels`. For `context_precision` only, also include a `ground_truth` reference answer.

If your queries came from synthetic generation, they don't carry ground-truth answers natively. A simple workaround: make one more LLM pass per query, constrained to the source document, asking for a one-to-two-sentence reference answer. Skip this step if you're only scoring `faithfulness` and `answer_relevancy` (both are reference-free).

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

The prompt above is a starting point; tune it for your domain: answer style, refusal behavior, whether outside knowledge is allowed, and output format.

**3. Run retrieval and generation.** For each entry, retrieve the top-k chunks, pass them through the generator, and record a `SingleTurnSample` (Ragas's data class for one evaluation record: question, retrieved context, generated answer, and optional reference).


```python
import os

import anthropic
from qdrant_client import QdrantClient
from ragas import SingleTurnSample

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

If an entry's `ground_truth` is empty, Ragas silently skips that sample for metrics that need a reference (like `context_precision`). Populate it only when you'll actually score those metrics.

## Scoring with Ragas

Three Ragas metrics cover the common failure modes for pipeline output quality:

- **`faithfulness`** checks whether the answer only makes claims supported by the retrieved context. It drops when the generator hallucinates or uses its training knowledge instead of the retrieved context.
- **`answer_relevancy`** checks whether the answer addresses the question. It drops when the generator pads, dodges, or drifts off-topic.
- **`context_precision`** checks whether the retrieved chunks are relevant to the ground-truth answer and ranked highly. It drops when retrieval surfaces noise that crowds out the useful chunks. `context_precision` compares against the `reference` field, so it only scores queries that carry a ground-truth answer.

Pass the eval samples into `evaluate()` with those three metrics:

```python
from ragas import EvaluationDataset, evaluate
from ragas.metrics.collections import faithfulness, answer_relevancy, context_precision

dataset = EvaluationDataset(samples=samples)
scores = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision],
    # For a non-OpenAI judge, pass llm= and embeddings= (see Ragas docs).
)
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

Ragas isn't the only tool in this space: <a href="https://docs.confident-ai.com/" target="_blank">DeepEval</a> has a pytest-native API that fits the CI story more directly.

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

## Non-RAG Use Cases

Ragas's metrics assume the consumer is an LLM generator. If retrieval feeds something else (a ranker, a recommendation surface, an agent, a search UI), swap the metrics to match: CTR or dwell time for a UI, graded rubrics for a ranker, task-completion rate for an agent. The method stays the same: freeze the consumer, run the golden set through the full pipeline, score the end-to-end output. Only the metric changes.

## Pitfalls to Watch For

**Judge bias.** LLM judges reward verbose, confident, or well-formatted answers even when the underlying claim is weaker. Calibrate by running a sample of outputs through human raters and comparing; if judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** Using the same model to generate and to judge inflates scores because the judge recognizes and rewards its own output style. Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts can't be blamed on a silent upgrade.

**Cost scaling.** LLM-as-judge cost grows with queries times metrics times judge calls per metric, and Ragas makes multiple judge calls per sample. A 500-query golden set with three metrics runs into the thousands of judge-model calls per run. Sample aggressively during iteration and reserve the full sweep for release candidates.

## Connecting to Business Impact

Once pipeline output quality is on target, the remaining question is whether those offline wins move the KPIs the business responds to. The standard answer is an A/B test: ship the change to a subset of users, compare their KPIs against a control group receiving the old behavior, and isolate the change's effect from unrelated drift. It's the hardest measurement to get right, but a few disciplines make it manageable without a full experimentation platform.

### Pick KPIs That Match the Product Shape

No single KPI captures "retrieval is working." The right one depends on what retrieval is for. Pair one or two leading KPIs (which respond quickly) with a lagging KPI (which takes weeks or months to move).

| Application | Leading KPIs | Lagging KPIs |
|---|---|---|
| RAG or Q&A | Regeneration rate, follow-up rate, source-click rate | Retention, NPS |
| Search UI | CTR@1, abandonment rate, reformulation rate | Retention, repeat usage |
| Agentic | Step count to completion, tool-selection accuracy | Cost per completed task |
| Recommendations | Engagement rate, diversity-adjusted engagement | Retention, long-term value |

### Measurement Best Practices

Three practices make A/B results more credible:

- **Pre-register the decision rule.** Before the test, write down win criteria, no-ship criteria, and which guardrails (latency, cost, slice performance, safety) must not regress.
- **Calibrate offline against online.** Track how offline metric changes map to KPI changes over several launches. Three or four paired measurements usually reveal the slope (how much offline translates), the threshold (below which online noise dominates), and the lag (how long the KPI takes to move).
- **Instrument proxy signals.** When a formal A/B isn't feasible, proxies like thumbs up/down, regeneration rate, source-click rate, copy/share actions, and session abandonment can catch large regressions and wins. Add them to production telemetry before they're needed.

## Wrapping Up

That completes the four-layer retrieval evaluation stack: ANN precision, retrieval relevance, pipeline output quality, and business impact. Each layer catches a different class of regression.
