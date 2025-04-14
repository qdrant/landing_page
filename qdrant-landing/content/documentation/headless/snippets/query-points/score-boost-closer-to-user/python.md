```python
from qdrant_client import models

boosted = client.query_points(
    collection_name="{collection_name}",
    prefetch=models.PrefetchRequest(
        query=[0.2, 0.8, ...],  # <-- dense vector
        limit=50
    ),
    query=models.Formula(
        formula=models.SumExpression(sum=[
            "$score",
            models.GaussDecayExpression(
                x=models.GeoDistanceExpression(
                    origin=models.GeoPoint(
                        lat=52.504043,
                        lon=13.393236
                    ),  # Berlin
                    to="geo.location"
                ),
                scale=5000  # 5km
            )
        ]),
        defaults={"geo.location": models.GeoPoint(lat=48.137154, lon=11.576124)}  # Munich
    )
)
```
