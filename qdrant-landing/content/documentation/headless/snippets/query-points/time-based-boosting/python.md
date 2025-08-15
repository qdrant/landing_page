```python
time_based_boosting = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.2, 0.8, ...],  # <-- dense vector,
        limit=5,
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(
            sum=[
                "$score",  # vector similarity score
                models.GaussDecayExpression(
                    gauss_decay={
                        "target": {"datetime": todays_date},  # Boost recent reviews
                        "x": {"datetime_key": "ts"},
                        "scale": 7 * 24 * 3600,  # 1 week in seconds
                    }
                ),
            ]
        ),
        defaults={"ts": todays_date},
    ),
)

```