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
To measure retrieval relevance, you need a labeled dataset of queries paired with their expected relevant documents (commonly called a *golden query set* or *ground truth*). This tutorial covers both building that dataset and running it through Qdrant to compute relevance metrics.

To learn more about retrieval quality evaluation, see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#the-evaluation-ladder" target="_blank">evaluation ladder</a>.

**Prerequisites.** A Qdrant collection with your corpus indexed, an embedding model available to encode queries at evaluation time, and Python with `ranx` installed.

## Generating Queries

There are three practical approaches to building a golden set. Each one trades quality against cost and scale.

### 1. Human Annotation

Domain experts assign relevance scores on a binary (relevant / not relevant) or graded (0/1/2 or 1–5) scale. Human-labeled data produces the highest-fidelity signal and is the primary source for graded labels. Expert time is the bottleneck, which typically limits this approach to a small set of high-value queries.

### 2. Real User Queries from Logs

Sample query-document pairs from your production logs, using clicks or explicit feedback (thumbs up/down, ratings) as the relevance signal. Real user queries capture intent and vocabulary that synthetic generation can't match, but you need enough traffic and a signal that maps to relevance.

Balance the sample so frequent queries don't crowd out rare ones: group by query type, topic, or intent class. Start with a few hundred labeled pairs to detect large metric differences; per-slice analysis or small ranking deltas need substantially more.

### 3. LLM-Based Synthetic Generation

An LLM can generate plausible queries for documents sampled from your corpus. This scales cheaply to thousands of pairs, but synthetic queries are typically easier to retrieve than real user queries, which inflates offline scores. For very large corpora, log-based sampling is often more practical.

The document you feed the LLM (the **source document**) becomes the relevance label for every query it generates:

```text
You are helping build an evaluation dataset for a search system.

Generate 3 realistic search queries for the document below.
Each query should be what a real user would type to find it.
Phrase queries naturally, not as paraphrases of the document.
Return only the queries, one per line. No numbering or explanation.

Document:
{document_text}
```

**Tune the prompt to your corpus:**

- **Query style.** Questions for FAQ/RAG, keyword phrases for e-commerce, intent phrases for code search, or technical terms for specialist domains.
- **Count per document.** `3` is a default; tune to document length and golden-set size.
- **Persona.** A generic "user" works broadly; specialist corpora (medical, legal, technical) benefit from targeted personas.
- **Language.** Default English; state multilingual explicitly.

## Using the Golden Set

Before running the evaluation, load your labeled queries and assemble each into an entry with a `query_id`, a `query_vector`, and `labels`. The `query_vector` comes from embedding the query text with the same model your Qdrant collection uses. The `labels` dict maps relevant doc IDs to their relevance score: for synthetic queries, the source document's ID; for human or log-based labels, the annotated relevant docs.

Once assembled, run each query through Qdrant and compare the returned IDs against the labels. The metric to compute depends on what the labels record (see the <a href="/documentation/tutorials-search-engineering/retrieval-quality-fundamentals/#choosing-the-right-metric" target="_blank">metric-selection table</a>).

Use <a href="https://amenra.github.io/ranx/" target="_blank">ranx</a>, a Python library for ranking evaluation. It covers `recall@k`, `MRR`, `NDCG@k`, and others through a single `Qrels` / `Run` interface, and handles both binary and graded labels the same way.

Construct the labels as a `Qrels` object (a dict mapping query IDs to `{doc_id: relevance_score}`) and the Qdrant results as a `Run` (a dict mapping query IDs to `{doc_id: ranking_score}`). For binary labels, use `1` for relevant; for graded labels, use the raw 0/1/2 scores. [NDCG (Normalized Discounted Cumulative Gain)](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) is the standard metric when you have graded labels; it rewards relevant results appearing at higher positions.

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

`evaluate()` returns a dict of metric names to floats, for example:

```python
{"recall@10": 0.82, "mrr": 0.71, "ndcg@10": 0.76}
```

Higher is better on all three metrics. For the full metric list (Precision@k, MAP, ERR, and others), see the <a href="https://amenra.github.io/ranx/" target="_blank">ranx docs</a>.

Re-run whenever the retrieval stack changes: new embedding model (which also requires re-embedding queries and re-indexing), new index config, or new reranker. In CI, compute `recall@10` against a fixed golden set and fail the job when the score drops below your target threshold.

## Pitfalls to Watch For (Data Leakage and Friends)

In golden query sets, **data leakage** means any setup that makes offline metrics look better than production reality. Unlike classic train/test leakage, the issue is often evaluation design. Keep source documents in the index (they are the expected relevant answers). Focus on these risks:

**Synthetic-query unrealism.** LLMs often mirror source wording, creating easier queries than real user input. This inflates offline scores. Mitigate it by instructing the LLM to generate queries as a user who hasn't seen the source document, then compare synthetic and real-query distributions (length and specificity).

**Embedding-model contamination.** If your embedding model was trained on pairs overlapping with the golden set, results will look better than true generalization. For hosted models, review published training data when possible. For in-house fine-tuning, keep strict train/eval separation.

**Near-duplicate documents.** A query from document A may retrieve near-duplicate B, which is relevant but unlabeled. That makes **metrics look worse** because labels are incomplete. Deduplicate before labeling (for example, cosine similarity > 0.95), or label duplicate clusters together.

**Temporal drift.** If the corpus changes, queries generated from newer documents can unfairly evaluate older index snapshots. Pin a corpus snapshot for each run and regenerate the golden set after material corpus changes.

**Setup reproducibility.** Version the full evaluation setup: corpus snapshot, prompt, LLM version, and dedup threshold. Otherwise you can't tell whether a later score drop is model/index regression or dataset drift.

## Next Steps

Once retrieval relevance is on target, the next layer is pipeline output quality: whether the full pipeline produces the right output when retrieval feeds into a consumer (LLM generator, ranker, or UI). See [Evaluating Pipeline Output Quality](/documentation/tutorials-search-engineering/retrieval-quality-pipeline-output/).
