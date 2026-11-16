```python
documents = [
    "Qdrant is a vector search engine.",
    "Cohere Embed models turn text and images into dense vectors.",
]

response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    texts=documents,
    embedding_types=["float"],
)
vectors = response.embeddings.float_
assert vectors is not None

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": text})
        for idx, (vector, text) in enumerate(zip(vectors, documents))
    ],
)
```
