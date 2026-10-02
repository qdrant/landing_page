```python
missing = client.count(
    collection_name=COLLECTION,
    count_filter=models.Filter(
        must_not=[models.HasVectorCondition(has_vector=NEW_VECTOR)]
    ),
    exact=True,
).count
```
