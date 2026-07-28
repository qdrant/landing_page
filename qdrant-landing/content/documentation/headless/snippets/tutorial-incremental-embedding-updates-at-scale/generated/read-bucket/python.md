```python
def read_bucket(b):
    """Return {point_id: content_hash} for every chunk stored in bucket b.

    Pages through the results so nothing is missed in a large bucket.
    """
    stored = {}
    offset = None
    while True:
        points, offset = client.scroll(
            MAIN,
            scroll_filter=models.Filter(
                must=[models.FieldCondition(
                    key="sync_bucket",
                    match=models.MatchValue(value=b),
                )],
            ),
            with_payload=["content_hash"],
            with_vectors=False,
            limit=1000,
            offset=offset,
        )
        for point in points:
            stored[str(point.id)] = point.payload["content_hash"]
        if offset is None:
            return stored
```
