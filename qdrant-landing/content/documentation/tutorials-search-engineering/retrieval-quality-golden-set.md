---
title: Building a Golden Query Set
weight: 5
aliases:
  - /documentation/tutorials/retrieval-quality-golden-set/
---

# Building a Golden Query Set

| Time: 40 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

This tutorial covers **layer 2** of the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#connecting-the-levels-in-practice" target="_blank">evaluation ladder</a>: **retrieval relevance**. Measuring how well retrieved results match real user intent requires a labeled dataset of queries paired with their expected relevant documents (commonly called a *golden query set* or *ground truth*). For layer 1 (ANN recall against exact kNN), which needs no relevance labels, see <a href="/documentation/tutorials-search-engineering/retrieval-quality/" target="_blank">Retrieval Quality Evaluation</a>.

## Generating Queries

There are three practical approaches to building a golden set. They trade quality against cost and scale, so most teams use a mix. Pick the ones that match your resources and quality bar.

### 1. Human Annotation (Highest Quality, Highest Cost)

Domain experts assign relevance scores on a binary (relevant / not relevant) or graded (0/1/2 or 1–5) scale. This is the cleanest approach for high-stakes applications and produces the graded labels NDCG needs. Expert time is the bottleneck, so reserve it for a small, high-value subset — the hardest queries or the ones that matter most commercially — and use the other two approaches for coverage.

### 2. Real User Queries from Logs (High Realism, Requires Production Traffic)

If your app records queries with click or explicit-feedback signals, sample query-document pairs directly. This captures real user intent and vocabulary, and should be your first choice once production traffic exists. Stratify by query type or topic cluster — uniform sampling over-represents frequent queries and misses rare-but-important cases. As a rough heuristic, a few hundred labeled pairs detects large metric differences; small ranking differences or per-slice analysis need substantially more. Treat any number as a starting point and widen confidence intervals if the signal is noisy.

### 3. LLM-Based Synthetic Generation (Scales Cheaply, Lowest Fidelity)

When logs and reviewers aren't available, prompt an LLM to generate plausible queries for each document. This scales to thousands of pairs, but synthetic queries are easier to retrieve than what real users type.

```python
import os

import anthropic

client = Anthropic(
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

For **binary-relevance labels** (a set of relevant doc IDs per query), compute `recall@k` and `MRR`:

```python
def recall_at_k(retrieved_ids: list, relevant_ids: set, k: int) -> float:
    hit = sum(1 for doc_id in retrieved_ids[:k] if doc_id in relevant_ids)
    return hit / len(relevant_ids) if relevant_ids else 0.0

def mrr(retrieved_ids: list, relevant_ids: set) -> float:
    for i, doc_id in enumerate(retrieved_ids):
        if doc_id in relevant_ids:
            return 1.0 / (i + 1)
    return 0.0
```

For **graded-relevance labels** (for example 0/1/2 scores per query-document pair), compute `NDCG@k`:

```python
import numpy as np

def ndcg_at_k(retrieved_ids: list, relevance_map: dict, k: int) -> float:
    dcg = sum(
        (2 ** relevance_map.get(doc_id, 0) - 1) / np.log2(i + 2)
        for i, doc_id in enumerate(retrieved_ids[:k])
    )
    ideal = sorted(relevance_map.values(), reverse=True)[:k]
    idcg = sum((2 ** rel - 1) / np.log2(i + 2) for i, rel in enumerate(ideal))
    return dcg / idcg if idcg > 0 else 0.0
```

Run the evaluation loop across the golden set:

```python
from qdrant_client import QdrantClient

client = QdrantClient("http://localhost:6333")

def evaluate(golden_set: list, collection: str, k: int = 10) -> dict:
    recalls, mrrs = [], []
    for entry in golden_set:
        results = client.query_points(
            collection_name=collection,
            query=entry["query_vector"],
            limit=k,
        ).points
        retrieved = [p.id for p in results]
        relevant = set(entry["relevant_ids"])
        recalls.append(recall_at_k(retrieved, relevant, k))
        mrrs.append(mrr(retrieved, relevant))
    return {
        "mean_recall": sum(recalls) / len(recalls),
        "mean_mrr": sum(mrrs) / len(mrrs),
    }
```

Re-run this whenever the retrieval stack changes: new embedding model, new index config, new reranker.

## Pitfalls to Watch For (Data Leakage and Friends)

In golden query sets, **data leakage** means any setup that makes offline metrics look better than production reality. Unlike classic train/test leakage, the issue is often evaluation design. Keep source documents in the index (they are the expected relevant answers). Focus on these risks:

**Synthetic-query unrealism.** LLMs often mirror source wording, creating easier queries than real user input. This inflates offline scores. Mitigate it by prompting for queries from users who have not seen the source, then compare synthetic and real-query distributions (length and specificity).

**Embedding-model contamination.** If your embedding model was trained on pairs overlapping with the golden set, results will look better than true generalization. For hosted models, review published training data when possible. For in-house fine-tuning, keep strict train/eval separation.

**Near-duplicate documents.** A query from document A may retrieve near-duplicate B, which is relevant but unlabeled. That makes **precision look worse** because labels are incomplete. Deduplicate before labeling (for example, cosine similarity > 0.95), or label duplicate clusters together.

**Temporal drift.** If the corpus changes, queries generated from newer documents can unfairly evaluate older index snapshots. Pin a corpus snapshot for each run and regenerate the golden set after material corpus changes.

**Reviewer reproducibility.** Version the full evaluation setup: corpus snapshot, prompt, LLM version, and dedup threshold. Otherwise you cannot tell whether a later score drop is model/index regression or dataset drift.
