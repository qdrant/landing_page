```python
documents = [
    "Qdrant is a vector search engine.",
    "Mixedbread publishes open-weight embedding models on Hugging Face.",
]

embeddings = model.encode_document(documents)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=idx,
            vector=embedding.tolist(),
            payload={"text": documents[idx]},
        )
        for idx, embedding in enumerate(embeddings)
    ],
)
```
