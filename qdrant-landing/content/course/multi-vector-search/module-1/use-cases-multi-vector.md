---
title: "Use Cases for Multi-Vector Search"
description: Discover scenarios where multi-vector search outperforms single-vector embeddings and provides better retrieval quality.
weight: 3
---

{{< date >}} Module 1 {{< /date >}}

# Use Cases for Multi-Vector Search

**When is the added complexity of multi-vector search actually worth it?** Multi-vector representations require more storage, more computation, and more careful implementation than simple single-vector embeddings. So why bother?

The answer comes down to one core capability: **fine-grained matching**. In the previous lessons, you learned how late interaction preserves token-level representations and how MaxSim computes similarity through independent token matching. Now you'll see when this precision actually matters - and when it doesn't.

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

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-1/use-cases-multi-vector.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## The Power of Fine-Grained Matching

Single-vector embeddings compress entire documents and queries into single points in embedding space. This compression is a form of **lossy averaging** - all the nuanced details, specific requirements, and fine-grained semantics get blended into one representative vector. For many tasks, this works fine. But it fundamentally loses information.

**Multi-vector search preserves token-level information.** Instead of averaging "Python async database connection pooling" into one vector that represents the general topic, it maintains separate representations for each concept. As you learned in the MaxSim lesson, each query token independently finds its best match in the document, and these matches are summed, not averaged, to produce the final score.

This distinction is crucial. With single-vector search, a document that mentions Python and databases will likely get a moderate similarity score, even if it never discusses the specific combination you're looking for. With multi-vector search, **every query token must find a strong match** for the overall score to be high. This is token-level verification, not just topical matching.

<!-- TODO: Add diagram illustrating fine-grained matching concept

Visual elements:
- Left panel: Single-vector approach
  - Show query and document as single averaged embeddings (blobs in embedding space)
  - Label: "Lossy compression - all details averaged into one representation"
  - Similarity: single cosine distance

- Right panel: Multi-vector approach
  - Show query and document as sequences of token embeddings
  - Label: "Token-level preservation - each concept has its own representation"
  - Show token-to-token similarity computations with MaxSim aggregation
  - Highlight: "Each query token finds its best match independently"

Use contrasting colors to emphasize the difference in granularity.
-->

## A Concrete Demonstration

Let's move from theory to practice with a real-world example that shows exactly when multi-vector search makes a difference.

### The Scenario: A Technical Support Query

Consider a developer searching for a specific technical solution:

```python
query = "How can I prevent Python database connection " \
        "pool exhaustion in async web applications?"
```

This query has multiple specific requirements: Python, database connections, connection pooling, exhaustion problems, and async web applications. A truly relevant document should address all of these aspects together.

Now consider four documents with varying relevance:

```python
documents = [
    # Document A: Highly relevant - addresses all query aspects
    "When async tasks fail to return database connections, the pool "
    "becomes exhausted and requests start failing. Ensuring "
    "connections are closed after awaits prevents this.",

    # Document B: Partially relevant - mentions some concepts
    "Database resource exhaustion can occur due to limited pool sizes.",

    # Document C: Keyword-stuffed - contains related terms without substance
    "Understanding concurrency, async IO, and database performance in "
    "Python web applications.",

    # Document D: Completely irrelevant
    "Handling training for pythons should be done gradually, starting "
    "with short sessions and increasing duration as the snake becomes "
    "more comfortable.",
]
```

**What should happen?** Document A should rank highest - it's the only one that directly addresses the problem. Document B is partially relevant. Document C sounds relevant (it mentions Python, async, database, web applications) but provides no substantive answer. Document D is obviously irrelevant (despite containing "python").

Let's see how single-vector and multi-vector approaches handle this.

### Single-Vector Embeddings: Missing the Details

First, let's try the traditional approach using a single dense vector per document:

```python
from fastembed import TextEmbedding

# Load the BAAI/bge-small-en-v1.5 model
dense_model = TextEmbedding("BAAI/bge-small-en-v1.5")
```

Encode the query into a single 384-dimensional vector:

```python
dense_query_vector = next(dense_model.query_embed(query))
dense_query_vector.shape
```

Encode all documents into single vectors:

```python
import numpy as np

dense_vectors = np.array(list(dense_model.passage_embed(documents)))
dense_vectors.shape
```

Compute similarity scores using dot product:

```python
np.dot(dense_query_vector, dense_vectors.T)
```

**What happened?** The single-vector approach assigns very similar scores to Document A (highly relevant) and Document C (keyword-stuffed). Document C ranks nearly as high as Document A, even though it provides no actual solution!

The problem: by compressing all information into a single vector, the model captures **topical similarity** but misses whether the document actually addresses the specific requirements. Document C mentions the right topics (Python, async, database, web applications) but doesn't connect them meaningfully.

### Multi-Vector with ColBERT: Token-Level Verification

Now let's use ColBERT's multi-vector approach:

```python
from fastembed import LateInteractionTextEmbedding

# Load the colbert-ir/colbertv2.0 model
colbert_model = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
```

Encode the query into multiple token-level vectors:

```python
colbert_query_vector = next(colbert_model.query_embed(query))
colbert_query_vector.shape
```

Encode documents - note that each has a different number of token vectors:

```python
colbert_vectors = list(colbert_model.passage_embed(documents))
[cv.shape for cv in colbert_vectors]
```

Compute MaxSim scores for each document:

```python
for colbert_doc_vector in colbert_vectors:
    # For each document, compute similarity between all query-doc token pairs
    dot_product = np.dot(colbert_query_vector, colbert_doc_vector.T)
    # For each query token, take the maximum similarity with any doc token
    max_scores = dot_product.max(axis=1)
    # Sum these maximum similarities to get the final MaxSim score
    print(max_scores.sum())
```

**What happened?** ColBERT produces a clear ranking:
1. **Document A** (highly relevant) - highest score
2. **Document B** (partially relevant) - moderate score
3. **Document C** (keyword-stuffed) - lower score
4. **Document D** (irrelevant) - lowest score

Document C now correctly ranks **lower** than Documents A and B. The token-level verification catches that while Document C mentions related keywords, it lacks the specific technical details the query requires.

### Why the Difference?

**Single-vector behavior**: Document C gets inflated scores because it contains many topically-related terms. The averaging process captures "this document is about Python web development and databases" but can't verify whether it actually addresses connection pool exhaustion.

**ColBERT behavior**: Each query token must find strong matches in the document:
- "prevent" needs a match -> Document C has no solution-oriented content
- "connection pool exhaustion" needs specific matches -> Document C mentions these words separately but not in context
- "async" + "database" + "Python" must all connect -> Document C has them but not in the right relationship

**The key insight**: MaxSim's requirement that **every query token finds a strong match** prevents keyword-stuffing from inflating scores. It's not enough to mention the right topics - the document must contain those concepts with the right semantic relationships.

## When NOT to Use Multi-Vector Search

Multi-vector search isn't always necessary. Two scenarios where single-vector embeddings are preferable:

**Simple, broad queries**: When you're searching for general topical relevance rather than verifying specific requirements, single-vector embeddings work well. Queries like "Python tutorials" or "machine learning basics" seek documents about a topic, not documents containing multiple specific concepts. For these queries, the added precision of token-level matching doesn't provide significant value - topical similarity is exactly what you need.

**Resource-constrained environments**: Multi-vector search comes with substantial overhead:
- **Storage**: Multiple vectors per document instead of one (even thousands of them)
- **Memory**: All token vectors must be accessible during search
- **Computation**: MaxSim is incompatible with HNSW and requires computing similarities across all query-document token pairs

When deploying to systems with strict latency requirements, these costs may be prohibitive. In these cases, you're making a trade-off: accepting lower precision on complex queries to meet resource constraints. The precision benefits of multi-vector search apply regardless of collection size. Collection size affects whether you can afford the overhead, not whether you need the precision.

These resource considerations are real challenges you'll face in production. The next lesson examines them in detail.

## Conclusion

Multi-vector search excels at **fine-grained matching** - scenarios where you need to verify that ALL aspects of a query are present in a document, not just that they're topically related. By preserving token-level information rather than averaging it away, ColBERT and other late interaction models enable precision that single-vector embeddings cannot achieve.

When you have multi-requirement queries, need contextual precision, or must distinguish between partial and complete information, MaxSim's token-level verification provides clear advantages. Each query token independently finds its best match, and the aggregation ensures all requirements are strongly present.

But this power comes at a cost. In the next lesson, we'll examine the challenges: storing hundreds of vectors per document, computing MaxSim efficiently, and the indexing limitations you learned about in the MaxSim lesson. 
