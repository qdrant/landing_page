```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            { "has_id": [1,3,5,7,9,11] }
        ]
    }
    ...
}
```
