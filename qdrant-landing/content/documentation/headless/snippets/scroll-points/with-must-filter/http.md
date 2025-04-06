```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            { "key": "city", "match": { "value": "London" } },
            { "key": "color", "match": { "value": "red" } }
        ]
    }
    ...
}
```
