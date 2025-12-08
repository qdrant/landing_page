```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        nested: {
          key: "diet",
          filter: {
            must: [
              {
                key: "food",
                match: { value: "meat" },
              },
              {
                key: "likes",
                match: { value: true },
              },
            ],
          },
        },
      },
    ],
  },
});
```
