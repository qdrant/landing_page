```python
FACILITY_WEIGHT = 0.08
power_condition = models.FieldCondition(
    key="power_available", match=models.MatchValue(value=True)
)
facility_bonus = models.MultExpression(mult=[FACILITY_WEIGHT, power_condition])

facility_boost = (
    await client.query_points(
        collection_name=COLLECTION,
        prefetch=models.Prefetch(
            query=query_vector,
            filter=eligibility_filter,
            params=EXACT,
            limit=CANDIDATE_LIMIT,
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(sum=["$score", facility_bonus])
        ),
        limit=TOP_K,
        with_payload=True,
    )
).points
print(show_hits(facility_boost))
```
