```http
# Insert new points with cloud-side inference
PUT /collections/<your-collection>/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "image": "https://qdrant.tech/example.png",
        "model": "qdrant/clip-vit-b-32-vision"
      },
      "payload": {
        "title": "Example Image"
      }
    }
  ]
}

# Search in the collection using cloud-side inference
POST /collections/<your-collection>/points/query
{
  "query": {
    "text": "Mission to Mars",
    "model": "qdrant/clip-vit-b-32-text"
  }
}
```
