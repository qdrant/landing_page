```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "on_disk": true
    },
    "quantization_config": {
        "binary": {
            "always_ram": false
        }
    },
    "hnsw_config": {
        "on_disk": true,
        "inline_storage": true
    }
}
```
