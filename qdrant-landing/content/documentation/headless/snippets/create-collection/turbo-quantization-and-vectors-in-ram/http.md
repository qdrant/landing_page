```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "datatype": "turbo4"
    },
    "quantization_config": {
        "turbo": {
            "bits": "bits1",
            "memory": "pinned"
        }
    }
}
```
