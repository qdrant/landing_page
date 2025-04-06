```bash
curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
      "size": 300,
      "distance": "Cosine"
    } 
  }'
```
