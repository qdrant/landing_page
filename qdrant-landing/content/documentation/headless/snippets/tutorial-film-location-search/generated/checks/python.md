```python
without_bonuses = await rank_locations(
    facility_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
)
assert [p.id for p in without_bonuses] == [p.id for p in filtered]
for actual, expected in zip(without_bonuses, filtered, strict=True):
    assert math.isclose(actual.score, expected.score, abs_tol=1e-6)
for point in await rank_locations(limit=CANDIDATE_LIMIT):
    payload = point.payload or {}
    assert payload["permission_available"] is True
    assert distance_m(BASE_LOCATION, payload["location"]) <= MAX_DISTANCE_M
    assert point.id not in {1, 11, 40}
empty_filter = models.Filter(
    must=[
        models.FieldCondition(
            key="location",
            geo_radius=models.GeoRadius(center=BASE_LOCATION, radius=1.0),
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
            formula=models.SumExpression(sum=["$score", facility_bonus])
        ),
        limit=TOP_K,
    )
).points
assert empty == []
print(
    "Passed: zero bonuses, eligibility, missing coordinates, score arithmetic, and empty result"
)
```
