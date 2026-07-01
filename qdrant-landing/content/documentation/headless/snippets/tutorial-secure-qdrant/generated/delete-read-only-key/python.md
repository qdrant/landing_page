```python
client = QdrantClient(url="https://localhost:6333", api_key="my-read-only-key")

try:
    client.delete(
        collection_name="my_collection",
        points_selector=models.PointIdsList(points=[1]),
    )
except Exception as e:
    print(e)  # 403 Forbidden
```
