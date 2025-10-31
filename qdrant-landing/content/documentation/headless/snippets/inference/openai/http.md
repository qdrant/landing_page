```http
// Configure the collection for vectors with 512 dimensions.
PUT /collections/<your-collection_name>
{
  "vectors": {
    "size": 512,
    "distance": "Cosine"
  }
}

// Ingest a point. Provide the model name, prepended with "openai/". 
// Provide the OpenAI API key in the "options" object.
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

// Retrieve the point to see the generated embeddings
GET /collections/<your-collection_name>/points/1

// Query the data by providing the model name, prepended with "openai/" 
// and the OpenAI API key.
POST /collections/<your-collection_name>/points/query
{
  "query": {
    "text": "How to bake cookies?",
    "model": "openai/text-embedding-3-large",
    "options": {
      "openai-api-key": "<YOUR_OPENAI_API_KEY>",
      "dimensions": 512
    }
  }
}
```
