```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "should": [
            {
                "key": "country.name",
                "match": {
                    "value": "Germany"
                }
            }
        ]
    }
}
```
