```python
TASK = "Given a web search query, retrieve relevant passages that answer the query"

query_vector = ollama_client.embed(
    model=MODEL,
    input=f"Instruct: {TASK}\nQuery:What is Qdrant?",
).embeddings[0]

hits = client.query_points(
    collection_name="{collection_name}",
    query=list(query_vector),
    limit=3,
).points
```
