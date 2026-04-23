```python
results = client.query_points(
    collection_name,
    query=models.Document(text=query, model=sparse_embedding_model),
    using="sparse",
    limit=10,
)

pprint.pp(results.points)
```
