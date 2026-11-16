```python
prefetch = [
    models.Prefetch(
        query=models.Document(text=query, model=dense_embedding_model),
        using="dense",
        limit=20,
    ),
    models.Prefetch(
        query=models.TextQuery(text=query),
        using="description",
        limit=20,
    ),
]

results = client.query_points(
    collection_name,
    prefetch=prefetch,
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    with_payload=True,
    limit=10,
)

pprint.pp(results.points)
```
