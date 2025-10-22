---
title: Distance Metrics
weight: 2
---

{{< date >}} Day 1 {{< /date >}}

# Distance Metrics

The meaning of a data point is implicitly defined by its position in vector space. After vectors are stored, we can use their spatial properties to perform [nearest neighbor searches](/documentation/concepts/search/) that retrieve semantically similar items based on how close they are in this space.

However, the way we measure similarity or distance between vectors significantly impacts search quality, recall, and precision. Different metrics emphasize different aspects of similarity. The choice of metric depends on whether the focus is on direction, absolute distance, or magnitude differences between vectors.

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

### Cosine Similarity - Best for Normalized Semantic Embeddings

**Best for:** NLP embeddings, text similarity, semantic search  
**Works well when:** Magnitude is not important, only direction

Cosine similarity measures angular similarity between two vectors, ignoring magnitude and focusing only on whether vectors point in the same direction. This makes it ideal for text embedding comparisons, where similar words or sentences have close orientations in vector space.

<aside role="status">For search efficiency, Qdrant implements Cosine similarity as a dot-product over normalized vectors. Vectors are automatically normalized during upload when the collection's distance metric is set to `Cosine`.</aside>

**Formula:**
```
cos(θ) = (A · B) / (||A|| ||B||)
```

Where A · B is the dot product of vectors A and B, and ||A|| and ||B|| are the magnitudes (norms) of the vectors.

To simplify, it reflects whether the vectors have the same direction (similar) or are poles apart. Cosine similarity is commonly used with text representations to compare how similar two documents or sentences are to each other.


**Score Interpretation:**

| Score | Meaning |
|-------|---------|
| 1 | Proportional vectors (perfectly similar) |
| 0 | Orthogonal vectors (unrelated) |
| -1 | Opposite vectors (perfectly dissimilar) |

**Example use cases:**
- Semantic search where text embeddings are compared based on meaning rather than word overlap

```python
# Example: Cosine similarity in Qdrant
from qdrant_client.models import Distance, VectorParams

vectors_config = VectorParams(
    size=384,
    distance=Distance.COSINE
)
```

### Euclidean Distance (L2 Distance) - Measures Absolute Distance

**Best for:** Spatial data, numerical feature embeddings, clustering  
**Works well when:** Both magnitude and position in space are important

Euclidean distance calculates the straight-line distance between two points in multi-dimensional space. It's useful when the exact numerical difference between vectors is critical, such as finding the nearest stores, restaurants, or locations based on latitude and longitude.

**Formula:**
```
d(A, B) = √Σ(A₁ - B₁)² + (A₂ - B₂)² + ... + (Aₙ - Bₙ)²
```

It measures the straight-line distance between two points in space, ideal when absolute differences between feature values matter. However, it can be sensitive to scale, meaning it may not work well for high-dimensional embeddings without normalization.

**Example use cases:**
- Image similarity search - finding visually similar images based on pixel embeddings
- Clustering algorithms (e.g., K-Means) - assigning points to the closest cluster center

**When you should NOT use Euclidean Distance:**
- Vectors with different scales or magnitudes (age 1-100 vs salary 10,000-500,000)
- When direction is more important than absolute value (recommendation systems)

```python
# Example: Euclidean distance in Qdrant
vectors_config = VectorParams(
    size=2048,
    distance=Distance.EUCLID
)
```

### Manhattan Distance - Grid-Like Similarity

Manhattan Distance is similar to Euclidean Distance, but only allows movement along grid lines (horizontal and vertical), like moving through city blocks. It can be more robust to outliers in a single dimension compared to Euclidean distance, as it doesn't square the differences.


**Formula:**
```
d(A, B) = Σ |Aᵢ - Bᵢ|
```

Each dimension contributes linearly, preventing one large deviation from completely dominating the distance calculation.

**Best for:**
- Feature spaces where dimensions are independent and represent distinct attributes (e.g., a vector where dimensions are [age, income, years_of_experience]).
- Use cases where you want to dampen the effect of large deviations in a single dimension.


**Important note:** Like Euclidean distance, it is still scale sensitive, so proper normalization is important.

### Dot Product Similarity - Best When Magnitude Matters

**Best for:** Recommendation systems, ranking-based retrieval  
**Works well when:** Both magnitude and direction matter

Unlike cosine similarity, dot product also considers the length of the vectors. This might be important when vector representations are built based on term (word) frequencies. The dot product similarity is calculated by multiplying the respective values in the two vectors and then summing those products.

**Formula:**
```
A · B = Σ (Aᵢ × Bᵢ)
```

The higher the sum, the more similar the two vectors are. If you normalize the vectors to have a unit length (i.e., a magnitude of 1), the dot product similarity becomes mathematically equivalent to cosine similarity.

**Example use cases:**
- Recommendation systems - if a user vector represents preferences, a larger dot product with an item vector means higher relevance
- Language models (LLMs) and transformer-based search - many embeddings from models like OpenAI's text-embedding-3 or BERT are not normalized, meaning their length (magnitude) carries information

**When Dot Product is a poor choice:**
- If you want to measure similarity regardless of vector magnitude (text similarity where sentence length shouldn't matter)
- If absolute distances between points matter more than alignment

```python
# Example: Dot product in Qdrant
vectors_config = VectorParams(
    size=512,
    distance=Distance.DOT
)
```

## When to Use Each Metric

| Metric | Best For | Example Use Case |
|--------|----------|------------------|
| **Cosine Similarity** | NLP, text search, semantic similarity | Finding similar news articles, document comparison |
| **Euclidean Distance** | Image embeddings, spatial data | Image similarity, clustering |
| **Manhattan Distance** | Grid-like data, dampening outliers | Logistics (city-block distance), certain types of feature-engineered vectors where dimensions are independent. |
| **Dot Product** | Recommendation systems, ranking tasks | Product recommendations, retrieval with weighted importance |

## Key Takeaways

1. **Cosine Similarity** ignores magnitude, focuses on direction - perfect for semantic search
2. **Euclidean Distance** measures absolute differences - great for spatial and image data  
3. **Manhattan Distance** can be more robust to outliers than Euclidean and is suited for grid-like feature spaces.
4. **Dot Product** considers both direction and magnitude - ideal for ranking systems
5. **Always test with your specific data** - the best metric depends on your use case
6. **Qdrant makes experimentation easy** with per-collection distance metrics

**Final thoughts:** Choosing the right distance metric is crucial for search quality. Experiment with different metrics in Qdrant to see how they impact search results!

Reference: [Distance Metrics in Qdrant Documentation](https://qdrant.tech/documentation/concepts/search/#metrics) 