```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "filter": {
                "must": {
                    "key": "color",
                    "match": {
                        "value": "red"
                    }
                }
            },
            "limit": 10
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "filter": {
                "must": {
                    "key": "color",
                    "match": {
                        "value": "green"
                    }
                }
            },
            "limit": 10
        }
    ],
    "query": { "order_by": "price" }
}
```
