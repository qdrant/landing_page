```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "SIE serves open embedding models from one endpoint.",
];

const results = await sie.encode(
  MODEL,
  documents.map((text) => ({ text })),
);

await client.upsert("{collection_name}", {
  points: results.map((result, idx) => ({
    id: idx,
    vector: denseEmbedding(result),
    payload: { text: documents[idx] },
  })),
});
```
