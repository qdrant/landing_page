```python
documents = [
    "Qdrant is a vector search engine.",
    "Amazon Bedrock serves embedding models through the AWS SDKs.",
]

client.upsert(
    collection_name="{collection_name}",
    points=[
        models.PointStruct(id=idx, vector=embed(doc), payload={"text": doc})
        for idx, doc in enumerate(documents)
    ],
)
```
