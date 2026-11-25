```python
MAX_DISTANCE_M = 15_000.0

def make_eligibility_filter(origin: models.GeoPoint) -> models.Filter:
    return models.Filter(
        must=[
            models.FieldCondition(
                key="in_stock", match=models.MatchValue(value=True)
            ),
            models.FieldCondition(
                key="pickup_location",
                geo_radius=models.GeoRadius(center=origin, radius=MAX_DISTANCE_M),
            ),
        ]
    )

eligibility_filter = make_eligibility_filter(SHOPPER_LOCATION)
filtered = (
    await client.query_points(
        collection_name=COLLECTION,
        query=query_vector,
        query_filter=eligibility_filter,
        search_params=EXACT,
        limit=CANDIDATE_LIMIT,
        with_payload=True,
    )
).points
print(show_hits(filtered[:TOP_K]))
print(f"Eligible candidates: {len(filtered)} / {len(products)}")
assert all(isinstance(point.id, int) and point.id % 37 != 0 for point in filtered)
```
