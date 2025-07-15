```bash
# Create a new vector
curl -X PUT "https://xyz-example.qdrant.io:6333/collections/<your-collection>/points?wait=true" \
  -H "Content-Type: application/json" \
  -H "api-key: <paste-your-api-key-here>" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": {
          "text": "https://qdrant.tech/example.png",
          "model": "qdrant/clip-vit-b-32-vision"
        },
        "payload": {
          "title": "Example Image"
        }
      }
    ]
  }'

# Perform a search query
curl -X POST "https://xyz-example.qdrant.io:6333/collections/<your-collection>/points/query" \
  -H "Content-Type: application/json" \
  -H "api-key: <paste-your-api-key-here>" \
  -d '{
    "query": {
      "text": "Mission to Mars",
      "model": "qdrant/clip-vit-b-32-text"
    }
  }'
```
