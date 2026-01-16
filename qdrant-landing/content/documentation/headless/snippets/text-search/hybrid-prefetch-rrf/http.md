```http
POST /collections/books/points/query
{
  "prefetch": [
    {
      "query": {
        "text": "9780553213515",
        "model": "sentence-transformers/all-minilm-l6-v2"
      },
      "using": "description-dense",
      "score_threshold": 0.5
    },
    {
      "query": {
        "text": "9780553213515",
        "model": "Qdrant/bm25"
      },
      "using": "isbn-bm25"
    }
  ],
  "query": {
    "fusion": "rrf"
  },
  "limit": 10,
  "with_payload": true
}
```