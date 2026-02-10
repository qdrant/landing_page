```http
PUT /collections/{collection_name}/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "text": "Recipe for baking chocolate chip cookies",
        "model": "openrouter/mistralai/mistral-embed-2312",
        "options": {
          "openrouter-api-key": "<YOUR_OPENROUTER_API_KEY>"
        }
      }
    }
  ]
}
```