```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "memory": "cold"
    },
    "quantization_config": {
        "binary": {
            "memory": "cold"
        }
    },
    "hnsw_config": {
        "memory": "cold",
        "inline_storage": true
    }
}
```
