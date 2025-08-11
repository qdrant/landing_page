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
                "$score", // the final score = score + exp_decay(target_time - x_time)
                {
                    "exp_decay": {
                        "x": {
                            "datetime_key": "upload_time" // payload key
                        },
                        "target": {
                            "datetime": "2025-08-04T00:00:00Z" // target time, for example, time of the search
                        },
                        "scale": 86400, // 1 week in seconds
                        "midpoint": 0.1 // 0.1 output with deviation on `scale` (1 week) from `target`
                    }
                }
            ]
        }
    }
}
```
