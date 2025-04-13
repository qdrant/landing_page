```http
POST /collections/{collection_name}/points/search/matrix/pairs
{
    "sample": 10,
    "limit": 2,
    "filter": {
        "must": {
            "key": "color",
            "match": { "value": "red" }
        }
    }  
}
```
