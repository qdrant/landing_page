```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "metadata": {
      "my-metadata-field": {
        "key-a": "value-a",
        "key-b": 42    
      }
    }
  }'
```
