```python
client.create_collection(
    collection_name="chunks",
    vectors_config=models.VectorParams(size=4, distance=models.Distance.COSINE),
)

client.create_payload_index(
    collection_name="chunks",
    field_name="document_id",
    field_schema=models.PayloadSchemaType.INTEGER,
)

client.create_collection(
    collection_name="documents",
    vectors_config={},  # no vectors, payload only
)
```
