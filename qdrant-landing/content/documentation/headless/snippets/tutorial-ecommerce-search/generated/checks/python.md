```python
without_bonuses = await rank_products(
    returns_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
)
expected_scores = {point.id: point.score for point in filtered}
assert {point.id for point in without_bonuses} == set(expected_scores)
for point in without_bonuses:
    assert math.isclose(point.score, expected_scores[point.id], abs_tol=1e-6)
assert all(
    first.score >= second.score
    for first, second in zip(without_bonuses, without_bonuses[1:])
)
for point in await rank_products(limit=CANDIDATE_LIMIT):
    payload = point.payload or {}
    assert payload["in_stock"] is True
    assert (
        distance_m(SHOPPER_LOCATION, payload["pickup_location"]) <= MAX_DISTANCE_M
    )
    assert isinstance(point.id, int) and point.id % 37 != 0
empty_filter = models.Filter(
    must=[
        models.FieldCondition(
            key="pickup_location",
            geo_radius=models.GeoRadius(center=SHOPPER_LOCATION, radius=1.0),
        )
    ]
)
empty = (
    await client.query_points(
        collection_name=COLLECTION,
        prefetch=models.Prefetch(
            query=query_vector, filter=empty_filter, limit=CANDIDATE_LIMIT
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(sum=["$score", returns_bonus])
        ),
        limit=TOP_K,
    )
).points
assert empty == []
print(
    "Passed: zero bonuses, eligibility, missing coordinates, score arithmetic, and empty result"
)
```
