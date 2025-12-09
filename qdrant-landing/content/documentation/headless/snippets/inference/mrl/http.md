```http
PUT /collections/{collection_name}/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "large": {
          "text": "Recipe for baking chocolate chip cookies",
          "model": "openai/text-embedding-3-small",
          "options": {
            "openai-api-key": "<YOUR_OPENAI_API_KEY>"
          }
        },
        "small": {
          "text": "Recipe for baking chocolate chip cookies",
          "model": "openai/text-embedding-3-small",
          "options": {
            "openai-api-key": "<YOUR_OPENAI_API_KEY>",
            "mrl": 64
          }
        }
      }
    }
  ]
}
```
