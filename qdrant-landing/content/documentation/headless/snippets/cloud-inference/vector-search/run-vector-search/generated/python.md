```python
from qdrant_client import QdrantClient, models

results = client.query_points(
    collection_name="{collection_name}",
    prefetch=[
        models.Prefetch(
            query=models.Document(
                text=query_text,
                model=dense_model
            ),
            using="dense_vector",
            limit=5
        ),
        models.Prefetch(
            query=models.TextQuery(text=query_text),
            using="passage_text",
            limit=5
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=5,
    with_payload=True
)

print(results.points)
```
