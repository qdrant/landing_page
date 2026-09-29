```typescript
client.scroll("{collection_name}", {
  filter: {
    must_not: [
      {
        key: "city",
        match: { value: "London" },
      },
      {
        key: "color",
        match: { value: "red" },
      },
    ],
  },
});
```
