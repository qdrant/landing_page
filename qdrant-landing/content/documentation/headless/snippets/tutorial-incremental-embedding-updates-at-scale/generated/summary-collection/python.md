```python
META = "docs-sync-digests"
N_META = N_BUCKETS // GROUP_SIZE

if not client.collection_exists(META):
    client.create_collection(
        META,
        vectors_config=models.VectorParams(size=1, distance=models.Distance.COSINE),
    )
```
