```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { "text": "vector database", "model": "qdrant/bm25" },
            "using": "title-bm25",
            "limit": 50
        },
        {
            "query": { "text": "vector database", "model": "qdrant/bm25" },
            "using": "body-bm25",
            "limit": 50
        }
    ],
    "query": {
        "formula": {
            "max": [
                { "mult": [3.0, "$score[0]"] },
                "$score[1]"
            ]
        }
    }
}
```
