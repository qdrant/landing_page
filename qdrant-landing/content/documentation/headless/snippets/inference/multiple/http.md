```http
PUT /collections/{collection_name}/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "image": {
          "image": "https://qdrant.tech/example.png",
          "model": "jinaai/jina-clip-v2",
          "options": {
            "jina-api-key": "<YOUR_JINAAI_API_KEY>",
            "dimensions": 512
          }
        },
        "text": {
          "text": "Mars, the red planet",
          "model": "sentence-transformers/all-minilm-l6-v2"
        },
        "bm25": {
          "text": "Mars, the red planet",
          "model": "qdrant/bm25"
        }
      }
    }
  ]
}
```
