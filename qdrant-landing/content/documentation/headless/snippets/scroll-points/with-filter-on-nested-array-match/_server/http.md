```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "should": [
            {
                "key": "country.cities[].sightseeing",
                "match": {
                    "value": "Osaka Castle"
                }
            }
        ]
    }
}
```
