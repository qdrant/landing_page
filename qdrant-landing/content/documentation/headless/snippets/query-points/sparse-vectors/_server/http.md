```http
POST /collections/{collection_name}/points/query
{
    "query": {
        "indices": [1, 3, 5, 7],
        "values": [0.1, 0.2, 0.3, 0.4]
    },
    "using": "text"
}
```
