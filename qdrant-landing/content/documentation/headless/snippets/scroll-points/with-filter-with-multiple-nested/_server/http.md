```http
POST /collections/{collection_name}/points/scroll
{
    "filter": {
        "must": [
            {
                "key": "diet[].food",
                  "match": {
                    "value": "meat"
                }
            },
            {
                "key": "diet[].likes",
                  "match": {
                    "value": true
                }
            }
        ]
    }
}
```
