```typescript
const hybridQuery = await sie.encode(
  "BAAI/bge-m3",
  { text: "What is Qdrant?" },
  { outputTypes: ["dense", "sparse"], isQuery: true },
);

const { points: hybridHits } = await client.query("{hybrid_collection_name}", {
  prefetch: [
    { query: denseEmbedding(hybridQuery), using: "dense", limit: 20 },
    { query: sparseEmbedding(hybridQuery), using: "sparse", limit: 20 },
  ],
  query: { fusion: "rrf" },
  limit: 3,
});
```
