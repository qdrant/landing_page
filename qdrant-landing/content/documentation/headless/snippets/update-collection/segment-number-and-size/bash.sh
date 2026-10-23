curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "optimizers_config": {
        "default_segment_number": 4,
        "max_segment_size": 1000000
    }
  }'
