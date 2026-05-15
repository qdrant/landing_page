```typescript
const collectionInfo = await client.getCollection("{collection_name}");
const baseEf = collectionInfo.config.hnsw_config.ef_construct;

await client.updateCollection("{collection_name}", {
  hnsw_config: {
    ef_construct: baseEf + 1,
  },
});
```
