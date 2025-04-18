```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "query": [0.2, 0.8, ...],  // <-- dense vector
        "limit": 50
    }
    "query": {
        "formula": {
            "sum": [
                "$score,
                { 
                    "mult": [ 
                        0.5,
                        { 
                            "key": "tag",
                            "match": { "any": ["h1", "h2", "h3", "h4"] } } 
                    ]
                },
                {
                    "mult": [
                        0.25,
                        { 
                            "key": "tag",
                            "match": { "any": ["p", "li"] } 
                        }
                    ]
                }
            ]
        }
    }
}
```
