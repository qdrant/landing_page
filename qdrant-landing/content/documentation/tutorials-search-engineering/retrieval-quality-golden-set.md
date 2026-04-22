---
title: Building a Golden Query Set
weight: 5
aliases:
  - /documentation/tutorials/retrieval-quality-golden-set/
---

# Building a Golden Query Set

| Time: 40 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial covers **layer 2** of the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#connecting-the-levels-in-practice" target="_blank">evaluation ladder</a>: **retrieval relevance**. Measuring how well retrieved results match real user intent requires a labeled dataset of queries paired with their expected relevant documents (commonly called a *golden query set* or *ground truth*). For layer 1 (ANN recall against exact kNN), which needs no relevance labels, use the **Search Quality** tab in the <a href="/documentation/web-ui/" target="_blank">Qdrant Web UI</a>.

## Generating Queries

There are three practical approaches to building a golden set. They trade quality against cost and scale, so most teams use a mix. Pick the ones that match your resources and quality bar.

### 1. Human Annotation (Highest Quality, Highest Cost)

Domain experts assign relevance scores on a binary (relevant / not relevant) or graded (0/1/2 or 1–5) scale. This is the cleanest approach for high-stakes applications and produces the graded labels NDCG needs. Expert time is the bottleneck, so reserve it for a small, high-value subset — the hardest queries or the ones that matter most commercially — and use the other two approaches for coverage.

### 2. Real User Queries from Logs (High Realism, Requires Production Traffic)

If your app records queries with click or explicit-feedback signals, sample query-document pairs directly. This captures real user intent and vocabulary, and should be your first choice once production traffic exists. Stratify sampling so rare-but-important cases aren't drowned out. For search-style traffic, that usually means query type or topic cluster. For RAG or agentic retrieval, it often means conversation turn or intent class. A few hundred labeled pairs can detect large metric differences; per-slice analysis or small ranking deltas need substantially more. Treat any number as a starting point and widen confidence intervals if the signal is noisy.

### 3. LLM-Based Synthetic Generation (Scales Cheaply, Lowest Fidelity)

When logs and reviewers aren't available, prompt an LLM to generate plausible queries for each document. This scales to thousands of pairs, but synthetic queries are easier to retrieve than what real users type. Frameworks such as <a href="https://docs.ragas.io/" target="_blank">Ragas</a> provide ready-made testset generators if you want a maintained tool; the example below is a minimal prompt shape you can adapt to any model.

```python
import os

import anthropic

# Anthropic's API is one option; any LLM works.
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

def generate_queries_for_doc(doc_text: str, n: int = 3) -> list[str]:
    response = client.messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": (
                f"Generate {n} short, realistic search queries that would lead a user to the "
                f"following document. Return only the queries, one per line.\n\n{doc_text}"
            ),
        }],
    )
    return response.content[0].text.strip().splitlines()
```

## Using the Golden Set

Once queries are labeled, run each through Qdrant and compare the returned IDs against the labels. The metric to compute depends on what the labels record (see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#choosing-the-right-metric" target="_blank">metric-selection table</a>).

Use <a href="https://amenra.github.io/ranx/" target="_blank">ranx</a>, a Python library for ranking evaluation. It covers `recall@k`, `MRR`, `NDCG@k`, and others through a single `Qrels` / `Run` interface, and handles both binary and graded labels the same way.

Construct the labels as a `Qrels` object (a dict mapping query IDs to `{doc_id: relevance_score}`) and the Qdrant results as a `Run` (a dict mapping query IDs to `{doc_id: ranking_score}`). For binary labels, use `1` for relevant; for graded labels, use the raw 0/1/2 scores.

```python
from qdrant_client import QdrantClient
from ranx import Qrels, Run, evaluate

client = QdrantClient("http://localhost:6333")

def retrieval_run(golden_set: list, collection: str, k: int = 10) -> Run:
    run = {}
    for entry in golden_set:
        results = client.query_points(
            collection_name=collection,
            query=entry["query_vector"],
            limit=k,
        ).points
        run[entry["query_id"]] = {p.id: p.score for p in results}
    return Run(run)

qrels = Qrels({entry["query_id"]: entry["labels"] for entry in golden_set})
run = retrieval_run(golden_set, collection="my_collection", k=10)

metrics = evaluate(qrels, run, ["recall@10", "mrr", "ndcg@10"])
```

For the full metric list (Precision@k, MAP, ERR, and others), see the <a href="https://amenra.github.io/ranx/" target="_blank">ranx docs</a>.

Re-run this whenever the retrieval stack changes: new embedding model, new index config, new reranker.

## Pitfalls to Watch For (Data Leakage and Friends)

In golden query sets, **data leakage** means any setup that makes offline metrics look better than production reality. Unlike classic train/test leakage, the issue is often evaluation design. Keep source documents in the index (they are the expected relevant answers). Focus on these risks:

**Synthetic-query unrealism.** LLMs often mirror source wording, creating easier queries than real user input. This inflates offline scores. Mitigate it by prompting for queries from users who have not seen the source, then compare synthetic and real-query distributions (length and specificity).

**Embedding-model contamination.** If your embedding model was trained on pairs overlapping with the golden set, results will look better than true generalization. For hosted models, review published training data when possible. For in-house fine-tuning, keep strict train/eval separation.

**Near-duplicate documents.** A query from document A may retrieve near-duplicate B, which is relevant but unlabeled. That makes **precision look worse** because labels are incomplete. Deduplicate before labeling (for example, cosine similarity > 0.95), or label duplicate clusters together.

**Temporal drift.** If the corpus changes, queries generated from newer documents can unfairly evaluate older index snapshots. Pin a corpus snapshot for each run and regenerate the golden set after material corpus changes.

**Reviewer reproducibility.** Version the full evaluation setup: corpus snapshot, prompt, LLM version, and dedup threshold. Otherwise you cannot tell whether a later score drop is model/index regression or dataset drift.
