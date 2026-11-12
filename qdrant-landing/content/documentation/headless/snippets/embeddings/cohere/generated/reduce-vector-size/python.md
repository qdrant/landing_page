```python
response = co.embed(
    model="embed-v5.0-pro",
    input_type="search_document",
    texts=documents,
    output_dimension=512,
    embedding_types=["float"],
)
```
