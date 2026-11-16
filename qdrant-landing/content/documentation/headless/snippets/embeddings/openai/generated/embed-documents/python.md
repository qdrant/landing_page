```python
documents = [
    "Qdrant is a vector search engine.",
    "OpenAI embedding models turn text into dense vectors.",
]

response = openai_client.embeddings.create(model=MODEL, input=documents)

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
