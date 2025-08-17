---
title: Distance Metrics
weight: 2
---

{{< date >}} Day 1 {{< /date >}}

# Distance Metrics

In vector search, how we define distance determines how we define similarity. Once your data is embedded into vectors, you're working in a space where position encodes meaning. But "closeness" in that space is subjective - it depends entirely on the metric you measure it. And each metric tells a different story about similarity.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}


Let's break down the most common distance metrics: **Cosine Similarity**, **Euclidean Distance**, **Manhattan Distance**, and **Dot Product Similarity**, what they really measure, when to use them, and when to avoid them.

> **Reference:** For a complete overview of distance metrics in Qdrant, see the [Collections documentation](https://qdrant.tech/documentation/concepts/collections/).

## 1. Cosine Similarity – Best for Semantic Similarity

Cosine similarity is all about **direction**. It is defined as the cosine of the angle between two vectors:

**Formula:**
```
cos(θ) = (A · B) / (||A|| * ||B||)
```

Dot product of the vectors, divided by the product of their magnitudes.

The result is the cosine of the angle between them. **The smaller the angle, the higher the score.**

If two vectors are aligned, even if they're different lengths, the cosine similarity will be close to 1. That makes it ideal when direction carries meaning, but magnitude doesn't. 

Like in NLP, where "joyful" and "happy" might map to vectors with different lengths but still point in the same semantic direction.

### When to Use Cosine Similarity

**Perfect for:**
- **Text embeddings and semantic similarity**
- **Document comparison** where length shouldn't matter
- **Recommendation systems** based on preferences
- **Any scenario where direction matters more than magnitude**

### When to Avoid

**However, if the length of your vectors carries information, like importance, weight, or confidence, cosine will ignore that.**

```python
# Example: Cosine similarity in Qdrant
from qdrant_client.models import Distance, VectorParams

collection_config = VectorParams(
    size=384,
    distance=Distance.COSINE
)
```

## 2. Euclidean Distance – Best for Absolute Difference

Euclidean distance captures the **straight-line distance** between two points.

The formula is the classic Pythagorean distance:

**Formula:**
```
d(A, B) = √Σ (Aᵢ - Bᵢ)²
```

It captures **absolute difference in value** across all dimensions. Useful when every dimension matters equally. Image embeddings, sensor data, spatial coordinates, anything where numerical difference is meaningful.

### When to Use Euclidean Distance

**Perfect for:**
- **Image embeddings** where pixel differences matter
- **Spatial coordinates** (geographic locations)
- **Sensor data** where absolute values are important
- **Clustering algorithms** like K-Means

### The Catch: Scale Sensitivity

**But there's a catch: Euclidean distance is scale sensitive.** One large feature—like "salary" in dollars—can completely overwhelm a smaller one, like "age." So unless your vectors are properly scaled or normalized, the results can be misleading.

**Avoid it if you're comparing semantic vectors.**

```python
# Example: Euclidean distance in Qdrant
collection_config = VectorParams(
    size=2048,
    distance=Distance.EUCLID
)
```

## 3. Manhattan Distance – Best for Grid-Like Differences

Euclidean Distance is similar to Manhattan Distance; however, **Manhattan Distance only allows movement along the grid lines** (horizontal and vertical).

The formula sums the absolute differences across all dimensions:

**Formula:**
```
d(A, B) = Σ |Aᵢ - Bᵢ|
```

**Manhattan distance in particular can sometimes provide more stable similarity measurements** because large deviations in a single dimension do not dominate the overall distance as much as they do with Euclidean.

### When to Use Manhattan Distance

**Perfect for:**
- **High-dimensional embeddings** where you want noise resistance
- **Feature spaces** with many independent dimensions
- **When outliers in single dimensions should be dampened**

### Important Note

However, like Euclidean distance, **it is still scale sensitive, so proper normalization is important.**

## 4. Dot Product – Best When Magnitude Matters

The dot product measures similarity **with magnitude in mind**. You multiply each dimension and sum it up:

**Formula:**
```
A · B = Σ (Aᵢ * Bᵢ)
```

It rewards vectors that are not just aligned—**but also large**. So if two vectors point the same way, the longer one gets a higher similarity score.

That matters in systems where **magnitude is part of the signal**—like recommendation engines, where a large user vector might indicate strong preference, or a long document might be weighted more heavily.

### When to Use Dot Product

**Perfect for:**
- **Recommendation systems** where strength of preference matters
- **Ranking systems** where magnitude indicates importance
- **Document weighting** where longer content should rank higher
- **Any scenario where both direction AND magnitude carry meaning**

### The Issue with Dot Product

**But here's the issue:** If your data varies in length without meaning to, like inconsistent document sizes or uneven feature counts, the dot product can give inflated similarity scores. In those cases, you might want to normalize, or use cosine instead.

```python
# Example: Dot product in Qdrant
collection_config = VectorParams(
    size=512,
    distance=Distance.DOT
)
```

## So How Do You Choose?

**There's no universal best.** Your choice depends on your data and what you mean by "similar."

| Metric | What it captures | Typical Use |
|--------|------------------|-------------|
| **Cosine** | Direction | Semantic similarity, text embeddings |
| **Euclidean** | Absolute distance | Images, spatial data, coordinates |
| **Manhattan** | Absolute distance (grid-like) | High-dimensional embeddings, noise-resistant similarity |
| **Dot Product** | Direction + magnitude | Ranking, recommendations, weighted systems |

## Testing Different Metrics

**If you're not sure? Test it.** Store the same data using different metrics and compare the results. Qdrant lets you set the distance metric per collection, so it's easy to experiment.

```python
# Create collections with different metrics for comparison
metrics_to_test = [
    ("cosine_collection", Distance.COSINE),
    ("euclidean_collection", Distance.EUCLID), 
    ("manhattan_collection", Distance.MANHATTAN),
    ("dot_collection", Distance.DOT)
]

for name, metric in metrics_to_test:
    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=384, distance=metric)
    )
    
    # Insert the same data and compare search results
    # ... (insert your data and test queries)
```

### Practical Testing Approach

1. **Create multiple collections** with the same data but different metrics
2. **Run identical queries** across all collections
3. **Compare the top results** - which metric returns more relevant matches?
4. **Measure performance** - some metrics are faster than others
5. **Choose based on your specific use case** and quality requirements

## Key Takeaways

1. **Cosine Similarity** ignores magnitude, focuses on direction - perfect for semantic search
2. **Euclidean Distance** measures absolute differences - great for spatial and image data
3. **Manhattan Distance** provides more stable measurements in high dimensions
4. **Dot Product** considers both direction and magnitude - ideal for ranking systems
5. **Always test with your specific data** - the best metric depends on your use case
6. **Qdrant makes experimentation easy** with per-collection distance metrics

Understanding these fundamental differences will help you choose the right similarity measure for your vector search applications, leading to more accurate and relevant results. 