```python
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(
    collection_name="{collection_name}",
    prefetch=models.Prefetch(
        prefetch=[
            models.Prefetch(
                query=models.SparseVector(indices=[1, 42], values=[0.22, 0.8]),
                using="sparse",
                limit=100,
            ),
            models.Prefetch(
                query=[0.01, 0.45, 0.67],  # <-- dense vector
                using="dense",
                limit=100,
            ),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=100,
    ),
    query=models.FormulaQuery(
        formula=models.SumExpression(
            sum=[
                "$score",  # the fused score from the RRF prefetch
                models.ExpDecayExpression(
                    exp_decay=models.DecayParamsExpression(
                        x=models.DatetimeKeyExpression(datetime_key="published_at"),
                        target=models.DatetimeExpression(datetime="YYYY-MM-DDT00:00:00Z"),
                        scale=86400 * 180,  # 180 days in seconds
                        midpoint=0.5,
                    )
                ),
            ]
        )
    ),
    limit=10,
)
```
