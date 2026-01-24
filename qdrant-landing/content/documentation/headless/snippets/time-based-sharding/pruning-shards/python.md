```python
today = "2026-01-08"
oldest_shard_key = (date.fromisoformat(today) - timedelta(days=7)).isoformat()

client.create_shard_key(collection_name, today)
client.delete_shard_key(collection_name, oldest_shard_key)
```