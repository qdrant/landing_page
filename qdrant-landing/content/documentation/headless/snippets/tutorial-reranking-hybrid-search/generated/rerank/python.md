```python
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.Document(text=query, model=sparse_embedding_model),
        using="sparse",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.Document(text=query, model=late_interaction_embedding_model),
    using="multi",
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
```
