```python
results = client.query_points(
    collection_name=COLLECTION,
    query=models.Document(text="my query", model=OLD_MODEL),
    using=OLD_VECTOR,
    limit=10,
)
```
