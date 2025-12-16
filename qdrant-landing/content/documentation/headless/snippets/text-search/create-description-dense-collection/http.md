```http
PUT /collections/books
{
  "vectors": {
    "description-dense": {
      "size": 384,
      "distance": "Cosine"
    }
  }
}
```