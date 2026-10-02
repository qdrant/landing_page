```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "filter": {
        "must_not": [
            { "has_id": [83461, 19284, 57392, 44017, 91825] }
        ]
    },
    "limit": 5
}
```
