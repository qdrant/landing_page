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
                            "datetime_key": "update_time" // payload key
                        },
                        "target": {
                            "datetime": "YYYY-MM-DDT00:00:00Z" // current datetime
                        },
                        "scale": 86400, // 1 day in seconds
                        "midpoint": 0.5 // if item's "update_time" is more than 1 day apart from current datetime, relevance score is less than 0.5
                    }
                }
            ]
        }
    }
}
```
