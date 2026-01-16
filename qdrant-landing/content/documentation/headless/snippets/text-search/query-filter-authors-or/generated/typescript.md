```typescript
client.query("books", {
  query: {
    text: "space opera",
    model: "sentence-transformers/all-minilm-l6-v2",
  },
  using: "description-dense",
  with_payload: true,
  filter: {
    should: [
      { key: "author", match: { value: "Larry Niven" } },
      { key: "author", match: { value: "Jerry Pournelle" } },
    ],
  },
});
```
