```python
client.create_vector_name(
    collection_name="docs",
    vector_name="mean_pooled",
    vector_name_config=models.DenseVectorNameConfig(
        dense=models.DenseVectorConfig(size=128, distance=models.Distance.COSINE),
    ),
)

# At ingestion, store doc_tokens.mean(axis=0) in a "mean_pooled" vector.
query_pooled = query_tokens.mean(axis=0)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=query_pooled, using="mean_pooled", limit=500),
    query=query_tokens,
    using="late_interaction",
    limit=10,
)
```
