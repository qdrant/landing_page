```http
POST /collections/{collection_name}/points/query
{
    "prefetch": [
        {
            "query": { "text": "vector database" },
            "using": "title",
            "limit": 50
        },
        {
            "query": { "text": "vector database" },
            "using": "body",
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
