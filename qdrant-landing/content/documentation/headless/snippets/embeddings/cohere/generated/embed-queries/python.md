```python
response = co.embed(
    model="embed-v5.0-fast",
    input_type="search_query",
    texts=["What is Qdrant?"],
    embedding_types=["float"],
)
query_vectors = response.embeddings.float_
assert query_vectors is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vectors[0],
    limit=3,
).points
```
