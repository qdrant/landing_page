```python
MAIN = "docs-sync-scale"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

if not client.collection_exists(MAIN):
    client.create_collection(
        MAIN,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        metadata={"embedding_model": MODEL, "pipeline_version": "1"},
    )
    client.create_payload_index(MAIN, "sync_bucket", models.PayloadSchemaType.INTEGER)
```
