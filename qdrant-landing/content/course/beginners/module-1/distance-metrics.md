---
title: "Comparing Meaning: Distance Metrics"
short_description: "Module 1 of the Beginner Course: measure how close two meanings sit using cosine similarity."
description: "Measure meaning with cosine similarity. Score related and unrelated phrases with NumPy, and see how context changes the similarity between two texts."
weight: 5
isLesson: true
---

{{< date >}} Module 1 {{< /date >}}

# Comparing Meaning: Distance Metrics

Once we have vectors, we need a way to measure how similar two of them are. Different metrics suit different situations.

### Cosine Similarity

Cosine similarity measures the angle between two vectors. Vectors pointing in a similar direction score closer to 1. Vectors pointing in different directions score lower. It ignores vector length. For text embeddings, direction often carries more useful information about meaning than length does. This makes cosine similarity a common choice for semantic search.

$$
\text{cosine\_similarity}(A, B) = \frac{A \cdot B}{\lVert A \rVert \, \lVert B \rVert}
$$

Here, $A \cdot B$ is the **dot product**: multiply each pair of matching values in the two vectors and add the results. $\lVert A \rVert$ is the vector's length, also called its magnitude. Dividing by both vector lengths removes the effect of vector size, so the score measures their angle instead.

![Cosine similarity measures the angle between two vectors: a smaller angle gives a score closer to 1, unrelated vectors score near 0, and opposite vectors score near -1](/courses/beginners/module-1/cosine-similarity.png)

For example, embedding "car repair" and "automobile maintenance" and comparing the two vectors with this formula yields a similarity score around 0.73, far higher than an unrelated pair would score, reflecting their shared meaning despite having no words in common.

### Try It Yourself: Compare Cosine Scores

Reuse the embedding snippet from [How It Works: Embeddings](/course/beginners/module-1/embeddings/) to embed three query/document pairs, then score each pair with cosine similarity, using the formula above implemented directly with NumPy.

<aside role="status">This snippet computes cosine similarity by hand with NumPy so you can see the formula at work. It's for teaching only, when you search with Qdrant, this comparison happens for you internally, you never write this loop yourself.</aside>

```python
from fastembed import TextEmbedding
import numpy as np

model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

pairs = [
    ("car repair", "automobile maintenance"),                    # synonyms
    ("cheap flights to New York", "affordable airfare to NYC"),  # paraphrase
    ("cheap flights to New York", "best pizza in Chicago"),      # unrelated
]

for query, document in pairs:
    query_vec = list(model.embed([query]))[0]
    doc_vec = list(model.embed([document]))[0]
    score = cosine_similarity(query_vec, doc_vec)
    print(f"{score:.3f}  |  {query!r}  vs  {document!r}")

# Expected output:
#   0.733  |  'car repair'  vs  'automobile maintenance'
#   0.821  |  'cheap flights to New York'  vs  'affordable airfare to NYC'
#   0.332  |  'cheap flights to New York'  vs  'best pizza in Chicago'
```

**What to look for:**

- The synonym and paraphrase pairs (0.733, 0.821) score high despite sharing almost no words.
- The unrelated pair (0.332) scores far lower, reflecting different meaning.

**Your turn:** Run this block (it reuses `model` and `cosine_similarity` from above) to test a **polysemy** case, where the same word has more than one meaning. See how extra context changes the score:

```python
polysemy_pairs = [
    ("apple stock", "shares of a tech company"),
    ("apple stock", "a crisp red fruit"),
    ("Apple Inc. stock price", "shares of a tech company"),
]

for query, document in polysemy_pairs:
    query_vec = list(model.embed([query]))[0]
    doc_vec = list(model.embed([document]))[0]
    score = cosine_similarity(query_vec, doc_vec)
    print(f"{score:.3f}  |  {query!r}  vs  {document!r}")
```

Does `"apple stock"` score higher against the finance sense or the fruit sense, and does that match the sense you meant? Then compare that first score to the third row: does spelling out `"Apple Inc."` instead of `"apple"` pull the score toward the finance sense, and by how much?

### Distance Metric Comparison

| Metric | Common use | Notes |
|--------|----------|-------|
| Cosine | Text similarity, NLP (Natural Language Processing) models | Compares vector direction and ignores vector length. A common default for text embeddings. |
| Dot product | Vectors already normalized to unit length | Produces the same ranking as cosine similarity when every vector has unit length. |
| Euclidean (L2) | Image embeddings, spatial data | Measures the straight-line distance between vectors. Both direction and length affect the score. |
| Manhattan (L1) | Grid-like or count-based data | Adds the absolute difference for each dimension. Less common for text embeddings. |

**Cosine vs. dot product:** When vectors are normalized to unit length, cosine similarity and dot product produce the same ranking. In that case, dot product is a simpler way to calculate the same result. Qdrant normalizes vectors when you use cosine distance, then uses dot product internally during search.
