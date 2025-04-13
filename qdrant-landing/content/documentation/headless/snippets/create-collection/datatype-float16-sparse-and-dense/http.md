```http
PUT /collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "datatype": "float16" // <-- For dense vectors
  },
  "sparse_vectors": {
    "text": {
      "index": {
        "datatype": "float16" // <-- And for sparse vectors 
      }
    }
  }
}
```
