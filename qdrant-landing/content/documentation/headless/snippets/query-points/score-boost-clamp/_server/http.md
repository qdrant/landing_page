```http
POST /collections/{collection_name}/points/query
{
    "prefetch": { "query": [0.2, 0.8, ...], "limit": 50 },
    "query": {
        "formula": {
            "sum": [
                "$score",
                { "max": [0.0, { "min": [1.0, "rating"] }] }
            ]
        }
    }
}
```
