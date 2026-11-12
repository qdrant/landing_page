```python
query_vector = embed.text(
    texts=["What is Qdrant?"],
    model=MODEL,
    task_type="search_query",
)["embeddings"][0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
