```typescript
client.query("books", {
  query: {
    text: "space opera",
    model: "sentence-transformers/all-minilm-l6-v2",
  },
  using: "description-dense",
  with_payload: true,
  filter: {
    must: [
      {
        key: "author",
        match: { any: ["Larry Niven", "Jerry Pournelle"] },
      },
    ],
  },
});
```
