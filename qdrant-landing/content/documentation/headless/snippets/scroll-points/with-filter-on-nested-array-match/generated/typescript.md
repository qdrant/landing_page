```typescript
client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.cities[].sightseeing",
        match: { value: "Osaka Castle" },
      },
    ],
  },
});
```
