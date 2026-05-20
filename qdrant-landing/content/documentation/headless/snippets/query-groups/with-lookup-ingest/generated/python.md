```python
client.upsert(
    collection_name="documents",
    points=[
        models.PointStruct(
            id=200,
            vector={},
            payload={"title": "Document A", "text": "This is document A"},
        ),
        models.PointStruct(
            id=201,
            vector={},
            payload={"title": "Document B", "text": "This is document B"},
        ),
    ],
)

client.upsert(
    collection_name="chunks",
    points=[
        models.PointStruct(
            id=0,
            vector=[0.1, 0.2, 0.3, 0.4],
            payload={"document_id": 200},
        ),
        models.PointStruct(
            id=1,
            vector=[0.5, 0.6, 0.7, 0.8],
            payload={"document_id": 201},
        ),
    ],
)
```
