```python
query_vector = model.encode_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector.tolist(),
    limit=3,
).points
```
