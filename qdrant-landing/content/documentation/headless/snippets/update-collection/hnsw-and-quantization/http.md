```http
PATCH /collections/{collection_name}
{
    "vectors": {
        "my_vector": {
            "hnsw_config": {
                "m": 32,
                "ef_construct": 123
            },
            "quantization_config": {
                "product": {
                    "compression": "x32",
                    "memory": "pinned"
                }
            },
            "memory": "cold"
        }
    },
    "hnsw_config": {
        "ef_construct": 123
    },
    "quantization_config": {
        "scalar": {
            "type": "int8",
            "quantile": 0.8,
            "memory": "cached"
        }
    }
}
```
