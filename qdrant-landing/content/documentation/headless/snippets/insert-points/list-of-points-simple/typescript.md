```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: { color: "red" },
      vector: [0.9, 0.1, 0.1],
    },
    {
      id: 2,
      payload: { color: "green" },
      vector: [0.1, 0.9, 0.1],
    },
    {
      id: 3,
      payload: { color: "blue" },
      vector: [0.1, 0.1, 0.9],
    },
  ],
});
```
