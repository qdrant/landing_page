```python
query_response = gemini_client.models.embed_content(
    model=MODEL,
    contents="task: search result | query: What is Qdrant?",
)
assert query_response.embeddings is not None
query_vector = query_response.embeddings[0].values
assert query_vector is not None

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_vector,
    limit=3,
).points
```
