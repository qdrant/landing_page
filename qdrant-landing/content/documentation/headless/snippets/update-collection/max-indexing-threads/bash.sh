curl -X PATCH http://localhost:6333/collections/{collection_name} \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "hnsw_config": {
        "max_indexing_threads": 4
    }
  }'
