```python
for field in ("content_hash", "url", "section_url"):
    client.create_payload_index(COLLECTION, field, models.PayloadSchemaType.KEYWORD)
```
