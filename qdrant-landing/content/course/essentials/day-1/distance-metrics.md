---
title: Distance Metrics
weight: 2
---

{{< date >}} Day 1 {{< /date >}}

# Distance Metrics

The meaning of a data point is implicitly defined by its position in vector space. After vectors are stored, we can use their spatial properties to perform [nearest neighbor searches](/documentation/concepts/search/) that retrieve semantically similar items based on how close they are in this space.

However, the way we measure similarity or distance between vectors significantly impacts search quality, recall, and precision. Different metrics emphasize different aspects of similarity. The choice of metric depends on whether the focus is on direction, absolute distance, or magnitude differences between vectors.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

<br/>

### Cosine Similarity - Best for Normalized Semantic Embeddings

**Best for:** NLP embeddings, text similarity, semantic search  
**Works well when:** Magnitude is not important, only direction

Cosine similarity measures angular similarity between two vectors, ignoring magnitude and focusing only on whether vectors point in the same direction. This makes it ideal for text embedding comparisons, where similar words or sentences have close orientations in vector space.

**Formula:**
```
cos(θ) = (A · B) / (||A|| ||B||)
```

Where A · B is the dot product of vectors A and B, and ||A|| and ||B|| are the magnitudes (norms) of the vectors.

To simplify, it reflects whether the vectors have the same direction (similar) or are poles apart. Cosine similarity is commonly used with text representations to compare how similar two documents or sentences are to each other.

**Score Interpretation:**

| Score | Meaning |
|-------|---------|
| 1 | Identical vectors (maximum similarity) |
| 0 | Completely unrelated vectors |
| -1 | Opposite vectors (completely dissimilar) |

**Example use cases:**
- Comparing documents or search queries to find similar text
- Semantic search where text embeddings are compared based on meaning rather than word overlap

```python
# Example: Cosine similarity in Qdrant
from qdrant_client.models import Distance, VectorParams

collection_config = VectorParams(
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
- Text embeddings or semantic similarity (words like "happy" and "joyful" have similar meanings but may have very different numerical embeddings)
- Vectors with different scales or magnitudes (age 1-100 vs salary 10,000-500,000)
- When direction is more important than absolute value (recommendation systems)

```python
# Example: Euclidean distance in Qdrant
collection_config = VectorParams(
    size=2048,
    distance=Distance.EUCLID
)
```

### Manhattan Distance - Grid-Like Similarity

Manhattan Distance is similar to Euclidean Distance, but only allows movement along grid lines (horizontal and vertical), like moving through city blocks. If you are working with very high-dimensional data, such as text embeddings, Manhattan Distance can sometimes provide more stable similarity measurements since it is more resistant to outliers.

**Formula:**
```
d(A, B) = Σ |Aᵢ - Bᵢ|
```

Each dimension contributes linearly, preventing one large deviation from completely dominating the distance calculation.

**Best for:**
- High-dimensional embeddings where you want noise resistance
- Feature spaces with many independent dimensions
- When outliers in single dimensions should be dampened

**Important note:** Like Euclidean distance, it is still scale sensitive, so proper normalization is important.

### Dot Product Similarity - Best When Magnitude Matters

**Best for:** Recommendation systems, ranking-based retrieval  
**Works well when:** Both magnitude and direction matter

Unlike cosine similarity, dot product also considers the length of the vectors. This might be important when vector representations are built based on term (word) frequencies. The dot product similarity is calculated by multiplying the respective values in the two vectors and then summing those products.

**Formula:**
```
A · B = Σ (Aᵢ × Bᵢ)
```

The higher the sum, the more similar the two vectors are. If you normalize the vectors (so the numbers sum to 1), the dot product similarity becomes equivalent to cosine similarity.

**Example use cases:**
- Recommendation systems - if a user vector represents preferences, a larger dot product with an item vector means higher relevance
- Language models (LLMs) and transformer-based search - many embeddings from models like OpenAI's text-embedding-3 or BERT are not normalized, meaning their length (magnitude) carries information

**When Dot Product is a poor choice:**
- If you want to measure similarity regardless of vector magnitude (text similarity where sentence length shouldn't matter)
- If your data is sparse or has highly varied feature magnitudes
- If absolute distances between points matter more than alignment

```python
# Example: Dot product in Qdrant
collection_config = VectorParams(
    size=512,
    distance=Distance.DOT
)
```

## The Impact of Metric Choice

A practical way to understand how distance metrics affect search quality is by running the same search using different metrics and comparing the results.

**Step 1: Store Text Embeddings with Different Metrics**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

client = QdrantClient("http://localhost:6333")

for metric in [Distance.COSINE, Distance.EUCLID, Distance.DOT]:
    client.create_collection(
        collection_name=f"text_search_{metric.name.lower()}",
        vectors_config=VectorParams(size=768, distance=metric)
    )
```

**Step 2: Compare Search Results Using Different Metrics**

```python
query_vector = [0.15] * 768  # Example query embedding

# Run searches across all three metrics
for metric in ["cosine", "euclid", "dot"]:
    result = client.query_points(
        collection_name=f"text_search_{metric}",
        query=query_vector,
        limit=5
    )
    print(f"Top results using {metric} similarity:")
    print(result)
```

## When to Use Each Metric

| Metric | Best For | Example Use Case |
|--------|----------|------------------|
| **Cosine Similarity** | NLP, text search, semantic similarity | Finding similar news articles, document comparison |
| **Euclidean Distance** | Image embeddings, spatial data | Image similarity, clustering |
| **Manhattan Distance** | High-dimensional data, noise resistance | Text embeddings with outlier resistance |
| **Dot Product** | Recommendation systems, ranking tasks | Product recommendations, retrieval with weighted importance |

## Key Takeaways

1. **Cosine Similarity** ignores magnitude, focuses on direction - perfect for semantic search
2. **Euclidean Distance** measures absolute differences - great for spatial and image data  
3. **Manhattan Distance** provides more stable measurements in high dimensions
4. **Dot Product** considers both direction and magnitude - ideal for ranking systems
5. **Always test with your specific data** - the best metric depends on your use case
6. **Qdrant makes experimentation easy** with per-collection distance metrics

**Final thoughts:** Choosing the right distance metric is crucial for search quality. Experiment with different metrics in Qdrant to see how they impact search results!

Reference: [Distance Metrics in Qdrant Documentation](https://qdrant.tech/documentation/concepts/search/#metrics) 