```http
PUT /collections/books?wait=true
{
  "vectors": {
    "description-dense": {
      "size": 384,
      "distance": "Cosine"
    }
  },
  "sparse_vectors": {
    "isbn-bm25": {
      "modifier": "idf"
    }
  }
}
```