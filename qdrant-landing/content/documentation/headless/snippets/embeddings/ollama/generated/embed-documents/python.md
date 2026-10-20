```python
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Ollama runs open models on your own hardware.",
]

response = ollama_client.embed(model=MODEL, input=documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=list(vector), payload={"text": documents[idx]})
        for idx, vector in enumerate(response.embeddings)
    ],
)
```
