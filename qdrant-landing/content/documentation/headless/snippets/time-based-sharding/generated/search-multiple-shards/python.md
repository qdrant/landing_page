```python
resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector=["2026-04-06","2026-04-07"]
)
print(resp)
```
