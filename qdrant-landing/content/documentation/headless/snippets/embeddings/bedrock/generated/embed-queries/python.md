```python
hits = client.query_points(
    collection_name="{collection_name}",
    query=embed("What is Qdrant?"),
    limit=3,
).points
```
