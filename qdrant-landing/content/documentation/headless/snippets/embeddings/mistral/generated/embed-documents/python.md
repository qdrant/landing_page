```python
documents = [
    "Qdrant is a vector search engine.",
    "Mistral embedding models turn text into dense vectors.",
]

response = mistral_client.embeddings.create(model=MODEL, inputs=documents)

points = []
for item in response.data:
    assert item.index is not None and item.embedding is not None
    points.append(
        models.PointStruct(
            id=item.index,
            vector=item.embedding,
            payload={"text": documents[item.index]},
        )
    )

client.upsert(collection_name="{collection_name}", points=points)
```
