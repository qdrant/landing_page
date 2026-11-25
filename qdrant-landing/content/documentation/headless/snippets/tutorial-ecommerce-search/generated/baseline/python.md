```python
SHOPPER_LOCATION = models.GeoPoint(lat=52.2297, lon=21.0122)
CANDIDATE_LIMIT = len(products)
TOP_K = 5
EXACT = models.SearchParams(exact=True)

baseline = (
    await client.query_points(
        collection_name=COLLECTION,
        query=query_vector,
        search_params=EXACT,
        limit=CANDIDATE_LIMIT,
        with_payload=True,
    )
).points
semantic_scores = {point.id: point.score for point in baseline}
print(show_hits(baseline[:TOP_K]))
for point in baseline[:2]:
    assert point.payload is not None
    print(name_of(point), "| WANDS:", label_by_id[point.id])
    print(point.payload["product_description"], "\n")
```
