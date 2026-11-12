```python
query_vector = (
    mistral_client.embeddings.create(model=MODEL, inputs=["What is Qdrant?"])
    .data[0]
    .embedding
)
assert query_vector is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
