```http
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "qdrant/bm25"
  },
  "using": "title-bm25",
  "limit": 10,
  "with_payload": true
}
```