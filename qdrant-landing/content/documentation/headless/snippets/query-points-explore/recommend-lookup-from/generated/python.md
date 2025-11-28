```python
client.query_points(
    collection_name="{collection_name}",
    query=models.RecommendQuery(
        recommend=models.RecommendInput(
            positive=[100, 231],
            negative=[718],
        )
    ),
    using="image",
    limit=10,
    lookup_from=models.LookupLocation(
        collection="{external_collection_name}", vector="{external_vector_name}"
    ),
)
```
