---
title: Building a Golden Query Set
weight: 5
aliases:
  - /documentation/tutorials/retrieval-quality-golden-set/
---

# Building a Golden Query Set

| Time: 40 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Evaluating retrieval relevance requires a labeled dataset of queries paired with their expected relevant documents (commonly called a *golden query set* or *ground truth*). The [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/) tutorial measures **ANN recall** against exact kNN, which needs no relevance labels. This page covers the separate task of building labeled data to measure **retrieval relevance** against real user intent.

## Generating Queries

There are three practical approaches to building a golden set. They trade quality against cost and scale, so most teams use a mix. Pick the ones that match your resources and quality bar.

### 1. Human Annotation (Highest Quality, Highest Cost)

Domain experts review query-document pairs and assign relevance scores, typically on a binary (relevant / not relevant) or graded (0/1/2 or 1 to 5) scale. This is the cleanest approach for high-stakes applications and produces the graded labels needed for NDCG-based evaluation. The bottleneck is expert time, so most teams reserve it for a small, high-value subset (for example, the hardest queries or the ones that matter most commercially) and build coverage around it with the other two approaches.

### 2. Real User Queries from Logs (High Realism, Requires Production Traffic)

If the application records queries with click or explicit-feedback signals, sample query-document pairs and use them directly. This captures real user intent and vocabulary, and is the first thing to reach for once production traffic exists. When sampling, stratify by query type or topic cluster rather than sampling uniformly at random: a random sample over-represents frequent queries and leaves rare-but-important cases uncovered. As a rough heuristic, a few hundred labeled pairs is enough to detect large metric differences; detecting small ranking differences or slicing by query type requires substantially more. The right number depends on your effect size and query-level variance, so treat any specific number as a starting point and widen confidence intervals if the signal is noisy.

### 3. LLM-Based Synthetic Generation (Scales Cheaply, Lowest Fidelity)

When neither logs nor human reviewers are available, prompt a capable LLM to generate queries that a user would plausibly ask to find each document. This scales cheaply to thousands of query-document pairs, but synthetic queries tend to be easier to retrieve than what real users type. See *Synthetic-query unrealism* below before trusting the numbers.

```python
import os

import anthropic

client = anthropic.Anthropic()

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

Once queries are labeled, run each through Qdrant and compare the returned IDs against the labels. The metric to compute depends on what the labels record (see the [metric-selection table](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#choosing-the-right-metric)).

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

This produces the retrieval-relevance score (layer 2 of the [evaluation ladder](/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#connecting-the-levels-in-practice)). Re-run it whenever the retrieval stack changes: new embedding model, new index config, new reranker. To measure layer 1 (ANN recall against exact kNN), see [Retrieval Quality Evaluation](/documentation/tutorials-search-engineering/retrieval-quality/).

## Pitfalls to Watch For (Data Leakage and Friends)

The term **data leakage** is often used loosely to cover any situation where evaluation scores come out higher than real-world performance would justify. Unlike classical ML train/test leakage, the failure modes for golden query sets are more subtle. The document that a query was generated from **must** be indexed (it's the relevant answer the evaluation expects to find), so "hold out the labeled docs from the index" is *not* the right fix. The real risks are the following.

**Synthetic-query unrealism.** LLMs tend to paraphrase the source document's wording. The resulting queries are much easier to retrieve than what real users type, which are typically shorter, vaguer, and use different vocabulary. Offline scores on synthetic queries therefore overstate production quality. Two practical mitigations: (1) prompt the LLM to write queries "as a user who has not seen this document", and (2) anchor a sample of synthetic queries against any real queries you do have, and verify the distributions of length and specificity are comparable.

**Embedding-model contamination.** If the embedding model was fine-tuned on (query, document) pairs that overlap with the golden set, the evaluation measures in-distribution performance and overstates real-world behavior. When using an off-the-shelf model, check its training mixture if published; when fine-tuning in-house, keep a strict split between fine-tuning data and evaluation data.

**Near-duplicate documents.** If two documents are nearly identical, a query generated from one will retrieve the other, but the other won't be in the labels, so **precision is under-reported** because the labeled relevant set is incomplete. Deduplicate the corpus before generating labels (e.g. drop documents with cosine similarity > 0.95 to an earlier document), or label near-duplicate clusters jointly.

**Temporal drift.** If the corpus evolves over time, evaluating with queries generated from documents that post-date the index version under test is unfair: those documents aren't there to retrieve. Pin the corpus snapshot, generate queries from that snapshot, and re-generate the golden set when the corpus changes materially.

**Reviewer reproducibility.** Whatever approach you pick, pin the data: the corpus snapshot, the query-generation prompt, the LLM model version, and any deduplication threshold. Without this, a later "the score got worse" investigation can't tell whether the retrieval regressed or the evaluation set changed underneath it.
