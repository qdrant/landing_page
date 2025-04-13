```http
PUT /collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "datatype": "uint8" // <-- For dense vectors
  },
  "sparse_vectors": {
    "text": {
      "index": {
        "datatype": "uint8" // <-- For sparse vectors 
      }
    }
  }
}
```
