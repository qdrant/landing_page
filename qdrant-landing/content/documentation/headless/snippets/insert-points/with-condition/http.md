```http
PUT /collections/{collection_name}/points
{
    "points": [
        {
            "id": 1,
            "vector": [0.05, 0.61, 0.76, 0.74],
            "payload": {
                "city": "Berlin",
                "price": 1.99,
                "version": 3
            }
        }
    ],
    "update_filter": {
        "must": [
            {
                "key": "version",
                "match": {
                    "value": 2
                }
            }
        ]
    }
}
```
