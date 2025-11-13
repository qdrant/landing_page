```http
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
```