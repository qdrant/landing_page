```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [-3.2, 0.3, 0.4],
        "limit": 100
    },
    "query": {
        "formula": {
            "mult": [
                -3.1622776601683795,
                { "acosh": { "mult": [0.1, { "neg": "$score" }] } }
            ]
        }
    }
}
```
