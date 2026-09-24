```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
      // 2+ prefetches here
    ],
    "query": { "rrf": {"k": 60 } }, // <--- parameterized reciprocal rank fusion
    "limit": 10
}
```
