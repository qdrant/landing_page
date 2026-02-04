```typescript
client.createCollection("books", {
  vectors: {
    "description-dense": { size: 384, distance: "Cosine" },
  },
  sparse_vectors: {
    "isbn-bm25": { modifier: "idf" },
  },
});
```
