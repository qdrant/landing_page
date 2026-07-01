```bash
curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "params": {
        "read_fan_out_delay_ms": 100
    }
  }'
```
