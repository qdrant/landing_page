```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        { "query": [0.2, 0.8, ...], "using": "title", "limit": 50 },
        { "query": [0.2, 0.8, ...], "using": "summary", "limit": 50 }
    ],
    "query": {
        "formula": { "max": ["$score[0]", "$score[1]"] },
        "defaults": { "$score[1]": -1e30 }
    }
}
```
