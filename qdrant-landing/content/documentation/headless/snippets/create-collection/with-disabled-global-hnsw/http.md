```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "hnsw_config": {
        "payload_m": 16,
        "m": 0
    }
}
```
