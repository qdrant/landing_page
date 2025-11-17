```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    },
    "metadata": {
      "my-metadata-field": "value-1",
      "another-field": 123
    }
}
```
