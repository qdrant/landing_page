```python
GEO_WEIGHT = 0.15
DISTANCE_SCALE_M = 5_000.0

def make_proximity(origin: models.GeoPoint) -> models.GaussDecayExpression:
    return models.GaussDecayExpression(
        gauss_decay=models.DecayParamsExpression(
            x=models.GeoDistance(
                geo_distance=models.GeoDistanceParams(
                    origin=origin, to="pickup_location"
                )
            ),
            target=0.0,
            scale=DISTANCE_SCALE_M,
            midpoint=0.5,
        )
    )

proximity = make_proximity(SHOPPER_LOCATION)
proximity_boost = (
    await client.query_points(
        collection_name=COLLECTION,
        prefetch=models.Prefetch(
            query=query_vector,
            filter=eligibility_filter,
            params=EXACT,
            limit=CANDIDATE_LIMIT,
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(
                sum=[
                    "$score",
                    models.MultExpression(mult=[GEO_WEIGHT, proximity]),
                ]
            )
        ),
        limit=TOP_K,
        with_payload=True,
    )
).points
print(show_hits(proximity_boost))
```
