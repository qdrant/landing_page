```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "on_disk": true
    },
    "hnsw_config": {
        "on_disk": true
    }
}
```
