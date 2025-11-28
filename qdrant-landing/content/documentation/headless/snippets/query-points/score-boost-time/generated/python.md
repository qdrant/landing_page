```python
from qdrant_client import QdrantClient, models

time_boosted = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.1, 0.45, 0.67],  # <-- dense vector
        limit=50
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(
            sum=[
                "$score", # the final score = score + exp_decay(target_time - x_time)
                models.ExpDecayExpression(
                    exp_decay=models.DecayParamsExpression(
                        x=models.DatetimeKeyExpression(
                            datetime_key="upload_time" # payload key 
                        ),
                        target=models.DatetimeExpression(
                            datetime="YYYY-MM-DDT00:00:00Z" # current datetime
                        ),
                        scale=86400, # 1 day in seconds
                        midpoint=0.5 # if item's "update_time" is more than 1 day apart from current datetime, relevance score is less than 0.5
                    )
                )
            ]
        )
    )
)
```
