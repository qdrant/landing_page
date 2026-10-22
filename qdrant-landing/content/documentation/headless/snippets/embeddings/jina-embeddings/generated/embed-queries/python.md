```python
query_vector = jina_embed(model=MODEL, task="retrieval.query", input=["What is Qdrant?"])[0][
    "embedding"
]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
