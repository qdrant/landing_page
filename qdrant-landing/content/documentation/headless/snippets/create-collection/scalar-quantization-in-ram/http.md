```http
PUT /collections/{collection_name}
{
    "vectors": {
        "size": 768,
        "distance": "Cosine",
        "on_disk": true
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "always_ram": true
        }
    }
}
```
