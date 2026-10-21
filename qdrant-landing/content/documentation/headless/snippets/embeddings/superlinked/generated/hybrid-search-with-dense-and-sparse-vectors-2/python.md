```python
query = hybrid_vectorizer.embed_query("What is Qdrant?")

hits = client.query_points(
    collection_name="{hybrid_collection_name}",
    prefetch=[
        models.Prefetch(query=query["dense"], using="dense", limit=20),
        models.Prefetch(query=models.SparseVector(**query["sparse"]), using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=3,
).points
```
