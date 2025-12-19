```python
client.create_collection(
    collection_name="{bm25_collection_name}",
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(
            modifier=models.Modifier.IDF
        )
    }
)
```
