```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "relevance_feedback: {
      "target": [0.1, 0.9, 0.23, ...],
      "feedback": [
        { "example": 111, "score": 0.68 },
        { "example": 222, "score": 0.72 },
        { "example": 333, "score": 0.61 }
      ],
      "strategy": {
        "naive": { 
          "a": 0.12, 
          "b": 0.43, 
          "c": 0.03 
        }
      }
    ]
  }
}
```
