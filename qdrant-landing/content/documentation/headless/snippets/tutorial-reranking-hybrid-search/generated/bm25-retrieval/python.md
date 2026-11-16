```python
results = client.query_points(
    collection_name,
    query=models.TextQuery(text=query),
    using="description",
    limit=10,
)

pprint.pp(results.points)
```
