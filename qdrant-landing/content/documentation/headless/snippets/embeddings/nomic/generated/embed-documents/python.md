```python
documents = [
    "Qdrant is a vector search engine.",
    "Nomic Embed models turn text into dense vectors.",
    "Paris is the capital of France.",
]

output = embed.text(texts=documents, model=MODEL, task_type="search_document")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": documents[idx]})
        for idx, vector in enumerate(output["embeddings"])
    ],
)
```
