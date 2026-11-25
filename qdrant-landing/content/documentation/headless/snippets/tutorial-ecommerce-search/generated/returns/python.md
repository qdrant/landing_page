```python
RETURNS_WEIGHT = 0.08
returns_condition = models.FieldCondition(
    key="free_returns", match=models.MatchValue(value=True)
)
returns_bonus = models.MultExpression(mult=[RETURNS_WEIGHT, returns_condition])

returns_boost = (
    await client.query_points(
        collection_name=COLLECTION,
        prefetch=models.Prefetch(
            query=query_vector,
            filter=eligibility_filter,
            params=EXACT,
            limit=CANDIDATE_LIMIT,
        ),
        query=models.FormulaQuery(
            formula=models.SumExpression(sum=["$score", returns_bonus])
        ),
        limit=TOP_K,
        with_payload=True,
    )
).points
print(show_hits(returns_boost))
```
