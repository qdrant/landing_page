```python
client.create_collection(
    collection_name="docs",
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
        "late_interaction": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
        ),
    },
)

client.query_points(
    collection_name="docs",
    prefetch=models.Prefetch(query=dense_query, using="dense", limit=100),
    query=late_interaction_query,  # one vector per query token
    using="late_interaction",
    limit=10,
)
```
