```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "context": [
      {
        "positive": 100,
        "negative": 718
      },
      {
        "positive": 200,
        "negative": 300
      }
    ]
  },
  "limit": 10
}
```
