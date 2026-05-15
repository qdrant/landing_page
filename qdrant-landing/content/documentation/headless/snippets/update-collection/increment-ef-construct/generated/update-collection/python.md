```python
client.update_collection(
    collection_name="{collection_name}",
    hnsw_config=models.HnswConfigDiff(ef_construct=base_ef + 1),
)
```
