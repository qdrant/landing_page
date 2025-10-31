```http
// Create the collection for vectors with 512 dimensions.
PUT /collections/<your-collection_name>
{
  "vectors": {
    "size": 512,
    "distance": "Cosine"
  }
}

// Ingest a point. Provide the model name, prepended with "cohere/". 
// Provide the Cohere API key in the "options" object.
PUT /collections/<your-collection_name>/points?wait=true
{
  "points": [
    {
      "id": 1,
      "vector": {
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC",
        "model": "cohere/embed-v4.0",
        "options": {
          "cohere-api-key": "<YOUR_COHERE_API_KEY>",
          "output_dimension": 512
        }
      }
    }
  ]
}

// Query the data by providing the model name, prepended with "cohere/" 
// and the Cohere API key.
POST /collections/<your-collection_name>/points/query
{
  "query": {
    "text": "a green square",
    "model": "cohere/embed-v4.0",
    "options": {
      "cohere-api-key": "<YOUR_COHERE_API_KEY>",
      "output_dimension": 512
    }
  }
}
```
