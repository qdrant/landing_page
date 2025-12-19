```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    },
    "quantization_config": {
        "binary": {
            "query_encoding": "scalar8bits",
            "always_ram": true
        }
    }
}
```
