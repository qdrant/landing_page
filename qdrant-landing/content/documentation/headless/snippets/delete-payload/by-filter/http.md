```http
POST /collections/{collection_name}/points/payload/delete
{
    "keys": ["color", "price"],
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    }
}
```
