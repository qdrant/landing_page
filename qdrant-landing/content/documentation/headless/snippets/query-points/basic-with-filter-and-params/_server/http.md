```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.79],
    "filter": {
        "must": [
            {
                "key": "city",
                "match": {
                    "value": "London"
                }
            }
        ]
    },
    "params": {
        "hnsw_ef": 128,
        "exact": false
    },
    "limit": 3
}
```
