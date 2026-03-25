---
title: Search Quality
weight: 30
---

# Search Quality Verification

Two systems can hold identical vectors and produce different search results because of differences in indexing, quantization, scoring, and filtering implementation.

This is perhaps the hardest part of migration verification. The guide breaks it into **three tiers** so you can pick the level of rigor that matches your resources and risk tolerance.

## Three-Tiered Search Quality Checks

| Tier | Effort | What It Catches | When to Use |
| ----- | ----- | ----- | ----- |
| **Tier 1: Spot-Check** | 15 min | Gross failures: wrong metric, broken filters, obviously wrong results | Every migration |
| **Tier 2: Statistical Sampling** | 1-2 hours | Systematic recall degradation, filter interaction bugs, score distribution shifts | Production workloads, >100K vectors |
| **Tier 3: Gold-Standard Evaluation** | Half day to days | Measurable relevance changes with confidence intervals | High-stakes search (revenue, safety), regulated industries |

**Our recommendation:** Every migration should run Tier 1 and Tier 2. Tier 3 is for teams that have (or can build) labeled evaluation data. If you don't have labeled data today, Tier 2 gives you a strong quantitative baseline and this guide shows you how to build toward Tier 3 over time.

---

## Tier 1: Spot-Check (Every Migration)

Run your [baseline queries](/documentation/migration-verification/pre-migration-baseline/) against Qdrant and eyeball the results. This catches configuration-level errors that would affect every query: wrong distance metric, missing index, broken filter logic.

```py
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

def run_baseline_queries(baseline_queries, collection_name):
    """Run pre-recorded baseline queries against Qdrant."""
    results = []
    for bq in baseline_queries:
        qdrant_results = client.query_points(
            collection_name=collection_name,
            query=bq["query_vector"],
            limit=bq["top_k"],
            query_filter=build_qdrant_filter(bq["filters"]) if bq.get("filters") else None,
        )

        results.append({
            "query_id": bq["query_id"],
            "description": bq["description"],
            "source_results": bq["source_results"],
            "qdrant_results": [
                {"id": hit.id, "score": hit.score, "rank": i + 1}
                for i, hit in enumerate(qdrant_results.points)
            ],
        })
    return results
```

### What to Look For

For each query, compare the source results against Qdrant results:

```py
def tier1_report(comparison_results):
    """Generate a human-readable spot-check report."""
    for result in comparison_results:
        source_ids = [r["id"] for r in result["source_results"]]
        qdrant_ids = [r["id"] for r in result["qdrant_results"]]

        overlap = set(source_ids) & set(qdrant_ids)
        overlap_pct = len(overlap) / len(source_ids) * 100

        print(f"\nQuery: {result['description']} ({result['query_id']})")
        print(f"  Result overlap: {len(overlap)}/{len(source_ids)} ({overlap_pct:.0f}%)")

        # Check if top result matches
        if source_ids and qdrant_ids:
            if source_ids[0] == qdrant_ids[0]:
                print(f"  Top result: ✓ matches")
            else:
                print(f"  Top result: ✗ differs "
                      f"(source={source_ids[0]}, qdrant={qdrant_ids[0]})")

        # Check score distribution
        if result["qdrant_results"]:
            scores = [r["score"] for r in result["qdrant_results"]]
            print(f"  Score range: {min(scores):.4f} to {max(scores):.4f}")
```

### Tier 1 Pass/Fail Criteria

* **Top-1 match rate ≥80%:** 8 out of 10 queries return the same top result
* **Top-10 overlap ≥70%:** At least 7 of the same documents appear in the top 10 (order may differ)
* **No empty results:** If a query returned results on the source, it should return results on Qdrant
* **Score range is reasonable:** Cosine similarity scores should be between -1 and 1; dot product scores vary by vector magnitude

**If Tier 1 fails:** Stop. The issue is almost certainly a configuration problem (distance metric, missing index, filter translation error). Go to [Diagnosing Discrepancies](/documentation/migration-verification/diagnosing-discrepancies/) before running further checks.

---

## Tier 2: Statistical Sampling (Recommended)

Tier 2 quantifies search quality using recall@k: the fraction of source system results that appear in Qdrant's results. Instead of eyeballing 10 queries, you measure recall across 50 or more and compute statistics.

### Recall@k

Recall@k measures: "Of the top-k results from the source system, what fraction also appears in Qdrant's top-k?"

```py
def recall_at_k(source_results, qdrant_results, k):
    """Compute recall@k: fraction of source top-k present in Qdrant top-k."""
    source_ids = set(r["id"] for r in source_results[:k])
    qdrant_ids = set(r["id"] for r in qdrant_results[:k])
    if not source_ids:
        return 1.0  # No source results = vacuously correct
    return len(source_ids & qdrant_ids) / len(source_ids)
```

### Running the Evaluation

```py
import numpy as np
import json

def tier2_evaluation(baseline_queries, collection_name, client, k=10):
    """Run Tier 2 recall evaluation across all baseline queries."""
    recalls = []

    for bq in baseline_queries:
        qdrant_results = client.query_points(
            collection_name=collection_name,
            query=bq["query_vector"],
            limit=k,
            query_filter=build_qdrant_filter(bq["filters"]) if bq.get("filters") else None,
        )

        qdrant_ranked = [
            {"id": hit.id, "score": hit.score}
            for hit in qdrant_results.points
        ]

        r_at_k = recall_at_k(bq["source_results"], qdrant_ranked, k)
        recalls.append({
            "query_id": bq["query_id"],
            "recall_at_k": r_at_k,
        })

    # Compute aggregate statistics
    recall_values = [r["recall_at_k"] for r in recalls]
    stats = {
        "num_queries": len(recalls),
        "k": k,
        "mean_recall": float(np.mean(recall_values)),
        "median_recall": float(np.median(recall_values)),
        "min_recall": float(np.min(recall_values)),
        "p5_recall": float(np.percentile(recall_values, 5)),
        "p25_recall": float(np.percentile(recall_values, 25)),
        "std_recall": float(np.std(recall_values)),
    }

    return recalls, stats
```

### Interpreting Tier 2 Results

```py
def tier2_report(recalls, stats):
    """Print Tier 2 evaluation summary."""
    print(f"Recall@{stats['k']} across {stats['num_queries']} queries:")
    print(f"  Mean:   {stats['mean_recall']:.3f}")
    print(f"  Median: {stats['median_recall']:.3f}")
    print(f"  Min:    {stats['min_recall']:.3f}")
    print(f"  P5:     {stats['p5_recall']:.3f}")
    print(f"  Std:    {stats['std_recall']:.3f}")

    # Flag low-recall queries for investigation
    low_recall = [r for r in recalls if r["recall_at_k"] < 0.7]
    if low_recall:
        print(f"\n⚠ {len(low_recall)} queries with recall < 0.7:")
        for r in low_recall:
            print(f"  {r['query_id']}: {r['recall_at_k']:.3f}")
```

### Why Recall Won't Be 1.0 (And That's OK)

Even a correct migration will often show recall@10 between 0.85 and 0.95 rather than 1.0. This isn't a bug. Here's why:

* **HNSW is approximate:** Both systems use approximate nearest neighbor algorithms. Different HNSW parameters (`ef_construction`, `M`, `ef` at search time) produce slightly different traversal paths and retrieve slightly different neighbors.
* **Index build order matters:** HNSW graph structure depends on insertion order. The same data inserted in a different order produces a different graph with different (but statistically equivalent) recall.
* **Quantization introduces noise:** If either system uses quantization, distance calculations have reduced precision. Two systems with different quantization schemes will disagree on borderline results.
* **Score ties:** When multiple vectors have nearly identical distances to the query, tie-breaking is arbitrary. The 10th and 11th results may swap between systems.

**What matters:** The distribution of recall, not individual query recall. If mean recall@10 ≥0.85 and no queries have recall <0.5, the migration is working correctly. The systems are disagreeing on borderline results, not on clear matches.

### Tier 2 Pass/Fail Criteria

| Metric | Pass | Investigate | Fail |
| ----- | ----- | ----- | ----- |
| Mean recall@10 | ≥0.85 | 0.70 to 0.85 | <0.70 |
| Median recall@10 | ≥0.90 | 0.75 to 0.90 | <0.75 |
| Min recall@10 | ≥0.50 | 0.30 to 0.50 | <0.30 |
| P5 recall@10 | ≥0.60 | 0.40 to 0.60 | <0.40 |

**If Tier 2 passes but a few queries have low recall:** This is normal. Check whether the low-recall queries involve highly selective filters or edge cases. See [Diagnosing Discrepancies](/documentation/migration-verification/diagnosing-discrepancies/).

### Extending Tier 2: Score Correlation

Beyond recall, check whether the relative ordering of scores is consistent:

```py
from scipy import stats as scipy_stats

def score_correlation(source_results, qdrant_results):
    """Compute rank correlation between source and Qdrant scores for overlapping results."""
    # Find overlapping IDs
    source_map = {r["id"]: r["score"] for r in source_results}
    qdrant_map = {r["id"]: r["score"] for r in qdrant_results}
    common_ids = set(source_map.keys()) & set(qdrant_map.keys())

    if len(common_ids) < 3:
        return None  # Not enough overlap to compute correlation

    source_scores = [source_map[id] for id in common_ids]
    qdrant_scores = [qdrant_map[id] for id in common_ids]

    # Spearman rank correlation (order matters more than magnitude)
    correlation, p_value = scipy_stats.spearmanr(source_scores, qdrant_scores)
    return {"correlation": correlation, "p_value": p_value, "n_common": len(common_ids)}
```

A Spearman correlation >0.8 across overlapping results means the ranking is preserved even if the exact scores differ (which they will, since different systems scale scores differently).

---

## Tier 3: Gold-Standard Evaluation (When You Have Labeled Data)

Tier 3 measures whether search results are *relevant*, not merely consistent with the source system. This requires labeled relevance judgments: for a set of queries, human-verified labels indicating which documents are relevant.

### Why Tier 3 Matters

Tier 2 assumes the source system's results are the ground truth. But if you're migrating because your source system's search quality was insufficient, matching its results perfectly is the wrong goal. Tier 3 measures against what the results *should* be, not what they were.

### Building an Evaluation Set

If you don't have labeled data, here are three practical approaches to build one:

<details>
<summary><b>Approach A: Click/Conversion Logs (Lowest Effort)</b></summary>

If your application logs user interactions (clicks, purchases, bookmarks, shares), these are implicit relevance signals:

```py
# Structure for click-based evaluation data
eval_queries = [
    {
        "query_id": "eval_001",
        "query_vector": [...],
        "filters": {...},
        "relevant_docs": [
            # Documents users engaged with after this query
            {"id": "doc_789", "relevance": 2},  # Purchased/converted
            {"id": "doc_012", "relevance": 1},  # Clicked but didn't convert
        ],
    },
]
```

**Caveat:** Click data has position bias (users click top results more) and only captures what users saw, not what they would have found relevant. It's a reasonable starting point, not a perfect label set.

</details>

<details>
<summary><b>Approach B: Expert Labeling (Moderate Effort)</b></summary>

Have domain experts label 50 to 100 queries with 20 to 50 candidate documents each:

```py
# Labeling guidelines (customize for your domain)
RELEVANCE_SCALE = {
    3: "Exactly what the user is looking for",
    2: "Useful and related",
    1: "Tangentially related",
    0: "Not relevant",
}
```

**Practical tip:** Don't label from scratch. Run your baseline queries against both systems, pool the top 20 results from each, deduplicate, and have experts label the combined set.

</details>

<details>
<summary><b>Approach C: Synthetic Evaluation (Lowest Barrier)</b></summary>

If you have structured metadata, construct queries where you know the correct answer:

```py
# Example: for a product catalog with known categories
synthetic_queries = []
for product in sample_products:
    synthetic_queries.append({
        "query_vector": product["embedding"],
        "known_relevant": [product["id"]],  # The product itself should be top-1
        "known_category": product["category"],
        # Top results should share the category
    })
```

This doesn't measure relevance in the human sense, but it catches systematic retrieval failures.

</details>

### Computing Tier 3 Metrics

With labeled data, compute standard information retrieval metrics:

```py
import numpy as np

def ndcg_at_k(retrieved_ids, relevance_map, k):
    """Normalized Discounted Cumulative Gain at k."""
    dcg = 0.0
    for i, doc_id in enumerate(retrieved_ids[:k]):
        rel = relevance_map.get(doc_id, 0)
        dcg += (2**rel - 1) / np.log2(i + 2)  # i+2 because log2(1) = 0

    # Ideal DCG: sort all relevance scores descending
    ideal_rels = sorted(relevance_map.values(), reverse=True)[:k]
    idcg = sum((2**rel - 1) / np.log2(i + 2) for i, rel in enumerate(ideal_rels))

    return dcg / idcg if idcg > 0 else 0.0

def mrr(retrieved_ids, relevant_ids):
    """Mean Reciprocal Rank: how high is the first relevant result?"""
    for i, doc_id in enumerate(retrieved_ids):
        if doc_id in relevant_ids:
            return 1.0 / (i + 1)
    return 0.0

def tier3_evaluation(eval_queries, collection_name, client, k=10):
    """Full Tier 3 evaluation with NDCG and MRR."""
    ndcgs = []
    mrrs = []

    for eq in eval_queries:
        qdrant_results = client.query_points(
            collection_name=collection_name,
            query=eq["query_vector"],
            limit=k,
            query_filter=build_qdrant_filter(eq["filters"]) if eq.get("filters") else None,
        )
        retrieved_ids = [hit.id for hit in qdrant_results.points]

        relevance_map = {d["id"]: d["relevance"] for d in eq["relevant_docs"]}
        relevant_ids = set(relevance_map.keys())

        ndcgs.append(ndcg_at_k(retrieved_ids, relevance_map, k))
        mrrs.append(mrr(retrieved_ids, relevant_ids))

    return {
        "mean_ndcg": float(np.mean(ndcgs)),
        "mean_mrr": float(np.mean(mrrs)),
        "median_ndcg": float(np.median(ndcgs)),
        "num_queries": len(eval_queries),
    }
```

### Tier 3 Pass/Fail Criteria

Tier 3 targets are domain-specific. Here are starting points:

| Metric | Good | Acceptable | Investigate |
| ----- | ----- | ----- | ----- |
| NDCG@10 | ≥0.70 | 0.50 to 0.70 | <0.50 |
| MRR | ≥0.60 | 0.40 to 0.60 | <0.40 |

**The real test:** Compare Tier 3 metrics between your source system and Qdrant. If Qdrant's NDCG is equal to or higher than the source, the migration improved search quality. If it's lower, investigate whether the difference is caused by configuration (fixable) or a genuine capability gap.

### Building Toward Tier 3 Incrementally

Most teams don't have labeled evaluation data on migration day. That's fine. Here's a practical path:

1. **Day 0 (migration):** Run Tier 1 and Tier 2. You now have a quantitative baseline.
2. **Week 1:** Start logging search queries and user interactions in production.
3. **Month 1:** Use click logs to build Approach A evaluation data. Run Tier 3 against it.
4. **Quarter 1:** Have domain experts label the hardest queries (the ones where Tier 2 recall was lowest). This becomes your gold-standard set.
5. **Ongoing:** Re-run Tier 3 whenever you change embeddings, indexing parameters, or quantization settings.

---

**Next:** [Diagnosing Discrepancies](/documentation/migration-verification/diagnosing-discrepancies/)
