```http
POST /collections/{collection_name}/points/query
{
  "prefetch": { ... },
  "query": {
    "formula": {
      "sum": [
        "$score",
        {
          "gauss_decay":
            "target": { "datetime": <todays date> },
            "x": { "datetime_key": <payload key> },
            "scale": <1 week in seconds>
        }
      ]
    }
  }
}
```