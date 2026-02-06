```python
# Define the embedding model used by Cloud Inference
EMBEDDING_MODEL="sentence-transformers/all-minilm-l6-v2"

client.upload_points(
    collection_name=COLLECTION_NAME,
    points=[
        models.PointStruct(
            id=idx,
            vector=models.Document(
                text=doc["description"],
                model=EMBEDDING_MODEL # Cloud Inference generates embeddings with this model
            ),
            payload=doc
        )
        for idx, doc in enumerate(documents)
    ],
)
```
