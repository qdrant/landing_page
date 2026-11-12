```python
query_response = nvidia.embeddings.create(
    model=MODEL,
    input=["What is Qdrant?"],
    encoding_format="float",
    extra_body={"input_type": "query", "truncate": "END"},
)

hits = client.query_points(
    collection_name="{collection_name}",
    query=query_response.data[0].embedding,
    limit=3,
).points
```
