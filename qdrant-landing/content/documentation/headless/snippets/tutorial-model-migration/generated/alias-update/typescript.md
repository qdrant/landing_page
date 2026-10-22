```typescript
await client.updateCollectionAliases({
  actions: [
    {
      delete_alias: {
        alias_name: "prod",
      },
    },
    {
      create_alias: {
        collection_name: NEW_COLLECTION,
        alias_name: "prod",
      },
    },
  ],
});
```
