---
title: "Distance Metrics"
description: Learn how distance metrics like cosine, Euclidean, Manhattan, and dot product shape vector similarity in Qdrant. Discover which metric fits your data and use case. 
weight: 3
---

{{< date >}} Day 1 {{< /date >}}

# Distance Metrics

After vectors are stored, we can use their spatial properties to perform [nearest neighbor searches](/documentation/concepts/search/) that retrieve semantically similar items based on how close they are in this space.

The position of a vector in embedding space only reflects meaning as far as the embedding model has learned to encode it. The model and its training objective tell you what "close" means.


<div class="video">
<iframe 
  src="https://www.youtube.com/embed/mUMftLNSozs?si=AYzWCtF3ukU2yNZd"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

## Quick rule of thumb

Most users do **not** need to design a distance metric from scratch:

- If you use a **third-party embedding model** (OpenAI, Cohere, Hugging Face, etc.):
  - Use the distance metric recommended in the model docs (often cosine or dot product).
  - Create your Qdrant collection with that metric.
- If the model docs **do not say** which metric to use:
  - Pick `Cosine` in Qdrant.
  - Qdrant will automatically normalize your vectors in Cosine collections. Once vectors are L2-normalized, Cosine, Dot Product, and Euclidean distance give the same ranking for a fixed query, which makes Cosine a safe default when you’re unsure.

The rest of this page is most useful when you train your **own embedding model** or work with **hand-crafted numeric features**.


### Cosine Similarity

- **Common Use Cases:** NLP embeddings, semantic search, document retrieval.
- **Focus:** Direction (Orientation). Magnitude is ignored.

Cosine similarity measures the angular similarity between two vectors. It focuses on whether vectors point in the same direction rather than on their length. This aligns well with many text embeddings, where the angle encodes meaning and the length is less important.

**Formula:**
```
cos(θ) = (A · B) / (||A|| ||B||)
```

Where `A · B` is the dot product of vectors `A` and `B`, and `||A||` and `||B||` are their magnitudes (norms).

<aside role="status">For search efficiency, Qdrant implements Cosine similarity as a dot-product over normalized vectors. Vectors are automatically normalized during upload when the collection's distance metric is set to `Cosine`.</aside>

**Score Interpretation:**

| Score | Meaning            |
| ----- | ------------------ |
| 1     | Same direction     |
| 0     | Orthogonal vectors |
| -1    | Opposite direction |


```python
# Example: Cosine similarity in Qdrant
from qdrant_client.models import Distance, VectorParams

vectors_config = VectorParams(
    size=384,
    distance=Distance.COSINE
)
```

### Dot Product Similarity

- **Common Use Cases:** Recommendation systems, matrix factorization, ranking.
- **Focus:** Both Magnitude and Direction.

Dot product similarity is calculated by multiplying the respective values in the two vectors and then summing those products. Unlike Cosine, this metric considers vector length.

**Formula:**
```
A · B = Σ (Aᵢ × Bᵢ)
```

**Key Nuance:**
For vectors with controlled norms (e.g., constrained by the model), a higher dot product indicates greater similarity. **If you normalize vectors to unit length (norm = 1), the dot product becomes mathematically identical to cosine similarity.**

**When to use:**
- **Recommendation systems:** If a user vector represents preferences, a larger dot product with an item vector usually means higher relevance.
- **Asymmetric Search:** When one vector (e.g., a query) is short and the document vector is long, and that length implies "more information" or "higher confidence."

```python
# Example: Dot product in Qdrant
vectors_config = VectorParams(
    size=512,
    distance=Distance.DOT
)
```

### Euclidean Distance (L2 Distance)

- **Common Use Cases:** Spatial data, anomaly detection, clustering.
- **Focus:** Absolute distance between points.

Euclidean distance calculates the straight-line distance between two points in multi-dimensional space. It is often used when the exact numeric difference between vectors matters, such as in clustering algorithms (e.g., K-Means).

**Formula:**
```
d(A, B) = √Σ(A₁ - B₁)² + (A₂ - B₂)² + ... + (Aₙ - Bₙ)²
```

**Key Nuance:**
Euclidean distance is sensitive to scale. If one feature ranges from 1–100 and another from 10,000–500,000, the larger-range feature will dominate the distance calculation. It is usually necessary to standardize or normalize features before using Euclidean distance.

```python
# Example: Euclidean distance in Qdrant
vectors_config = VectorParams(
    size=2048,
    distance=Distance.EUCLID
)
```

### Manhattan Distance 

- **Common Use Cases:** Sparse data, robust outlier handling.
- **Focus:** Grid-based distance (sum of absolute differences).

Manhattan Distance is similar to Euclidean Distance but calculates distance as if moving along grid lines (horizontal and vertical).

**Formula:**
```
d(A, B) = Σ |Aᵢ - Bᵢ|
```

**Key Nuance:**
Each dimension contributes linearly to the distance. A large deviation in a single dimension increases the distance linearly, rather than quadratically (as in Euclidean). This makes Manhattan distance less sensitive to extreme outliers in single dimensions.

```python
# Example: Manhattan distance in Qdrant
vectors_config = VectorParams(
    size=128,
    distance=Distance.MANHATTAN
)
```

## Summary: When to Use Each Metric

If you are training your own model or designing custom features, use these guidelines:

| Metric | Common Application | Why? |
| :--- | :--- | :--- |
| **Cosine Similarity** | NLP, Semantic Search | Ignores magnitude; focuses on semantic meaning (direction). |
| **Dot Product** | Recommendations, Ranking | Captures both direction and magnitude (importance/popularity). |
| **Euclidean Distance** | Spatial Data, Anomaly Detection | Measures absolute physical or numerical distance. |
| **Manhattan Distance** | Sparse/Tabular Data | More robust to outliers than Euclidean. |

## Key Takeaways

1.  **Check the Docs:** If you use a third-party embedding model, use the metric suggested in its documentation.
2.  **The Safe Default:** If the documentation is unclear, pick **Cosine**. Qdrant normalizes vectors for Cosine collections, ensuring consistent ranking behavior.
3.  **Custom Models:** If you train your own model, the metric defines how "closeness" is measured:
    *   **Cosine** focuses on direction.
    *   **Euclidean** measures straight-line distance (sensitive to scale).
    *   **Manhattan** measures grid distance (robust to outliers).
    *   **Dot product** accounts for magnitude and direction.
4.  **Experiment:** Qdrant allows you to set distance metrics per collection, making it easy to A/B test different metrics on your specific data.

Reference: [Distance Metrics in Qdrant Documentation](https://qdrant.tech/documentation/concepts/search/#metrics) 