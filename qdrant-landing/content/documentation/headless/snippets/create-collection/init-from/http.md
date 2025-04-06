```http
PUT /collections/{collection_name}
{
    "vectors": {
      "size": 100,
      "distance": "Cosine"
    },
    "init_from": {
       "collection": "{from_collection_name}"
    }
}
```
