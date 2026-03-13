```python
results = client.query_points(
    collection_name=OLD_COLLECTION,
    query=models.Document(text="my query", model=OLD_MODEL),
    limit=10,
)
```
