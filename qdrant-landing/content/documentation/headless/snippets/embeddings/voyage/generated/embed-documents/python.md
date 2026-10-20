```python
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "Voyage AI embedding models turn text into dense vectors.",
]

response = vo.embed(documents, model="voyage-4-large", input_type="document")

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=vector, payload={"text": text})
        for idx, (vector, text) in enumerate(zip(response.embeddings, documents))
    ],
)
```
