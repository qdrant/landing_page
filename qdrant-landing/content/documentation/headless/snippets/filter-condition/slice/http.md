```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            { "slice": { "index": 3, "total": 8 } }
        ]
    }
    ...
}
```
