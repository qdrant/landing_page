```python
client.create_vector_name(
    collection_name=COLLECTION,
    vector_name=NEW_VECTOR,
    vector_name_config=models.DenseVectorNameConfig(
        dense=models.DenseVectorConfig(
            size=512,  # Size of the new embedding vectors
            distance=models.Distance.COSINE  # Similarity function for the new model
        )
    ),
)
```
