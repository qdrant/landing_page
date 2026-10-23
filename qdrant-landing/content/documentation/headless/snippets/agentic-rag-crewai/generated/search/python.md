```python
def search_meetings(client: QdrantClient, query: str, limit: int = 3) -> list[dict[str, Any]]:
    response = client.query_points(
        collection_name=COLLECTION,
        query=models.Document(text=query, model=EMBEDDING_MODEL),
        limit=limit,
        with_payload=True,
    )
    results = []
    for point in response.points:
        payload = point.payload or {}
        results.append(
            {
                "topic": payload["topic"],
                "date": payload["date"],
                "duration_minutes": payload["duration_minutes"],
                "score": round(point.score, 3),
                "transcript": payload["transcript"],
            }
        )
    return results
```
