curl -X PUT http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "strict_mode_config": {
      "enabled":" true,
      "max_query_limit": 10
    }
  }'
