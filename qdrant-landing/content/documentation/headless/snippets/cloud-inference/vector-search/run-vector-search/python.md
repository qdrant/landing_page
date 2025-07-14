```python
results = client.query_points(
    collection_name=collection_name,  # Replace with your collection
    prefetch=[
        models.Prefetch(
            query=dense_doc,
            using="dense_vector",
            limit=5
        ),
        models.Prefetch(
            query=sparse_doc,
            using="bm25_sparse_vector",
            limit=5
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=5,
    with_payload=True
)

print(results.points)
```