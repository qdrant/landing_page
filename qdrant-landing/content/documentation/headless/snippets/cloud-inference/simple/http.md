```http
# Insert new points with cloud-side inference
PUT /collections/<your-collection>/points?wait=true
{
  "points": [
    {
      "id": 1,
      "payload": { "topic": "cooking", "type": "dessert" },
      "vector": {
        "text": "Recipe for baking chocolate chip cookies",
        "model": "<the-model-to-use>"
      }
    }
  ]
}

# Search in the collection using cloud-side inference
POST /collections/<your-collection>/points/query
{
  "query": {
    "text": "How to bake cookies?",
    "model": "<the-model-to-use>"
  }
}
```
