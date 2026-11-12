```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [-1.118, 0.3, 0.4],
        "limit": 100
    },
    "query": {
        "formula": {
            "neg": { "acosh": { "neg": "$score" } }
        }
    }
}
```
