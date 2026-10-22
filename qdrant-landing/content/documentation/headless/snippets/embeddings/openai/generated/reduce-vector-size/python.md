```python
response = openai_client.embeddings.create(
    model="text-embedding-3-large",
    input=documents,
    dimensions=1024,
)
```
