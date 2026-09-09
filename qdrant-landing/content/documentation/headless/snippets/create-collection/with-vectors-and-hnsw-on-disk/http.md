```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "memory": "cold"
    },
    "hnsw_config": {
        "memory": "cold"
    }
}
```
