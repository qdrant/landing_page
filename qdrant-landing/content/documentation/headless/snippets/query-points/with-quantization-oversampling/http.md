```http
POST /collections/{collection_name}/points/query
{
    "query": [0.2, 0.1, 0.9, 0.7],
    "params": {
        "quantization": {
            "ignore": false,
            "rescore": true,
            "oversampling": 2.0
        }
    },
    "limit": 10
}
```
