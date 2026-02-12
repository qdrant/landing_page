```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        // Prefetches here
    ],
    "query": {
        "rrf": {
            "weights": [3.0, 1.0]
        }
    },
    "limit": 10
}
```
