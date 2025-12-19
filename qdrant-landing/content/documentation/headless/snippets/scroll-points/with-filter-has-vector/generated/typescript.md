```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        has_vector: "image",
      },
    ],
  },
});
```
