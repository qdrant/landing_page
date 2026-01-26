```typescript
client.createCollection("books", {
  sparse_vectors: {
    "title-bm25": { modifier: "idf" },
  },
});
```
