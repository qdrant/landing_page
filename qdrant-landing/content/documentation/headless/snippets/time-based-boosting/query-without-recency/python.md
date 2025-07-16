```python
query_text = "ahalo hair extension"

resp = client.query_points(
    collection_name=collection_name,
    query=Document(text=query_text, model=dense_model),
    using="dense_vector",
    limit=5,
)
print(resp)

```