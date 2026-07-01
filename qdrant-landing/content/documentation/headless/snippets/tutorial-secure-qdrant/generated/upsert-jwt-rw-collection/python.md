```python
client = QdrantClient(url="https://localhost:6333", api_key="<your-jwt>")

client.upsert(
    collection_name="my_collection",
    points=[models.PointStruct(id=2, vector=[0.5, 0.6, 0.7, 0.8])],
)
```
