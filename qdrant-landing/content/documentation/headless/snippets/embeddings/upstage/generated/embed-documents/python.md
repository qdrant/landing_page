```python
documents = [
    "Qdrant is a vector search engine.",
    "Upstage Solar Embedding models turn text into dense vectors.",
]

response = upstage_client.embeddings.create(
    model="solar-embedding-2-passage",
    input=documents,
)

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(
            id=item.index,
            vector=item.embedding,
            payload={"text": documents[item.index]},
        )
        for item in response.data
    ],
)
```
