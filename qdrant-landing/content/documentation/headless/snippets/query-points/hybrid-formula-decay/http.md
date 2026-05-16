```http
POST /collections/{collection_name}/points/query
{
    "prefetch": {
        "prefetch": [
            {
                "query": {
                    "indices": [1, 42],    // <┐
                    "values": [0.22, 0.8]  // <┴─sparse vector
                },
                "using": "sparse",
                "limit": 100
            },
            {
                "query": [0.01, 0.45, 0.67, ...], // <-- dense vector
                "using": "dense",
                "limit": 100
            }
        ],
        "query": { "rrf": {} },
        "limit": 100
    },
    "query": {
        "formula": {
            "sum": [
                "$score", // the fused score from the RRF prefetch
                {
                    "exp_decay": {
                        "x": {
                            "datetime_key": "published_at"
                        },
                        "target": {
                            "datetime": "YYYY-MM-DDT00:00:00Z"
                        },
                        "scale": 15552000, // 180 days in seconds
                        "midpoint": 0.5
                    }
                }
            ]
        }
    },
    "limit": 10
}
```
