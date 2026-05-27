```python
client = QdrantClient(url="https://localhost:6333")

try:
    client.create_collection(
        collection_name="my_collection",
        vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
    )

    client.upsert(
        collection_name="my_collection",
        points=[models.PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4])],
    )
except Exception as e:
    print(e)  # 401 Unauthorized
```
