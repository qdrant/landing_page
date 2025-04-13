```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "prefetch": {
            "query": [1, 23, 45, 67], // <------ small byte vector
            "using": "mrl_byte"
            "limit": 1000
        },
        "query": [0.01, 0.45, 0.67, ...], // <-- full dense vector
        "using": "full"
        "limit": 100
    },
    "query": [           // <─┐
        [0.1, 0.2, ...], // < │
        [0.2, 0.1, ...], // < ├─ multi-vector
        [0.8, 0.9, ...]  // < │
    ],                   // <─┘       
    "using": "colbert",
    "limit": 10
}
```
