```typescript
client.updateCollection("{collection_name}", {
  optimizers_config: {
    deleted_threshold: 0.2,
    vacuum_min_vector_number: 1000,
  },
});
```
