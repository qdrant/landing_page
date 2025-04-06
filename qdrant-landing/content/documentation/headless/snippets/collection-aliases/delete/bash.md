```bash
curl -X POST http://localhost:6333/collections/aliases \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "actions": [
        {
            "delete_alias": {
                "alias_name": "production_collection"
            }
        }
    ]
}'
```
