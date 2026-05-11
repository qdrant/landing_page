```http
PUT /collections/{collection_name}
{
    "strict_mode_config": {
        "enabled": true,
        "multivector_config": {
            "{vector_name}": {
                "max_vectors": 10
            }
        }
    }
}
```
