```http
POST /collections/{collection_name}/points/query
{
  "prefetch": {
    "query": [0.2, 0.8, ...],   // <-- dense vector for the query
    "limit": 50
  },
  "query": {
    "formula": {
      "sum": [
        "$score", // Semantic score
        {
          "mult": [
            0.5, // weight for title
            { // Filter for title
              "key": "tag",
              "match": { "any": ["h1","h2","h3","h4"] } 
            }
          ]
        },
        {
          "mult": [
            0.25, // weight for paragraph
            { // Filter for paragraph
              "key": "tag",
              "match": { "any": ["p","li"] } 
            }
          ]
        }
      ]
    }
  }
}
```