```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "text": "How to bake cookies?",
    "model": "qdrant/bm25"
  },
  "using": "my-bm25-vector"
}
```
