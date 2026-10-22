```http
POST /collections/books/points/query
{
  "query": {
    "text": "time travel"
  },
  "using": "title",
  "limit": 10,
  "with_payload": true
}
```
