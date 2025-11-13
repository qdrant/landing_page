```http
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