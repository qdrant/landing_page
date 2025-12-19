```http
POST /collections/{collection_name}/cluster
{
    "replicate_points": {
        "filter": {
            "must": {
                "key": "group_id",
                "match": {
                    "value": "user_1"
                }
            }
        },
        "from_shard_key": "default",
        "to_shard_key": "user_1"
    }
}
```
