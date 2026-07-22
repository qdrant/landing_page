```typescript
client.query("books", {
  query: {
    text: "time travel",
    model: "qdrant/bm25",
  },
  using: "title-bm25",
  filter: {
    must: [
      { key: "tenant", match: { value: "acme" } },
      { key: "year", match: { value: 2024 } },
    ],
  },
  params: {
    idf: {
      corpus: {
        must: [{ key: "tenant", match: { value: "acme" } }],
      },
    },
  },
  limit: 10,
});
```
