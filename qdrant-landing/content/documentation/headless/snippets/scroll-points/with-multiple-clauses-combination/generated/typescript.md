```typescript
client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "city",
        match: { value: "London" },
      },
    ],
    must_not: [
      {
        key: "color",
        match: { value: "red" },
      },
    ],
  },
});
```
