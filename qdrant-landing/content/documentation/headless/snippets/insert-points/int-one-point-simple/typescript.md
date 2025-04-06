```typescript
client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: {
        color: "red",
      },
      vector: [0.9, 0.1, 0.1],
    },
  ],
});
```
