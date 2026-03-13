```python
client.create_collection(
    collection_name=NEW_COLLECTION,
    vectors_config=(
        models.VectorParams(
            size=512,  # Size of the new embedding vectors
            distance=models.Distance.COSINE  # Similarity function for the new model
        )
    )
)
```
