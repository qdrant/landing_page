curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "strict_mode_config": {
      "enabled":" true,
      "read_rate_limit": 1000,
      "write_rate_limit": 100,
    }
  }'
