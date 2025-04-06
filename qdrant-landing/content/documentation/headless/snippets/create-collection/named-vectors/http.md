```http
PUT /collections/{collection_name}
{
  "vectors": {
    "image": {
      "size": 4,
      "distance": "Dot"
    },
    "text": {
      "size": 5,
      "distance": "Cosine"
    }
  },
  "sparse_vectors": {
    "text-sparse": {}
  }
}
```
