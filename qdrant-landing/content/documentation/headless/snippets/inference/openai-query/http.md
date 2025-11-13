```http
POST /collections/<your-collection_name>/points/query
{
  "query": {
    "text": "How to bake cookies?",
    "model": "openai/text-embedding-3-large",
    "options": {
      "openai-api-key": "<YOUR_OPENAI_API_KEY>",
      "dimensions": 512
    }
  }
}
```
