```python
client.upsert(
    collection_name=collection_name,
    points=[PointStruct(
        id=uuid.uuid4().hex,
        payload={"text": "The best way to start a Thursday is with a cup of coffee", "datetime": "2026-01-08T07:57:47"},
        vector={
            "dense_vector": Document(text="The best way to start a Thursday is with a cup of coffee", model=dense_model)
        })],
    shard_key_selector=today
)
```