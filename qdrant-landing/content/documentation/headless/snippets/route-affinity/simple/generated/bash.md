```bash
curl -X POST http://localhost:6333/collections/{collection_name}/points/query \
    --header 'api-key: your_api_key_here' \
    --header 'X-Qdrant-Route-Affinity: user-42' \
    --header 'Content-Type: application/json' \
    --data '{
        "query": [0.2, 0.1, 0.9, 0.7],
        "limit": 3
    }'
```
