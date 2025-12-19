```python
client.create_collection(
    collection_name="{minicoil_collection_name}",
    sparse_vectors_config={
        "minicoil": models.SparseVectorParams(
            modifier=models.Modifier.IDF #Inverse Document Frequency
        )
    }
)
```
