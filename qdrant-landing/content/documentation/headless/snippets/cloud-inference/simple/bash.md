```bash
# Create a new vector    
curl -X PUT "https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333/collections/<your-collection>/points?wait=true" \\
  -H "Content-Type: application/json" \\
  -H "api-key: <paste-your-api-key-here>" \\
  -d '{
    "points": [
      {
        "id": 1,
        "payload": { "topic": "cooking", "type": "dessert" },
        "vector": {
          "text": "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.",
          "model": "<the-model-to-use>"
        }
      }
    ]
  }'
  
# Perform a search query
curl -X POST "https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333/collections/<your-collection>/points/query" \\
  -H "Content-Type: application/json" \\
  -H "api-key: <paste-your-api-key-here>" \\
  -d '{
    "query": {
      "text": "Recipe for baking chocolate chip cookies",
      "model": "<the-model-to-use>"
    }
  }' 
```
