curl -X PUT \
  'https://xyz-example.qdrant.io:6333/collections/items' \
  --header 'api-key: <your-api-key>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  }
}'
