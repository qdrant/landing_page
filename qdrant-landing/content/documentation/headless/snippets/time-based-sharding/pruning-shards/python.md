```python
cutoff = datetime.now(UTC) - timedelta(days=30)

for i in range(60):
    day = cutoff - timedelta(days=i)
    key = day.strftime("day_%Y_%m_%d")
    try:
        client.delete_shard_key(collection_name, key)
        print("Deleted:", key)
    except Exception:
        pass

```