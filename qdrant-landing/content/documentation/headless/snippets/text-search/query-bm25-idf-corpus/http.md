```http
POST /collections/{collection_name}/points/query
{
    "query": {
        "text": "time travel",
        "model": "qdrant/bm25"
    },
    "using": "title-bm25",
    "filter": {
        "must": [
            { "key": "group_id", "match": { "value": "user_1" } },
            { "key": "year", "match": { "value": 2024 } }
        ]
    },
    "params": {
        "idf": {
            "corpus": {
                "must": [
                    { "key": "group_id", "match": { "value": "user_1" } }
                ]
            }
        }
    },
    "limit": 10,
    "with_payload": true
}
```
