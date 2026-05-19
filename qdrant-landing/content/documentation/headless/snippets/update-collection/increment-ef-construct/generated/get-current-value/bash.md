```bash
BASE_EF=$(curl -s http://localhost:6333/collections/{collection_name} | \
  jq '.result.config.hnsw_config.ef_construct')
```
