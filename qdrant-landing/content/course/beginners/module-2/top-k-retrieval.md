---
title: "Top-K Retrieval"
short_description: "Module 2 of the Beginner Course: how a query becomes a vector and returns the K closest points."
description: "See how Qdrant turns a query into a vector and returns the K most similar points, ranked by similarity score."
weight: 4
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# Top-K Retrieval

A search query is converted into a vector using the same embedding model used to embed your documents. Qdrant finds the K points in the collection whose vectors are most similar to the query vector, ranked by similarity score.

```python
results = client.query_points(
    collection_name="articles",
    query=[0.12, -0.87, 0.33, ...],   # your query vector
    limit=3,                            # return top 3
)

for r in results.points:
    print(r.id, r.score, r.payload)
```

![Eight candidates ranked by score, with the top three returned.](/courses/beginners/module-2/top-k.png)

### Why K Matters

Returning too few results (K=3) misses relevant content. Returning too many (K=100) creates noise in results. A common approach is to overfetch: retrieve a larger candidate pool, then rerank it down to the smaller K you actually show the user. Qdrant supports this natively via [multi-stage queries](/documentation/search/hybrid-queries/#multi-stage-queries) - for example, prefetching a large candidate set and reranking it down to a much smaller final `limit`. We'll cover reranking in detail later.
