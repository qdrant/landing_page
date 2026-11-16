```python
response = mistral_client.embeddings.create(
    model="codestral-embed",
    inputs=["def add(a, b):\n    return a + b"],
    output_dimension=512,
)
```
