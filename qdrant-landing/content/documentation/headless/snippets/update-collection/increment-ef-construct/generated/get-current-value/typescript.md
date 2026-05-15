```typescript
const collectionInfo = await client.getCollection("{collection_name}");
const baseEf = collectionInfo.config.hnsw_config.ef_construct;
```
