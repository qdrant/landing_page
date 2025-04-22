```http
POST /collections/{collection_name}/points/query
{
    "prefetch": { "query": [0.2, 0.8, ...], "limit": 50 },
    "query": {
        "formula": {
            "sum": [
                "$score",
                {
                    "gauss_decay": {
                        "x": {
                            "geo_distance": {
                                "origin": { "lat": 52.504043, "lon": 13.393236 }
                                "to": "geo.location"
                            }
                        },
                        "scale": 5000 // 5km
                    }
                }
            ]
        },
        "defaults": { "geo.location": {"lat": 48.137154, "lon": 11.576124} }
    }
}
```
