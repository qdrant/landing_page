```http
PUT collections/{collection_name}
{
  "vectors": {
    "size": 128,
    "distance": "Cosine",
    "multivector_config": {
      "comparator": "max_sim"
    }
  }
}
```
