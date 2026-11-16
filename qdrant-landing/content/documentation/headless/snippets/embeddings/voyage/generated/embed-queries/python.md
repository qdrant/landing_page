```python
query_vector = vo.embed(
    ["What is Qdrant?"], model="voyage-4-large", input_type="query"
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
