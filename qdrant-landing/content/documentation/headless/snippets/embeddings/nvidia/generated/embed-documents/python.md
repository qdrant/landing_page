```python
documents = [
    "Qdrant is a vector database and similarity search engine.",
    "NVIDIA Nemotron embedding models turn text into dense vectors.",
]

response = nvidia.embeddings.create(
    model=MODEL,
    input=documents,
    encoding_format="float",
    extra_body={"input_type": "passage", "truncate": "END"},
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
