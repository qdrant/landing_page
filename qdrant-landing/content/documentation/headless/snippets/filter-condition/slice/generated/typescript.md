```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        slice: {
          index: 3,
          total: 8,
        },
      },
    ],
  },
});
```
