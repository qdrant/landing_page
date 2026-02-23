```python
results = client.query_points(
    collection_name=NEW_COLLECTION,
    query=models.Document(text="my query", model=NEW_MODEL),
    limit=10,
)
```
