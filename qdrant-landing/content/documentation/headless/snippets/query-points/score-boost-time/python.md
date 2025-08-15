```python
from qdrant_client import models


time_boosted = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        query=[0.2, 0.8, ...],  # <-- dense vector
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
                            datetime="2025-08-04T00:00:00Z" # target time, for example, time of the search
                        ),
                        scale=86400, # 1 week in seconds
                        midpoint=0.1 # 0.1 output with deviation on `scale` (1 week) from `target`
                    )
                )
            ]
        )
    )
)
```
