```http
PUT /collections/{collection_name}/shards
{
  "shard_key": "user_1",
  "shards_number": 1,
  "replication_factor": 1,
  "initial_state": "Partial"
}
```
