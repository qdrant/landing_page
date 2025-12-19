```http
PUT /collections/{collection_name}/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "image": "https://qdrant.tech/example.png",
        "model": "jinaai/jina-clip-v2",
        "options": {
          "jina-api-key": "<YOUR_JINAAI_API_KEY>",
          "dimensions": 512
        }
      }
    }
  ]
}
```
