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

To learn more about retrieval quality evaluation, see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#the-evaluation-ladder" target="_blank">evaluation ladder</a>.

**Prerequisites.** A Qdrant collection with your corpus indexed, a labeled golden set (see [Building a Golden Query Set](/documentation/tutorials-search-engineering/retrieval-quality-golden-set/)), LLM access for both generation and judging, and Python with `ragas` installed.

## Wiring the RAG Pipeline

Layer 3 reuses the same golden set you built for layer 2, but it runs each query through the full pipeline instead of stopping at Qdrant's response. For every golden query, retrieve the top-k chunks from Qdrant, pass them into the generator with a grounding prompt, and record what the generator returned.

The prompt is the seam between retrieval and generation, so keep it framework-agnostic and write it down as a plain-text artifact you can version:

```text
You are answering questions using retrieved source material.

Answer the question below using only the provided context.
If the context does not contain the answer, say so explicitly.
Do not rely on outside knowledge.

Context:
{retrieved_context}

Question:
{question}
```

Run the loop and assemble one evaluation sample per query. Each sample carries the question, the retrieved contexts (as a list of strings in rank order), the generated answer, and the ground-truth answer if you have one.

```python
from qdrant_client import QdrantClient

client = QdrantClient("http://localhost:6333")  # or QdrantClient(url="https://<id>.cloud.qdrant.io", api_key="...") for Qdrant Cloud

def build_eval_set(golden_set: list, collection: str, k: int = 10) -> list:
    samples = []
    for entry in golden_set:
        results = client.query_points(
            collection_name=collection,
            query=entry["query_vector"],
            limit=k,
        ).points
        contexts = [p.payload["text"] for p in results]
        answer = generate_answer(entry["question"], contexts)  # your LLM call
        samples.append({
            "question": entry["question"],
            "contexts": contexts,
            "answer": answer,
            "ground_truth": entry.get("ground_truth", ""),
        })
    return samples
```

`generate_answer` is your own generator call, filled from the prompt template. Keep it in its own function so you can swap the model or the prompt without touching the evaluation code.

## Scoring with Ragas

<a href="https://docs.ragas.io/" target="_blank">Ragas</a> is a Python library for evaluating RAG outputs with LLM-as-judge metrics. Three metrics cover the common failure modes for layer 3:

- **`faithfulness`** checks whether the answer only makes claims supported by the retrieved context. It drops when the generator hallucinates or leaks parametric knowledge.
- **`answer_relevancy`** checks whether the answer addresses the question. It drops when the generator pads, dodges, or drifts off-topic.
- **`context_precision`** checks whether the retrieved chunks are relevant to the ground-truth answer and ranked highly. It drops when retrieval surfaces noise that crowds out the useful chunks.

Pass the eval samples into `evaluate()` with those three metrics:

```python
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

dataset = Dataset.from_list(samples)
scores = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision],
)
```

`evaluate()` returns a result object whose aggregate scores look like this:

```python
{"faithfulness": 0.88, "answer_relevancy": 0.81, "context_precision": 0.74}
```

Higher is better on all three. Inspect the per-sample scores to find the worst-scoring queries, because aggregates hide the distribution that tells you what's breaking.

Wire this into CI against a fixed golden set and fail the job when any of the three metrics falls below its target threshold. That catches generator regressions from prompt edits, model swaps, or chunking changes before they reach production.

Ragas isn't the only tool in this space: <a href="https://docs.confident-ai.com/" target="_blank">DeepEval</a> has a pytest-native API that fits the CI story more directly, and teams that want full rubric control often build a small set of custom LLM-as-judge prompts instead.

## Isolating Retrieval vs Generation

Layer 3 and layer 2 share the same golden set on purpose: when you run them together on every evaluation run, the pair of scores is diagnostic. Pair the layer-2 `recall@10` with the layer-3 `faithfulness` for the same queries and read the 2x2:

| Recall@10 | Faithfulness | Diagnosis |
|---|---|---|
| High | High | Ship to layer 4. |
| High | Low | Generator or prompt problem. Retrieval is surfacing the right context; something downstream (prompt, model, or temperature) is misusing it. |
| Low | Low | Fix retrieval first. The generator can't be faithful to context it never saw. |
| Low | High | Rare and worth a second look. Usually the generator is answering from parametric knowledge rather than the retrieved context, so the faithfulness score is measuring against the wrong source. |

This split is the reason the ladder keeps layers 2 and 3 separate. Collapsing them into one end-to-end score tells you the pipeline moved, but not which half moved, so the next iteration becomes guesswork.

## Pitfalls to Watch For

**Judge bias.** LLM judges reward verbose, confident, or well-formatted answers even when the underlying claim is weaker. Calibrate by running a sample of outputs through human raters and comparing; if judge and human scores disagree often, adjust the rubric or swap the judge model.

**Self-judging contamination.** Using the same model to generate and to judge inflates scores because the judge recognizes and rewards its own output style. Pick a different model family for the judge than for the generator, and record both versions in every run so score shifts can't be blamed on a silent upgrade.

**Cost scaling.** LLM-as-judge cost grows with queries times metrics times judge calls per metric, and Ragas makes multiple judge calls per sample. A 500-query golden set with three metrics is hundreds of judge-model calls per run. Sample aggressively during iteration and reserve the full sweep for release candidates.

**Non-RAG consumers.** Ragas metrics assume a generator output. If retrieval feeds a ranker, a recommendation surface, or a UI, swap Ragas for metrics that match the consumer: CTR and dwell time for a UI, graded rubrics for a ranker, and task-completion scores for an agent. The layer-3 method (freeze the consumer, score the end-to-end output against the golden set) stays the same; only the metric changes.

## Next Steps

Once pipeline output quality is on target, the final layer is business impact: whether the retrieval change moves the KPIs users and stakeholders respond to. There isn't a dedicated tutorial for layer 4, because the mechanics depend on your experimentation platform, product shape, and traffic profile. See the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#the-evaluation-ladder" target="_blank">evaluation ladder</a> and the layer 4 section of the same document for the methodology: proxy KPIs when you can't run an A/B, pre-registered decision rules, and experiment design for retrieval changes.
