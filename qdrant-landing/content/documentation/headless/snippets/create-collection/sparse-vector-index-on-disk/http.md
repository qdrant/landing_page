```http
PUT /collections/{collection_name}
{
    "sparse_vectors": {
        "text": {
            "index": {
                "memory": "cold"
            }
        }
    }
}
```
