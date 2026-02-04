```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "text": "How to bake cookies?",
    "model": "openrouter/mistralai/mistral-embed-2312",
    "options": {
      "openrouter-api-key": "<YOUR_OPENROUTER_API_KEY>"
    }
  }
}
```
