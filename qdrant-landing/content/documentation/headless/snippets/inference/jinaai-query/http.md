```http
POST /collections/<your-collection_name>/points/query
{
  "query": {
    "text": "Mission to Mars",
    "model": "jinaai/jina-clip-v2",
    "options": {
      "jina-api-key": "<YOUR_JINAAI_API_KEY>",
      "dimensions": 512
    }
  }
}
```
