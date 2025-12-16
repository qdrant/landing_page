```http
POST /collections/books/points/query
{
  "query": {
    "text": "time travel",
    "model": "sentence-transformers/all-minilm-l6-v2"
  },
  "using": "description-dense",
  "with_payload": true
}
```