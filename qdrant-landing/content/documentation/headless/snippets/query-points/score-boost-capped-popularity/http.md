```http
POST /collections/{collection_name}/points/query
{
    "prefetch": { "query": [0.2, 0.8, ...], "limit": 50 },
    "query": {
        "formula": {
            "sum": [
                "$score",
                { "min": [2.0, { "mult": [0.1, "log_views"] }] }
            ]
        }
    }
}
```
