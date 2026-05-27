```python
results = client.query_points(
    collection_name=COLLECTION,
    query=models.Document(text="my query", model=NEW_MODEL),
    using=NEW_VECTOR,
    limit=10,
)
```
