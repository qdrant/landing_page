```python
query_vector = (
    upstage_client.embeddings.create(model="solar-embedding-2-query", input="What is Qdrant?")
    .data[0]
    .embedding
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
