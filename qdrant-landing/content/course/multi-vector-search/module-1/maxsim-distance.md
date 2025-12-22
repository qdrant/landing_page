---
title: "MaxSim Distance Metric"
description: Learn about the MaxSim distance metric used in multi-vector search and how it computes similarity between multi-vector representations.
weight: 2
---

{{< date >}} Module 1 {{< /date >}}

# MaxSim Distance Metric

MaxSim (Maximum Similarity) is the core distance metric for late interaction models. Unlike traditional vector similarity metrics that operate on pairs of single vectors, MaxSim computes similarity between sequences of vectors.

Understanding MaxSim is important for working with multi-vector search effectively and understanding its performance characteristics.

---

<div class="video">
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-1/maxsim-distance.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## The MaxSim Formula

In late interaction, we represent documents and queries as sequences of token vectors. But how do we measure similarity between two sets of vectors?

The answer is **MaxSim** (Maximum Similarity), defined mathematically as:

$$
\text{MaxSim}(Q, D) = \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} \text{sim}(q_i, d_j)
$$

Where:
- $Q$ represents the query token vectors
- $D$ represents the document token vectors
- $\text{sim}(q_i, d_j)$ is a base similarity function that measures the distance between two vectors

The $\text{sim}(q_i, d_j)$ function can be any distance metric - dot product, cosine similarity, Euclidean distance, or others. Let's break down what this formula actually computes.

## Understanding MaxSim Step-by-Step

### The Computation Process

Let's make this concrete with an example. Consider:

- **Query**: "apple computer"
- **Document**: "Apple makes the MacBook laptop"

<!-- TODO: Add detailed diagram of MaxSim computation for "apple computer" query
This is the MAIN example diagram to use throughout the lesson.

Show:
- Query: "apple computer" with 2 token embeddings [q₁="apple", q₂="computer"]
- Document: "Apple makes the MacBook laptop" with 5 token embeddings [d₁="Apple", d₂="makes", d₃="the", d₄="MacBook", d₅="laptop"]

Step-by-step visualization:
1. For q₁ ("apple"):
   - Show similarity scores: sim(q₁,d₁)=0.92, sim(q₁,d₂)=0.15, sim(q₁,d₃)=0.08, sim(q₁,d₄)=0.31, sim(q₁,d₅)=0.19
   - Highlight MAX = 0.92 (matches "Apple" company name)

2. For q₂ ("computer"):
   - Show similarity scores: sim(q₂,d₁)=0.41, sim(q₂,d₂)=0.11, sim(q₂,d₃)=0.06, sim(q₂,d₄)=0.87, sim(q₂,d₅)=0.73
   - Highlight MAX = 0.87 (matches "MacBook")

3. Final MaxSim score: 0.92 + 0.87 = 1.79

Use color coding:
- Highlight maximum values in green
- Show arrows from query tokens to their best matching document tokens
- Display similarity matrix as a heatmap (2×5 grid)
-->

The key insight here: **each query token finds its best match in the document**. This enables **fine-grained semantic matching** - instead of comparing holistic document representations, we're allowing each part of the query to independently find its most relevant counterpart.

```python
# TODO: implement the code snippet
```

### The Intuition Behind MaxSim

MaxSim implements **token-level relevance matching**. Each query term actively seeks its most relevant counterpart in the document. Unlike single-vector search where you compare one query vector to one document vector (one-to-one), MaxSim performs many-to-many matching. This enables **contextual precision**. When you search for "apple computer", the word "apple" in your query will match strongly with "Apple" (the company name) in documents about technology, not "apple" (the fruit) in documents about nutrition, as contextualized token embeddings should capture these semantic distinctions.

But why maximum and not average? Consider a query about "Python programming". A document might discuss Python extensively in one section but also mention cooking recipes in another. MaxSim focuses on the **strong matches** (Python-related tokens) rather than diluting the score with irrelevant tokens. This design choice reflects a fundamental insight: relevance is often concentrated, not uniform.

## The HNSW Challenge

There's a significant challenge related to MaxSim when it comes to indexing these representations efficiently. HNSW (Hierarchical Navigable Small World) graphs enable fast approximate nearest neighbor search by building static proximity graphs. They rely on the assumption that distance functions must be symmetric and query-independent. This allows HNSW to construct fixed neighbor relationships that makes the effective graph traversal possible.

**MaxSim breaks this assumption by design.** Looking back at the formula, notice that $Q$ and $D$ play fundamentally different roles:

- We **iterate over query tokens** - each query token contributes to the final sum
- Documents are **what we search within** - we take the maximum similarity from document tokens for each query token

This non-symmetrical structure means `MaxSim(Q, D) ≠ MaxSim(D, Q)`. When you swap the parameters, you change which tokens contribute to the sum. 

<!-- TODO: Add diagram showing parameter asymmetry
Use the "apple computer" example again to show the asymmetry:

Side-by-side comparison:

Left: MaxSim(Query, Document)
- Iterate over 2 query tokens [q₁, q₂]
- Each finds max from 5 document tokens
- Sum = 0.92 + 0.87 = 1.79

Right: MaxSim(Document, Query)  [if we swap parameters]
- Iterate over 5 document tokens [d₁, d₂, d₃, d₄, d₅]
- Each finds max from only 2 query tokens
- Sum = max(d₁→q) + max(d₂→q) + max(d₃→q) + max(d₄→q) + max(d₅→q)
- Different result because we sum over different number of tokens

Visually show:
- Different iteration paths (arrows)
- Different number of contributions to the sum
- Highlight that Q and D have fundamentally different roles (not interchangeable)
-->


A document's nearest neighbors are query-dependent and change based on which query you're processing, making it impossible to build the static proximity graph that HNSW requires. The practical reality is you must compute MaxSim against every document at query time with brute force comparison. For large collections, this becomes slow, or even impossible.

The common solution is **two-stage retrieval**, and we'll explore that pattern in later lessons and see how Qdrant optimizes multi-vector search.

## Connecting the Concepts

In the previous lesson, you learned about the late interaction paradigm - encoding queries and documents into multiple token vectors and deferring comparison until search time. MaxSim is the mathematical operation that makes this deferred comparison work. It's the bridge between the conceptual model (multi-vector representations) and practical implementation. Without MaxSim or a similar aggregation function, we'd have no way to score documents against queries when both are represented as sequences of vectors.

## What's Next

MaxSim gives us a way to compare multi-vector representations, capturing fine-grained semantic matching that single-vector search cannot achieve. But as we've seen, it also introduces significant computational challenges - particularly the asymmetry that breaks traditional indexing approaches like HNSW.

In the next lesson, we'll explore **use cases where multi-vector search excels** despite these challenges. You'll see scenarios where the improved relevance and semantic precision justify the additional computational cost.

From there, we'll learn how to implement efficient multi-vector search in Qdrant, including the hybrid retrieval patterns that make late interaction practical at scale.
