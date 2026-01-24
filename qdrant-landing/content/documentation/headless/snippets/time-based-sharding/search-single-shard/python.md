```python
today = "2026-01-07"

query_text = "coffee"

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
    shard_key_selector=today
)
print(resp)
```