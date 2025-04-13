```http
POST /collections/{collection_name}/points/count
{
    "filter": {
        "must": [
            {
                "key": "color",
                "match": {
                    "value": "red"
                }
            }
        ]
    },
    "exact": true
}
```
