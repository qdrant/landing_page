```http
PUT /collections/<your-collection_name>/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "text": "Recipe for baking chocolate chip cookies",
        "model": "openai/text-embedding-3-large",
        "options": {
          "openai-api-key": "<YOUR_OPENAI_API_KEY>",
          "dimensions": 512
        }
      }
    }
  ]
}
```