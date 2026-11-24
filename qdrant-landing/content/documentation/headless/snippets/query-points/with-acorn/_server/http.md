```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "params": {
        "acorn": {
            "enable": true,
            "max_selectivity": 0.4
        }
    },
    "limit": 10
}
```