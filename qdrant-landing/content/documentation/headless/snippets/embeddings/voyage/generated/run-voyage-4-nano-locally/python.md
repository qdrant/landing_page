```python
query_vector = vo.embed(
    ["What is Qdrant?"],
    model="voyage-4-nano",
    input_type="query",
    output_dimension=1024,
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
