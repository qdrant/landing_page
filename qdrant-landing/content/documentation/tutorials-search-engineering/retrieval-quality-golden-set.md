---
title: Building a Golden Query Set
weight: 6
aliases:
  - /documentation/tutorials/retrieval-quality-golden-set/
---

# Building a Golden Query Set

| Time: 40 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial focuses on **retrieval relevance**: how well retrieved results match real user intent.
To measure retrieval relevance, you need a labeled dataset of queries paired with their expected relevant documents (commonly called a *golden query set* or *ground truth*).

To evaluate other layers of your retrieval pipeline, see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#connecting-the-layers-in-practice" target="_blank">evaluation ladder</a>.

## Generating Queries

There are three practical approaches to building a golden set. Each one trades quality against cost and scale.

### 1. Human Annotation

Domain experts assign relevance scores on a binary (relevant / not relevant) or graded (0/1/2 or 1–5) scale. Human-labeled data produces the highest-fidelity signal and is the only practical source for graded labels, which ranking metrics like [Normalized Discounted Cumulative Gain (NDCG)](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) use to reward relevant results appearing at higher positions. Expert time is the bottleneck, which typically limits this approach to a small set of high-value queries.

### 2. Real User Queries from Logs

If your app records queries with click or explicit-feedback signals, sample query-document pairs directly. Log-based pairs reflect real user intent and vocabulary that synthetic queries cannot replicate, though the approach requires production traffic and a signal that maps to relevance. Frequent queries dominate uniform samples, so stratifying by query type, topic cluster, conversation turn, or intent class keeps rare-but-important cases represented. A few hundred labeled pairs typically detects large metric differences; per-slice analysis or small ranking deltas require substantially more.

### 3. LLM-Based Synthetic Generation

An LLM can generate plausible queries for each document. This scales to thousands of pairs cheaply, but synthetic queries are typically easier to retrieve than real user queries, which inflates offline scores relative to production behavior. Frameworks such as <a href="https://docs.ragas.io/" target="_blank">Ragas</a> provide ready-made testset generators if you want a maintained tool.

The example below prompts an LLM to produce short, realistic queries for each document, with the source document serving as the labeled relevant answer.

```python
import os

import anthropic

# Anthropic's API is one option; any LLM works.
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

def generate_queries_for_doc(doc_text: str, n: int = 3) -> list[str]:
    # doc_text is one document from your corpus; iterate over the corpus
    # to build the full golden set, with each source doc as the relevance label.
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

client = QdrantClient("http://localhost:6333")  # or QdrantClient(url="https://<id>.cloud.qdrant.io", api_key="...") for Qdrant Cloud

def retrieval_run(golden_set: list, collection: str, k: int = 10) -> Run:
    # Each entry: {"query_id": str, "query_vector": list[float], "labels": {doc_id: score}}
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
