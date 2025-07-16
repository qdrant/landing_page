```python
import pandas as pd

# Get latest UTC time in ISO format
latest = pd.to_datetime("2023-02-07 21:45:21.367000")

center_time = latest.isoformat()
# Query Qdrant with time-decay scoring + vector similarity
resp = client.query_points(
    collection_name=collection_name,
    prefetch=models.Prefetch(
        query=Document(text=query_text, model=dense_model),
        using="dense_vector",
        limit=5,
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(
            sum=[
                "$score",  # vector similarity score
                models.GaussDecayExpression(
                    gauss_decay={
                        "target": {"datetime": center_time},  # Boost recent reviews
                        "x": {"datetime_key": "ts"},
                        "scale": 7 * 24 * 3600,  # 1 week in seconds
                    }
                ),
            ]
        ),
        defaults={"ts": center_time},
    ),
)
print(resp)

```