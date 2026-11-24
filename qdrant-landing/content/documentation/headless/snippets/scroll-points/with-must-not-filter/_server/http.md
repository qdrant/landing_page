```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must_not": [
            { "key": "city", "match": { "value": "London" } },
            { "key": "color", "match": { "value": "red" } }
        ]
    }
}
```
