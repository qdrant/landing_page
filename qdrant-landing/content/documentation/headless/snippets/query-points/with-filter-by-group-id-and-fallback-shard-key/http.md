```http
POST /collections/{collection_name}/points/query
{
    "query": [0.1, 0.1, 0.9],
    "filter": {
        "must": [
            {
                "key": "group_id",
                "match": {
                    "value": "user_1"
                }
            }
        ]
    },
    "shard_key": {
        "fallback": "default",
        "target": "user_1"
    },
    "limit": 10
}
```
