```python
QUERY = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?"

client.query_points(
    COLLECTION,
    query=models.Document(text=QUERY, model=MODEL),
    limit=3,
    with_payload=["section_url", "text"],
)
```
