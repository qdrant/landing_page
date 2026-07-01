```typescript
await client.updateCollection("{collection_name}", {
  hnsw_config: {
    ef_construct: baseEf + 1,
  },
});
```
