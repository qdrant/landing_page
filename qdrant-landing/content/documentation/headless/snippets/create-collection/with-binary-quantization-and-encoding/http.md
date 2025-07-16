```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    },
    "quantization_config": {
        "binary": {
            "encoding": "two_bits",
            "always_ram": true
        }
    }
}
```
