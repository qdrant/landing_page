```typescript
client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.name",
        match: { value: "Germany" },
      },
    ],
  },
});
```
