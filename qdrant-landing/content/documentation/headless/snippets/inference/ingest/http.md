```http
PUT /collections/{collection_name}/points
{
  "points": [
    {
      "id": 1,
      "vector": {
        "my-bm25-vector": {
          "text": "Recipe for baking chocolate chip cookies",
          "model": "qdrant/bm25"
        }
      }
    }
  ]
}
```
