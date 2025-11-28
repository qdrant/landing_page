```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
  limit: 1,
  with_payload: true,
  with_vector: false,
});
```
