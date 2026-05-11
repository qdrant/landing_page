```http
PUT /collections/{collection_name}
{
    "strict_mode_config": {
        "enabled": true,
        "sparse_config": {
            "{vector_name}": {
                "max_length": 1000
            }
        }
    }
}
```
