```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    },
    "quantization_config": {
        "product": {
            "compression": "x16",
            "always_ram": true
        }
    }
}
```
