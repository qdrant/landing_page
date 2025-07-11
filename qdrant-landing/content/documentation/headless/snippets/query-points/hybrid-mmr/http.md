```http
POST /collections/{collection_name}/points/query
{
  "query": {
    "nearest": [0.01, 0.45, 0.67, ...], // search vector
    "mmr": {
      "diversity": 0.5, // 0.0 - relevance; 1.0 - diversity
      "candidates_limit": 100 // num of candidates to preselect
    }
  },
  "limit": 10
}
```
