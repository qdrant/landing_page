```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 768,
      "distance": "Cosine",
      "memory": "cold"
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "memory": "cold"
        }
    }
}
```
