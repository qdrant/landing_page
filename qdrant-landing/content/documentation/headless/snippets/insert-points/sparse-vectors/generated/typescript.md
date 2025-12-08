```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        text: {
          indices: [6, 7],
          values: [1.0, 2.0],
        },
      },
    },
    {
      id: 2,
      vector: {
        text: {
          indices: [1, 2, 3, 4, 5],
          values: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
      },
    },
  ],
});
```
