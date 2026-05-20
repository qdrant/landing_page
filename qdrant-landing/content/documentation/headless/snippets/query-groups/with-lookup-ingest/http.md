```http
PUT /collections/documents/points
{
    "points": [
        {
            "id": 200,
            "vector": {},
            "payload": {"title": "Document A", "text": "This is document A"}
        },
        {
            "id": 201,
            "vector": {},
            "payload": {"title": "Document B", "text": "This is document B"}
        }
    ]
}

PUT /collections/chunks/points
{
    "points": [
        {
            "id": 0,
            "vector": [0.1, 0.2, 0.3, 0.4],
            "payload": {"document_id": 200}
        },
        {
            "id": 1,
            "vector": [0.5, 0.6, 0.7, 0.8],
            "payload": {"document_id": 201}
        }
    ]
}
```
