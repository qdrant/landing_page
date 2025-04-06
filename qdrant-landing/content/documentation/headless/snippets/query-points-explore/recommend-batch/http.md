```http
POST /collections/{collection_name}/query/batch
{
  "searches": [
    {
      "query": {
        "recommend": {
          "positive": [100, 231],
          "negative": [718]
        }
      },
      "filter": {
        "must": [
          {
            "key": "city",
            "match": {
              "value": "London"
            }
          }
        ]
      },
      "limit": 10
    },
    {
      "query": {
        "recommend": {
          "positive": [200, 67],
          "negative": [300]
        }
      },
      "filter": {
        "must": [
          {
            "key": "city",
            "match": {
              "value": "London"
            }
          }
        ]
      },
      "limit": 10
    }
  ]
}
```
