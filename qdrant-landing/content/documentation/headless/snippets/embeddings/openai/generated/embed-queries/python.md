```python
query_vector = (
    openai_client.embeddings.create(model=MODEL, input="What is Qdrant?")
    .data[0]
    .embedding
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
