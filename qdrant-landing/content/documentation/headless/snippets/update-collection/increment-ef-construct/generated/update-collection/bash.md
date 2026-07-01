```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw "{
    \"hnsw_config\": {
        \"ef_construct\": $((BASE_EF + 1))
    }
  }"
```
