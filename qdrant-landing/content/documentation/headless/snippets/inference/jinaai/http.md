```http
// Create the collection for vectors with 512 dimensions.
PUT /collections/<your-collection_name>
{
  "vectors": {
    "size": 512,
    "distance": "Cosine"
  }
}

// Ingest a point. Provide the model name, prepended with "jinaai/". 
// Provide the Jina AI API key in the "options" object.
PUT /collections/<your-collection_name>/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "image": "https://qdrant.tech/example.png",
        "model": "jinaai/jina-clip-v2",
        "options": {
          "jina-api-key": "<YOUR_JINAAI_API_KEY>",
          "dimensions": 512
        }
      }
    }
  ]
}

// Query the data by providing the model name, prepended with "jinaai/" 
// and the Jina AI API key.
POST /collections/<your-collection_name>/points/query
{
  "query": {
    "text": "Mission to Mars",
    "model": "jinaai/jina-clip-v2",
    "options": {
      "jina-api-key": "<YOUR_JINAAI_API_KEY>",
      "dimensions": 512
    }
  }
}
```
