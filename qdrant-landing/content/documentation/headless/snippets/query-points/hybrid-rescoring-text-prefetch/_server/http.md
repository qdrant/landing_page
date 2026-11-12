```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": { "text": "time travel" }, // <-- BM25 text query
        "using": "title",
        "limit": 100
    },
    "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
    "using": "dense",
    "limit": 10
}
```
