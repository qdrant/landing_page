```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "recommend": {
      "positive": [100, 231],
      "negative": [718]
    }
  },
  "limit": 10,
  "lookup_from": {
    "collection": "{external_collection_name}",
    "vector": "{external_vector_name}"
  }
}
```
