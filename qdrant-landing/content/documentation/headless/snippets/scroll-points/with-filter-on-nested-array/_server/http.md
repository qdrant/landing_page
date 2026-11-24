```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "should": [
            {
                "key": "country.cities[].population",
                "range": {
                    "gte": 9.0,
                }
            }
        ]
    }
}
```
