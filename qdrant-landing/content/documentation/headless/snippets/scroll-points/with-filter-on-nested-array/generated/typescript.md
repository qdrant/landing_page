```typescript
client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.cities[].population",
        range: {
          gt: null,
          gte: 9.0,
          lt: null,
          lte: null,
        },
      },
    ],
  },
});
```
