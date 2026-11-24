```http
POST /collections/{collection_name}/points/query/batch
{
    "searches": [
        {
            "query": [0.2, 0.1, 0.9, 0.7],
            "filter": {
                "must": [
                    {
                        "key": "city",
                        "match": {
                            "value": "London"
                        }
                    }
                ]
            },
            "limit": 3
        },
        {
            "query": [0.5, 0.3, 0.2, 0.3],
            "filter": {
                "must": [
                    {
                        "key": "city",
                        "match": {
                            "value": "London"
                        }
                    }
                ]
            },
            "limit": 3
        }
    ]
}
```
