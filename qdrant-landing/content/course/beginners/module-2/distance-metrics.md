---
title: "Distance Metrics"
short_description: "Module 2 of the Beginner Course: choose the distance metric your embedding model was trained for."
description: "Choose a distance metric when you create a collection. Learn why cosine similarity fits most text embeddings, and how to match the metric to your model."
weight: 3
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# Distance Metrics

When you query a collection, Qdrant compares your query vector with the stored vectors using the distance metric you chose when creating the collection. For text embeddings, cosine similarity is the most common metric.

Checking every vector would be too slow for large collections. Instead, Qdrant uses an HNSW index to find the closest matches efficiently without scanning the entire collection. [Fast Approximate Search: HNSW](/course/beginners/module-2/hnsw/) explains how it works.

| Metric | Notes |
|--------|-------|
| models.Distance.COSINE | Measures angle between vectors. Robust to magnitude differences. |
| models.Distance.DOT | Faster than cosine when vectors are unit-length at index time. |
| models.Distance.EUCLID | Measures absolute distance. Sensitive to vector magnitude. |
| models.Distance.MANHATTAN | Sum of absolute differences. Less sensitive to outliers than Euclidean; use when the embedding model was trained with L1. |

<aside role="status">
Choose a distance metric when you create a collection. The metric applies to the vector configuration for that collection, so choose one that your embedding model was trained on. Most sentence-transformer models, including the one used in Module 1, work with cosine similarity.

 If you choose the wrong metric, you have two options. You can create a new collection with the correct metric and re-ingest your data. A <a href="/documentation/manage-data/collections/#collection-aliases">collection alias</a> lets you switch to the new collection without changing your application.

Since v1.18, you can also add a second named vector with the correct metric to the existing collection. Re-embed your points into the new vector, then remove the old one. See <a href="/documentation/manage-data/collections/#update-vector-schema">Update Vector Schema</a> for details.
</aside>
