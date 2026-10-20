```python
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "SIE serves open embedding models from one endpoint.",
]

vectors = vectorizer.embed_documents(documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": documents[idx]})
        for idx, vector in enumerate(vectors)
    ],
)
```
