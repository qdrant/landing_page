```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            { "has_vector": "image" }
        ]
    }
}
```
