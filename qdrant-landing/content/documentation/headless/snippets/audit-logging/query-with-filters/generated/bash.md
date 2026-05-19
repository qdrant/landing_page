```bash
curl -X POST 'https://YOUR-CLUSTER-URL:6333/audit/logs' \
  -H 'api-key: QDRANT_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 50,
    "time_from": "2026-03-26T00:00:00Z",
    "time_to": "2026-03-27T00:00:00Z",
    "filters": {
      "result": "denied",
      "collection": "my_collection"
    }
  }'
```
