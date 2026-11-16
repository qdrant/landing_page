```python
query_vector = vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
