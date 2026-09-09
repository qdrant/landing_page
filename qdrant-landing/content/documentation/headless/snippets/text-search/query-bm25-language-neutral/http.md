```http
POST /collections/books/points/query
{
  "query": {
    "text": "Mieville",
    "model": "qdrant/bm25",
    "options": {
      "stemmer": {"type": "none"},
      "stopwords": {},
      "tokenizer": "multilingual",
      "ascii_folding": true
    }
  },
  "using": "author-bm25",
  "limit": 10,
  "with_payload": true
}
```