```python
async def rank_products(
    origin: models.GeoPoint = SHOPPER_LOCATION,
    returns_weight: float = RETURNS_WEIGHT,
    geo_weight: float = GEO_WEIGHT,
    candidate_limit: int = CANDIDATE_LIMIT,
    limit: int = TOP_K,
) -> list[models.ScoredPoint]:
    response = await client.query_points(
        collection_name=COLLECTION,
        prefetch=models.Prefetch(
            query=query_vector,
            filter=make_eligibility_filter(origin),
            params=EXACT,
            limit=candidate_limit,
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(
                sum=[
                    "$score",
                    models.MultExpression(mult=[returns_weight, returns_condition]),
                    models.MultExpression(
                        mult=[geo_weight, make_proximity(origin)]
                    ),
                ]
            )
        ),
        limit=limit,
        with_payload=True,
    )
    return response.points

combined = await rank_products()
print(show_hits(combined))
```
