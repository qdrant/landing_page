```python
query = "Vectors in Medicine"

client.query_points(
    collection_name="{minicoil_collection_name}",
    query=models.Document(
        text=query, 
        model="Qdrant/minicoil-v1"
    ), 
    using="minicoil",
    limit=1
)
```
