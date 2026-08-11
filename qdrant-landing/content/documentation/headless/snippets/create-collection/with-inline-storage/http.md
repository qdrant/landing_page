```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "memory": "cold",
      "datatype": "turbo4"
    },
    "quantization_config": {
        "turbo": {
            "memory": "cold",
            "bits": "bits1"
        }
    },
    "hnsw_config": {
        "memory": "cold",
        "inline_storage": true
    }
}
```
