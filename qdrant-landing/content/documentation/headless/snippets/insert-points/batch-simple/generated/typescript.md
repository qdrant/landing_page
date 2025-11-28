```typescript
client.upsert("{collection_name}", {
  batch: {
    ids: [1, 2, 3],
    payloads: [{ color: "red" }, { color: "green" }, { color: "blue" }],
    vectors: [
      [0.9, 0.1, 0.1],
      [0.1, 0.9, 0.1],
      [0.1, 0.1, 0.9],
    ],
  },
});
```
