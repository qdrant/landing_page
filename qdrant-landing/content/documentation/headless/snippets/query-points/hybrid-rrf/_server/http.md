```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { "text": "time travel" }, // <-- BM25 text query
            "using": "title",
            "limit": 20
        },
        {
            "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
            "using": "dense",
            "limit": 20
        }
    ],
    "query": { "rrf": {} }, // <--- reciprocal rank fusion with defaults
    "limit": 10
}
```
