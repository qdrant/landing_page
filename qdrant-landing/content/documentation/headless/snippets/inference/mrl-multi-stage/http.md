```http
POST /collections/{collection_name}/points/query
{
  "prefetch": {
    "query": {
      "text": "How to bake cookies?",
      "model": "openai/text-embedding-3-small",
      "options": {
        "openai-api-key": "<YOUR_OPENAI_API_KEY>",
        "mrl": 64
      }
    },
    "using": "small",
    "limit": 1000
  },
  "query": {
    "text": "How to bake cookies?",
    "model": "openai/text-embedding-3-small",
    "options": {
      "openai-api-key": "<YOUR_OPENAI_API_KEY>"
    }
  },
  "using": "large",
  "limit": 10
}
```
