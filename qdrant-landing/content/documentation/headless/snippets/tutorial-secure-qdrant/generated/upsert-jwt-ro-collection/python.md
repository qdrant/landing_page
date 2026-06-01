```python
client = QdrantClient(url="https://localhost:6333", api_key="<your-jwt>")

try:
    client.upsert(
        collection_name="other_collection",
        points=[models.PointStruct(id=2, vector=[0.5, 0.6, 0.7, 0.8])],
    )
except Exception as e:
    print(e)  # 403 Forbidden
```
